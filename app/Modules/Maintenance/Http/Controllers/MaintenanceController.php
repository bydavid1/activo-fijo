<?php

namespace App\Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Maintenance\Models\MaintenanceOrder;
use App\Modules\Maintenance\Models\MaintenanceHistory;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    /**
     * Listar órdenes de mantenimiento
     */
    public function index(Request $request)
    {
        $query = MaintenanceOrder::with(['activo', 'asignadoA', 'usuario']);

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        $perPage = $request->get('per_page', 15);
        $ordenes = $query->latest()->paginate($perPage);

        return response()->json($ordenes);
    }

    /**
     * Ver detalles de una orden
     */
    public function show(MaintenanceOrder $order)
    {
        $order->load([
            'activo',
            'asignadoA',
            'usuario',
            'historial' => function ($q) {
                $q->latest();
            },
        ]);

        return response()->json($order);
    }

    /**
     * Crear orden de mantenimiento
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'tipo' => 'required|in:preventivo,correctivo',
            'descripcion' => 'nullable|string',
            'fecha_programada' => 'nullable|date',
            'costo_estimado' => 'nullable|numeric|min:0',
            'asignado_a_id' => 'nullable|exists:users,id',
        ]);

        try {
            $numero = 'MTO-' . date('Y') . '-' . str_pad(MaintenanceOrder::whereYear('created_at', date('Y'))->count() + 1, 5, '0', STR_PAD_LEFT);

            $orden = MaintenanceOrder::create([
                ...$validated,
                'numero' => $numero,
                'estado' => 'pendiente',
                'usuario_id' => auth()->id(),
            ]);

            return response()->json(['mensaje' => 'Orden creada exitosamente', 'orden' => $orden], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear orden: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar orden de mantenimiento
     */
    public function update(Request $request, MaintenanceOrder $order)
    {
        $validated = $request->validate([
            'descripcion' => 'nullable|string',
            'fecha_programada' => 'nullable|date',
            'costo_estimado' => 'nullable|numeric|min:0',
            'asignado_a_id' => 'nullable|exists:users,id',
        ]);

        try {
            $order->update($validated);
            return response()->json(['mensaje' => 'Orden actualizada exitosamente', 'orden' => $order]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar orden: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cambiar estado de la orden
     */
    public function updateStatus(Request $request, MaintenanceOrder $order)
    {
        $validated = $request->validate([
            'estado' => 'required|in:pendiente,programado,en_ejecucion,completado,cancelado',
            'costo_real' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $estadoAnterior = $order->estado;

            // Actualizar orden
            if ($validated['estado'] === 'completado') {
                $order->update([
                    'estado' => $validated['estado'],
                    'fecha_completada' => now()->toDateString(),
                    'costo_real' => $validated['costo_real'] ?? $order->costo_real,
                ]);
            } else {
                $order->update(['estado' => $validated['estado']]);
            }

            // Registrar en historial
            MaintenanceHistory::create([
                'maintenance_order_id' => $order->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $validated['estado'],
                'observaciones' => $validated['observaciones'] ?? null,
                'usuario_id' => auth()->id(),
            ]);

            return response()->json(['mensaje' => 'Estado actualizado exitosamente', 'orden' => $order]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar estado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar orden
     */
    public function destroy(MaintenanceOrder $order)
    {
        try {
            $order->delete();
            return response()->json(['mensaje' => 'Orden eliminada exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar orden: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Ver historial de una orden
     */
    public function getHistory(MaintenanceOrder $order)
    {
        $historial = $order->historial()
            ->with('usuario')
            ->latest()
            ->get();

        return response()->json($historial);
    }

    /**
     * Obtener opciones (estados, tipos)
     */
    public function getOptions()
    {
        return response()->json([
            'tipos' => [
                'preventivo' => 'Preventivo',
                'correctivo' => 'Correctivo',
            ],
            'estados' => [
                'pendiente' => 'Pendiente',
                'programado' => 'Programado',
                'en_ejecucion' => 'En Ejecución',
                'completado' => 'Completado',
                'cancelado' => 'Cancelado',
            ],
        ]);
    }
}
