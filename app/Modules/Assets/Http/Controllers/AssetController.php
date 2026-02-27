<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Assets\Models\AssetMovement;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Assets\Models\AssetValuation;
use App\Modules\Assets\Models\AssetType;
use App\Modules\Assets\Models\AssetCustomValue;
use App\Modules\Assets\Services\DepreciationCalculator;
use App\Modules\Assets\Services\QRCodeGenerator;
use App\Modules\Assets\Events\AssetCreated;
use App\Modules\Assets\Events\AssetMoved;
use App\Modules\Assets\Events\AssetDisposed;
use App\Modules\Assets\Events\AssetRevalued;
use App\Modules\Employees\Models\Employee;
use App\Modules\Suppliers\Models\Supplier;
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
        $query = Asset::with(['categoria', 'ubicacion', 'proveedor', 'responsable', 'tipoBien', 'customValues.property']);

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
            'tipoBien.properties',
            'customValues.property',
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
            'responsable_id' => 'nullable|exists:employees,id',
            'valor_compra' => 'required|numeric|min:0',
            'valor_residual' => 'nullable|numeric|min:0',
            'vida_util_anos' => 'nullable|integer|min:1',
            'fecha_adquisicion' => 'required|date',
            'metodo_depreciacion' => 'nullable|string|in:lineal,acelerada,unidades_producidas',
            'asset_type_id' => 'nullable|exists:asset_types,id',
            'custom_values' => 'nullable|array',
            'custom_values.*.property_id' => 'required_with:custom_values|exists:asset_type_properties,id',
            'custom_values.*.valor' => 'nullable|string',
        ]);

        try {
            // Si se eligió un tipo de bien, aplicar defaults
            if (!empty($validated['asset_type_id'])) {
                $tipoBien = AssetType::find($validated['asset_type_id']);
                // Si el tipo no es depreciable, forzar vida_util a null
                if ($tipoBien && !$tipoBien->es_depreciable) {
                    $validated['vida_util_anos'] = null;
                    $validated['valor_residual'] = 0;
                }
                // Aplicar vida útil default si no se proporcionó
                if ($tipoBien && $tipoBien->vida_util_default && empty($validated['vida_util_anos'])) {
                    $validated['vida_util_anos'] = $tipoBien->vida_util_default;
                }
            }

            // Pre-llenar metodo_depreciacion desde categoría si no se envía
            if (empty($validated['metodo_depreciacion'])) {
                $categoria = AssetCategory::find($validated['categoria_id']);
                $validated['metodo_depreciacion'] = $categoria->metodo_depreciacion ?? 'lineal';
            }

            // Extraer custom_values antes de crear
            $customValues = $validated['custom_values'] ?? [];
            unset($validated['custom_values']);

            $asset = Asset::create($validated);

            // Guardar valores personalizados
            foreach ($customValues as $cv) {
                if ($cv['valor'] !== null && $cv['valor'] !== '') {
                    AssetCustomValue::create([
                        'asset_id' => $asset->id,
                        'asset_type_property_id' => $cv['property_id'],
                        'valor' => $cv['valor'],
                    ]);
                }
            }

            // Calcular depreciación (solo si es depreciable)
            $esDep = $asset->tipoBien?->es_depreciable ?? true;
            if ($esDep) {
                $this->depreciationCalculator->saveDepreciation($asset);
            }

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
            'responsable_id' => 'nullable|exists:employees,id',
            'estado' => 'nullable|in:activo,mantenimiento,inactivo,descartado,retirado',
            'valor_residual' => 'nullable|numeric|min:0',
            'vida_util_anos' => 'nullable|integer|min:1',
            'metodo_depreciacion' => 'nullable|string|in:lineal,acelerada,unidades_producidas',
            'asset_type_id' => 'nullable|exists:asset_types,id',
            'custom_values' => 'nullable|array',
            'custom_values.*.property_id' => 'required_with:custom_values|exists:asset_type_properties,id',
            'custom_values.*.valor' => 'nullable|string',
        ]);

        try {
            // Extraer custom_values antes de actualizar
            $customValues = $validated['custom_values'] ?? [];
            unset($validated['custom_values']);

            $asset->update($validated);

            // Actualizar valores personalizados (upsert)
            foreach ($customValues as $cv) {
                AssetCustomValue::updateOrCreate(
                    [
                        'asset_id' => $asset->id,
                        'asset_type_property_id' => $cv['property_id'],
                    ],
                    ['valor' => $cv['valor'] ?? null]
                );
            }

            return response()->json(['mensaje' => 'Activo actualizado exitosamente', 'activo' => $asset->load('customValues.property')]);
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
            'responsable_nuevo_id' => 'nullable|exists:employees,id',
            'tipo' => 'required|in:traslado,reubicacion,mantenimiento,prestamo,devolucion,baja,otro',
            'motivo' => 'nullable|string',
            'fecha_devolucion_esperada' => 'nullable|date|after:today',
        ]);

        // Validación condicional para préstamos
        if ($validated['tipo'] === 'prestamo' && empty($validated['fecha_devolucion_esperada'])) {
            return response()->json(['error' => 'La fecha de devolución esperada es requerida para préstamos'], 422);
        }

        // Validación para devoluciones: debe existir un préstamo activo
        if ($validated['tipo'] === 'devolucion') {
            $prestamoPendiente = $asset->movimientos()
                ->where('tipo', 'prestamo')
                ->whereDoesntHave('asset.movimientos', function ($q) use ($asset) {
                    $q->where('tipo', 'devolucion')
                      ->where('asset_id', $asset->id);
                })
                ->latest()
                ->first();

            if (!$prestamoPendiente) {
                return response()->json(['error' => 'No existe un préstamo activo para este activo'], 422);
            }
        }

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
     * Obtener opciones para selects (categorías, ubicaciones, proveedores, empleados)
     */
    public function getOptions()
    {
        return response()->json([
            'tipos_bien' => AssetType::with('properties')->get(),
            'categorias' => AssetCategory::select('id', 'nombre', 'metodo_depreciacion')->get(),
            'ubicaciones' => AssetLocation::select('id', 'nombre', 'codigo')->get(),
            'proveedores' => Supplier::select('id', 'nombre', 'codigo')->get(),
            'empleados' => Employee::select('id', 'nombre', 'codigo', 'departamento')->get(),
            'metodos_depreciacion' => [
                'lineal' => 'Lineal',
                'acelerada' => 'Acelerada',
                'unidades_producidas' => 'Unidades Producidas',
            ],
            'estados' => [
                'activo' => 'Activo',
                'mantenimiento' => 'En Mantenimiento',
                'inactivo' => 'Inactivo',
                'descartado' => 'Descartado',
                'retirado' => 'Retirado',
            ],
            'tipos_movimiento' => [
                'traslado' => 'Traslado',
                'reubicacion' => 'Reubicación',
                'mantenimiento' => 'Mantenimiento',
                'prestamo' => 'Préstamo',
                'devolucion' => 'Devolución',
                'baja' => 'Baja',
                'otro' => 'Otro',
            ],
        ]);
    }

    /**
     * Dar de baja un activo
     */
    public function dispose(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'motivo' => 'required|string',
            'valor_venta' => 'nullable|numeric|min:0',
            'fecha_baja' => 'required|date',
        ]);

        try {
            // Obtener valor en libros actual
            $ultimaDepreciacion = AssetDepreciation::where('asset_id', $asset->id)
                ->latest('periodo')
                ->first();

            $valorEnLibros = $ultimaDepreciacion?->valor_en_libros ?? $asset->valor_compra;
            $valorVenta = $validated['valor_venta'] ?? 0;
            $gananciaPerdida = $valorVenta - $valorEnLibros;

            // Cambiar estado
            $asset->update(['estado' => 'retirado']);

            // Registrar movimiento de baja
            $movement = $asset->movimientos()->create([
                'ubicacion_anterior_id' => $asset->ubicacion_id,
                'ubicacion_nueva_id' => $asset->ubicacion_id,
                'responsable_anterior_id' => $asset->responsable_id,
                'responsable_nuevo_id' => null,
                'tipo' => 'baja',
                'motivo' => $validated['motivo'],
                'usuario_id' => auth()->id(),
            ]);

            // Disparar evento
            AssetDisposed::dispatch($asset, $valorEnLibros);

            return response()->json([
                'mensaje' => 'Activo dado de baja exitosamente',
                'activo' => $asset,
                'valor_en_libros' => $valorEnLibros,
                'valor_venta' => $valorVenta,
                'ganancia_perdida' => $gananciaPerdida,
                'movimiento' => $movement,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al dar de baja: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Revalorizar un activo
     */
    public function revalue(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'valor_nuevo' => 'required|numeric|min:0',
            'fecha_efectiva' => 'required|date',
            'metodo' => 'required|in:contable,mercado,pericia',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $valorAnterior = $asset->valor_compra;

            // Crear registro de valuación
            $valuation = AssetValuation::create([
                'asset_id' => $asset->id,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $validated['valor_nuevo'],
                'fecha_efectiva' => $validated['fecha_efectiva'],
                'metodo' => $validated['metodo'],
                'notas' => $validated['observaciones'] ?? null,
                'usuario_id' => auth()->id(),
            ]);

            // Actualizar valor del activo
            $asset->update(['valor_compra' => $validated['valor_nuevo']]);

            // Recalcular depreciación con nuevo valor
            $this->depreciationCalculator->saveDepreciation($asset->fresh());

            // Disparar evento
            AssetRevalued::dispatch($valuation);

            return response()->json([
                'mensaje' => 'Activo revalorizado exitosamente',
                'activo' => $asset->fresh(),
                'valuacion' => $valuation,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $validated['valor_nuevo'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al revalorizar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Listar todos los movimientos con filtros
     */
    public function listMovements(Request $request)
    {
        $query = AssetMovement::with([
            'asset',
            'ubicacionAnterior',
            'ubicacionNueva',
            'responsableAnterior',
            'responsableNuevo',
            'usuario',
        ]);

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }
        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->has('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }
        if ($request->has('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $perPage = $request->get('per_page', 15);
        return response()->json($query->latest()->paginate($perPage));
    }
}
