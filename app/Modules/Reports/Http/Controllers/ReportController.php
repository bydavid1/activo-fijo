<?php

namespace App\Modules\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Maintenance\Models\MaintenanceOrder;
use App\Modules\Inventory\Models\InventoryDiscrepancy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReportController extends Controller
{
    /**
     * Reporte de listado de activos
     */
    public function assetList(Request $request)
    {
        $cacheKey = 'report_asset_list_' . md5(json_encode($request->query()));

        return Cache::remember($cacheKey, 3600, function () use ($request) {
            $query = Asset::with(['categoria', 'ubicacion', 'responsable']);

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

            // Rango de fechas
            if ($request->has('fecha_desde')) {
                $query->whereDate('created_at', '>=', $request->fecha_desde);
            }
            if ($request->has('fecha_hasta')) {
                $query->whereDate('created_at', '<=', $request->fecha_hasta);
            }

            $activos = $query->get();

            // Agregar depreciación a cada activo
            $activos = $activos->map(function ($asset) {
                $depreciacion = AssetDepreciation::where('asset_id', $asset->id)->latest('periodo')->first();
                return [
                    ...$asset->toArray(),
                    'valor_en_libros' => $depreciacion?->valor_en_libros ?? $asset->valor_compra,
                    'depreciacion_acumulada' => $depreciacion?->depreciacion_acumulada ?? 0,
                ];
            });

            return response()->json([
                'titulo' => 'Reporte de Activos',
                'fecha_generacion' => now(),
                'total_activos' => $activos->count(),
                'valor_total' => $activos->sum('valor_compra'),
                'valor_en_libros_total' => $activos->sum('valor_en_libros'),
                'datos' => $activos,
            ]);
        });
    }

    /**
     * Reporte de depreciación acumulada
     */
    public function depreciation(Request $request)
    {
        $cacheKey = 'report_depreciation_' . md5(json_encode($request->query()));

        return Cache::remember($cacheKey, 3600, function () use ($request) {
            $query = AssetDepreciation::with('asset');

            if ($request->has('categoria_id')) {
                $query->whereHas('asset', fn($q) => $q->where('categoria_id', $request->categoria_id));
            }

            $depreciaciones = $query->get()
                ->groupBy('asset_id')
                ->map(function ($items) {
                    $ultimaDepreciacion = $items->sortByDesc('periodo')->first();
                    return [
                        'asset_id' => $ultimaDepreciacion->asset_id,
                        'codigo' => $ultimaDepreciacion->asset->codigo,
                        'nombre' => $ultimaDepreciacion->asset->nombre,
                        'valor_compra' => $ultimaDepreciacion->asset->valor_compra,
                        'depreciacion_acumulada' => $ultimaDepreciacion->depreciacion_acumulada,
                        'valor_en_libros' => $ultimaDepreciacion->valor_en_libros,
                        'porcentaje_depreciado' => round(($ultimaDepreciacion->depreciacion_acumulada / $ultimaDepreciacion->asset->valor_compra) * 100, 2),
                    ];
                })
                ->values();

            return response()->json([
                'titulo' => 'Reporte de Depreciación Acumulada',
                'fecha_generacion' => now(),
                'total_activos' => $depreciaciones->count(),
                'depreciacion_total' => $depreciaciones->sum('depreciacion_acumulada'),
                'valor_en_libros_total' => $depreciaciones->sum('valor_en_libros'),
                'datos' => $depreciaciones,
            ]);
        });
    }

    /**
     * Reporte de valor en libros por responsable
     */
    public function valueByResponsible(Request $request)
    {
        $cacheKey = 'report_value_responsible_' . md5(json_encode($request->query()));

        return Cache::remember($cacheKey, 3600, function () use ($request) {
            $activos = Asset::with('responsable', 'depreciaciones')
                ->get()
                ->groupBy('responsable_id')
                ->map(function ($items) {
                    $responsable = $items->first()->responsable;
                    $ultimasDepreciaciones = $items->map(function ($asset) {
                        $depreciacion = AssetDepreciation::where('asset_id', $asset->id)->latest('periodo')->first();
                        return $depreciacion?->valor_en_libros ?? $asset->valor_compra;
                    });

                    return [
                        'responsable_id' => $items->first()->responsable_id,
                        'responsable' => $responsable?->name ?? 'Sin asignar',
                        'cantidad_activos' => $items->count(),
                        'valor_total_compra' => $items->sum('valor_compra'),
                        'valor_total_libros' => $ultimasDepreciaciones->sum(),
                    ];
                })
                ->values();

            return response()->json([
                'titulo' => 'Reporte de Valor por Responsable',
                'fecha_generacion' => now(),
                'datos' => $activos,
            ]);
        });
    }

    /**
     * Reporte de movimientos de activos
     */
    public function movements(Request $request)
    {
        $cacheKey = 'report_movements_' . md5(json_encode($request->query()));

        return Cache::remember($cacheKey, 3600, function () use ($request) {
            $query = \App\Modules\Assets\Models\AssetMovement::with(['asset', 'ubicacionAnterior', 'ubicacionNueva', 'usuario']);

            if ($request->has('asset_id')) {
                $query->where('asset_id', $request->asset_id);
            }
            if ($request->has('fecha_desde')) {
                $query->whereDate('created_at', '>=', $request->fecha_desde);
            }
            if ($request->has('fecha_hasta')) {
                $query->whereDate('created_at', '<=', $request->fecha_hasta);
            }

            $movimientos = $query->latest()->get();

            return response()->json([
                'titulo' => 'Reporte de Movimientos de Activos',
                'fecha_generacion' => now(),
                'total_movimientos' => $movimientos->count(),
                'datos' => $movimientos,
            ]);
        });
    }

    /**
     * Reporte de discrepancias de inventario
     */
    public function discrepancies(Request $request)
    {
        $cacheKey = 'report_discrepancies_' . md5(json_encode($request->query()));

        return Cache::remember($cacheKey, 3600, function () use ($request) {
            $query = InventoryDiscrepancy::with(['ciclo', 'activo', 'usuario', 'aprobadoPor']);

            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }
            if ($request->has('fecha_desde')) {
                $query->whereDate('created_at', '>=', $request->fecha_desde);
            }
            if ($request->has('fecha_hasta')) {
                $query->whereDate('created_at', '<=', $request->fecha_hasta);
            }

            $discrepancias = $query->latest()->get();

            $resumen = [
                'detectadas' => $discrepancias->where('estado', 'detectada')->count(),
                'pendientes' => $discrepancias->where('estado', 'pendiente_aprobacion')->count(),
                'aprobadas' => $discrepancias->where('estado', 'aprobada')->count(),
                'rechazadas' => $discrepancias->where('estado', 'rechazada')->count(),
                'resueltas' => $discrepancias->where('estado', 'resuelta')->count(),
            ];

            return response()->json([
                'titulo' => 'Reporte de Discrepancias de Inventario',
                'fecha_generacion' => now(),
                'total_discrepancias' => $discrepancias->count(),
                'resumen' => $resumen,
                'datos' => $discrepancias,
            ]);
        });
    }

    /**
     * Reporte de estado de mantenimiento
     */
    public function maintenance(Request $request)
    {
        $cacheKey = 'report_maintenance_' . md5(json_encode($request->query()));

        return Cache::remember($cacheKey, 3600, function () use ($request) {
            $query = MaintenanceOrder::with(['activo', 'asignadoA', 'usuario']);

            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
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

            $ordenes = $query->latest()->get();

            $resumen = [
                'pendientes' => $ordenes->where('estado', 'pendiente')->count(),
                'programadas' => $ordenes->where('estado', 'programado')->count(),
                'en_ejecucion' => $ordenes->where('estado', 'en_ejecucion')->count(),
                'completadas' => $ordenes->where('estado', 'completado')->count(),
                'costo_total' => $ordenes->whereNotNull('costo_real')->sum('costo_real'),
            ];

            return response()->json([
                'titulo' => 'Reporte de Estado de Mantenimiento',
                'fecha_generacion' => now(),
                'total_ordenes' => $ordenes->count(),
                'resumen' => $resumen,
                'datos' => $ordenes,
            ]);
        });
    }

    /**
     * Exportar reporte a Excel o PDF
     */
    public function export(Request $request)
    {
        $tipo = $request->get('tipo', 'asset-list');
        $formato = $request->get('formato', 'excel');

        try {
            $reporte = match($tipo) {
                'asset-list' => $this->assetList($request)->getData(),
                'depreciation' => $this->depreciation($request)->getData(),
                'value-responsible' => $this->valueByResponsible($request)->getData(),
                'movements' => $this->movements($request)->getData(),
                'discrepancies' => $this->discrepancies($request)->getData(),
                'maintenance' => $this->maintenance($request)->getData(),
                default => null,
            };

            if (!$reporte) {
                return response()->json(['error' => 'Tipo de reporte no válido'], 400);
            }

            // TODO: Implementar exportadores Excel/PDF
            return response()->json([
                'mensaje' => "Exportación a {$formato} iniciada",
                'reporte' => $reporte,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al exportar: ' . $e->getMessage()], 500);
        }
    }
}
