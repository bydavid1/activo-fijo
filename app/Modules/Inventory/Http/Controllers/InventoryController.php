<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\InventoryCycle;
use App\Modules\Inventory\Models\InventoryCapture;
use App\Modules\Inventory\Models\InventoryDiscrepancy;
use App\Modules\Inventory\Models\DiscrepancyTransition;
use App\Modules\Assets\Models\Asset;
use App\Modules\Inventory\Events\DiscrepancyDetected;
use App\Modules\Inventory\Events\DiscrepancyApproved;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Listar ciclos de inventario
     */
    public function listCycles(Request $request)
    {
        $query = InventoryCycle::with(['ubicacion', 'usuarioResponsable']);

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('ubicacion_id')) {
            $query->where('ubicacion_id', $request->ubicacion_id);
        }

        $perPage = $request->get('per_page', 15);
        $ciclos = $query->latest()->paginate($perPage);

        return response()->json($ciclos);
    }

    /**
     * Crear nuevo ciclo de inventario
     */
    public function createCycle(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string',
            'ubicacion_id' => 'required|exists:asset_locations,id',
            'usuario_responsable_id' => 'required|exists:users,id',
            'notas' => 'nullable|string',
        ]);

        try {
            $ciclo = InventoryCycle::create([
                ...$validated,
                'estado' => 'planeado',
                'fecha_inicio' => now()->toDateString(),
            ]);

            return response()->json(['mensaje' => 'Ciclo creado exitosamente', 'ciclo' => $ciclo], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear ciclo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar estado del ciclo
     */
    public function updateCycleStatus(Request $request, InventoryCycle $cycle)
    {
        $validated = $request->validate([
            'estado' => 'required|in:planeado,en_ejecucion,captura_completa,en_reconciliacion,completado',
        ]);

        try {
            $cycle->update($validated);
            return response()->json(['mensaje' => 'Ciclo actualizado exitosamente', 'ciclo' => $cycle]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar ciclo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Capturar activo en ciclo de inventario
     */
    public function captureAsset(Request $request, InventoryCycle $cycle)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'metodo' => 'required|in:manual,qr',
        ]);

        try {
            $capture = $cycle->capturas()->create([
                ...$validated,
                'capturado_por_id' => auth()->id(),
            ]);

            // Detectar discrepancias
            $this->detectDiscrepancies($cycle, $capture->asset);

            return response()->json(['mensaje' => 'Activo capturado exitosamente', 'captura' => $capture], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al capturar activo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Detectar discrepancias (auxiliar)
     */
    private function detectDiscrepancies(InventoryCycle $cycle, Asset $asset): void
    {
        $capturado = $cycle->capturas()->where('asset_id', $asset->id)->exists();

        // Validar si el activo está en la ubicación correcta
        if ($asset->ubicacion_id !== $cycle->ubicacion_id && $capturado) {
            $discrepancia = $cycle->discrepancias()->create([
                'asset_id' => $asset->id,
                'estado' => 'detectada',
                'tipo_discrepancia' => 'ubicacion_incorrecta',
                'descripcion' => "Activo encontrado en ubicación {$asset->ubicacion->nombre}",
                'usuario_id' => auth()->id(),
            ]);

            DiscrepancyDetected::dispatch($discrepancia);
        }
    }

    /**
     * Listar discrepancias de un ciclo
     */
    public function listDiscrepancies(InventoryCycle $cycle, Request $request)
    {
        $query = $cycle->discrepancias()->with(['activo', 'usuario', 'aprobadoPor']);

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $discrepancias = $query->latest()->paginate(15);

        return response()->json($discrepancias);
    }

    /**
     * Aprobar discrepancia (solo Asset Manager)
     */
    public function approveDiscrepancy(Request $request, InventoryDiscrepancy $discrepancy)
    {
        $validated = $request->validate([
            'notas_aprobacion' => 'nullable|string',
        ]);

        try {
            // Registrar transición
            DiscrepancyTransition::create([
                'discrepancy_id' => $discrepancy->id,
                'estado_anterior' => $discrepancy->estado,
                'estado_nuevo' => 'aprobada',
                'usuario_id' => auth()->id(),
                'razon' => $validated['notas_aprobacion'] ?? null,
            ]);

            // Actualizar discrepancia
            $discrepancy->update([
                'estado' => 'aprobada',
                'aprobado_por_id' => auth()->id(),
                'notas_aprobacion' => $validated['notas_aprobacion'] ?? null,
            ]);

            DiscrepancyApproved::dispatch($discrepancy);

            return response()->json(['mensaje' => 'Discrepancia aprobada exitosamente', 'discrepancia' => $discrepancy]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al aprobar discrepancia: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Rechazar discrepancia
     */
    public function rejectDiscrepancy(Request $request, InventoryDiscrepancy $discrepancy)
    {
        $validated = $request->validate([
            'razon' => 'required|string',
        ]);

        try {
            // Registrar transición
            DiscrepancyTransition::create([
                'discrepancy_id' => $discrepancy->id,
                'estado_anterior' => $discrepancy->estado,
                'estado_nuevo' => 'rechazada',
                'usuario_id' => auth()->id(),
                'razon' => $validated['razon'],
            ]);

            // Actualizar discrepancia
            $discrepancy->update([
                'estado' => 'rechazada',
            ]);

            return response()->json(['mensaje' => 'Discrepancia rechazada', 'discrepancia' => $discrepancy]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al rechazar discrepancia: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Ver transiciones de una discrepancia
     */
    public function getTransitions(InventoryDiscrepancy $discrepancy)
    {
        $transiciones = $discrepancy->transiciones()
            ->with('usuario')
            ->latest()
            ->get();

        return response()->json($transiciones);
    }
}
