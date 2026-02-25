<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Assets\Models\AssetMovement;
use App\Modules\Assets\Services\DepreciationCalculator;
use App\Modules\Assets\Services\QRCodeGenerator;
use App\Modules\Assets\Events\AssetCreated;
use App\Modules\Assets\Events\AssetMoved;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssetController extends Controller
{
    private QRCodeGenerator $qrGenerator;
    private DepreciationCalculator $depreciationCalculator;

    public function __construct(
        QRCodeGenerator $qrGenerator,
        DepreciationCalculator $depreciationCalculator
    ) {
        $this->qrGenerator = $qrGenerator;
        $this->depreciationCalculator = $depreciationCalculator;
    }

    /**
     * Listar activos con filtros y paginación
     */
    public function index(Request $request)
    {
        $query = Asset::with(['categoria', 'ubicacion', 'proveedor', 'responsable']);

        // Filtros
        if ($request->has('categoria_id')) {
            $query->where('categoria_id', $request->categoria_id);
        }

        if ($request->has('ubicacion_id')) {
            $query->where('ubicacion_id', $request->ubicacion_id);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('responsable_id')) {
            $query->where('responsable_id', $request->responsable_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('nombre', 'like', "%{$search}%")
                  ->orWhere('serie', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $assets = $query->paginate($perPage);

        return response()->json($assets);
    }

    /**
     * Ver detalles de un activo
     */
    public function show(Asset $asset)
    {
        $asset->load([
            'categoria',
            'ubicacion',
            'proveedor',
            'responsable',
            'movimientos' => function ($q) {
                $q->latest()->limit(10);
            },
            'valuaciones' => function ($q) {
                $q->latest();
            },
        ]);

        // Agregar depreciación actual
        $depreciacionActual = $this->depreciationCalculator->getCurrentValuation($asset);
        $asset->append('depreciacion_actual');

        return response()->json($asset);
    }

    /**
     * Crear nuevo activo
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|unique:assets,codigo',
            'nombre' => 'required|string',
            'descripcion' => 'nullable|string',
            'marca' => 'nullable|string',
            'modelo' => 'nullable|string',
            'serie' => 'nullable|string',
            'categoria_id' => 'required|exists:asset_categories,id',
            'ubicacion_id' => 'required|exists:asset_locations,id',
            'proveedor_id' => 'nullable|exists:suppliers,id',
            'responsable_id' => 'nullable|exists:users,id',
            'valor_compra' => 'required|numeric|min:0',
            'valor_residual' => 'nullable|numeric|min:0',
            'vida_util_anos' => 'nullable|integer|min:1',
            'fecha_adquisicion' => 'required|date',
        ]);

        try {
            $asset = Asset::create($validated);

            // Calcular depreciación
            $this->depreciationCalculator->saveDepreciation($asset);

            // Disparar evento
            AssetCreated::dispatch($asset);

            return response()->json(['mensaje' => 'Activo creado exitosamente', 'activo' => $asset], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear activo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar activo
     */
    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'nombre' => 'nullable|string',
            'descripcion' => 'nullable|string',
            'marca' => 'nullable|string',
            'modelo' => 'nullable|string',
            'serie' => 'nullable|string',
            'categoria_id' => 'nullable|exists:asset_categories,id',
            'ubicacion_id' => 'nullable|exists:asset_locations,id',
            'proveedor_id' => 'nullable|exists:suppliers,id',
            'responsable_id' => 'nullable|exists:users,id',
            'estado' => 'nullable|in:activo,mantenimiento,inactivo,descartado,retirado',
            'valor_residual' => 'nullable|numeric|min:0',
            'vida_util_anos' => 'nullable|integer|min:1',
        ]);

        try {
            $asset->update($validated);

            return response()->json(['mensaje' => 'Activo actualizado exitosamente', 'activo' => $asset]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar activo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar activo
     */
    public function destroy(Asset $asset)
    {
        try {
            $asset->delete();
            return response()->json(['mensaje' => 'Activo eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar activo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generar QR on-the-fly
     */
    public function generateQR(Asset $asset)
    {
        try {
            $qrBinary = $this->qrGenerator->generateQRCodeBinary($asset);

            // Registrar acceso
            $this->qrGenerator->logAccess($asset);

            return response($qrBinary, 200, [
                'Content-Type' => 'image/png',
                'Content-Disposition' => "attachment; filename=\"QR_{$asset->codigo}.png\"",
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al generar QR: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Registrar movimiento de activo
     */
    public function recordMovement(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'ubicacion_nueva_id' => 'required|exists:asset_locations,id',
            'responsable_nuevo_id' => 'nullable|exists:users,id',
            'tipo' => 'required|in:traslado,reubicacion,mantenimiento,otro',
            'motivo' => 'nullable|string',
        ]);

        try {
            $movement = $asset->movimientos()->create([
                ...$validated,
                'ubicacion_anterior_id' => $asset->ubicacion_id,
                'responsable_anterior_id' => $asset->responsable_id,
                'usuario_id' => auth()->id(),
            ]);

            // Actualizar ubicación y responsable del activo
            $asset->update([
                'ubicacion_id' => $validated['ubicacion_nueva_id'],
                'responsable_id' => $validated['responsable_nuevo_id'] ?? $asset->responsable_id,
            ]);

            // Disparar evento
            AssetMoved::dispatch($movement);

            return response()->json(['mensaje' => 'Movimiento registrado exitosamente', 'movimiento' => $movement], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al registrar movimiento: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtener opciones para selects (categorías, ubicaciones, proveedores)
     */
    public function getOptions()
    {
        return response()->json([
            'categorias' => AssetCategory::select('id', 'nombre')->get(),
            'ubicaciones' => AssetLocation::select('id', 'nombre')->get(),
            'estados' => [
                'activo' => 'Activo',
                'mantenimiento' => 'En Mantenimiento',
                'inactivo' => 'Inactivo',
                'descartado' => 'Descartado',
                'retirado' => 'Retirado',
            ],
        ]);
    }
}
