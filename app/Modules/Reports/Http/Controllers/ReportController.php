<?php

namespace App\Modules\Reports\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Assets\Models\AssetMovement;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Employees\Models\Employee;
use App\Modules\Maintenance\Models\MaintenanceOrder;
use App\Modules\Inventory\Models\InventoryDiscrepancy;
use App\Modules\Inventory\Models\InventoryAudit;
use App\Modules\Reports\Exports\GenericReportExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Obtener opciones para filtros de reportes
     */
    public function getOptions()
    {
        try {
            $categorias = AssetCategory::select('id', 'nombre', 'codigo')->orderBy('nombre')->get();
            $ubicaciones = AssetLocation::select('id', 'nombre', 'codigo')->orderBy('nombre')->get();
            $responsables = Employee::select('id', 'nombre', 'codigo')->orderBy('nombre')->get();

            return response()->json([
                'categorias' => $categorias,
                'ubicaciones' => $ubicaciones,
                'responsables' => $responsables,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'categorias' => [],
                'ubicaciones' => [],
                'responsables' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Configuración de columnas por tipo de reporte
     */
    protected function getReportColumns(string $tipo): array
    {
        return match($tipo) {
            'asset-list' => [
                'codigo' => 'Código',
                'nombre' => 'Nombre',
                'categoria' => 'Categoría',
                'ubicacion' => 'Ubicación',
                'responsable' => 'Responsable',
                'estado' => 'Estado',
                'valor_compra' => 'Valor Compra',
                'depreciacion_acumulada' => 'Depreciación Acum.',
                'valor_en_libros' => 'Valor en Libros',
                'fecha_adquisicion' => 'Fecha Adquisición',
            ],
            'depreciation' => [
                'codigo' => 'Código',
                'nombre' => 'Nombre',
                'valor_compra' => 'Valor Compra',
                'valor_residual' => 'Valor Residual',
                'vida_util_anos' => 'Vida Útil (años)',
                'depreciacion_acumulada' => 'Depreciación Acum.',
                'valor_en_libros' => 'Valor en Libros',
                'porcentaje_depreciado' => '% Depreciado',
            ],
            'value-responsible' => [
                'responsable' => 'Responsable',
                'departamento' => 'Departamento',
                'cantidad_activos' => 'Cantidad Activos',
                'valor_total' => 'Valor Total',
                'valor_en_libros' => 'Valor en Libros',
            ],
            'value-location' => [
                'ubicacion' => 'Ubicación',
                'codigo_ubicacion' => 'Código',
                'cantidad_activos' => 'Cantidad Activos',
                'valor_total' => 'Valor Total',
                'valor_en_libros' => 'Valor en Libros',
            ],
            'movements' => [
                'fecha' => 'Fecha',
                'asset_codigo' => 'Código Activo',
                'asset_nombre' => 'Nombre Activo',
                'tipo' => 'Tipo',
                'ubicacion_anterior' => 'Ubicación Anterior',
                'ubicacion_nueva' => 'Ubicación Nueva',
                'responsable_anterior' => 'Responsable Anterior',
                'responsable_nuevo' => 'Responsable Nuevo',
                'motivo' => 'Motivo',
                'usuario' => 'Usuario',
            ],
            'sales' => [
                'fecha' => 'Fecha Venta',
                'asset_codigo' => 'Código Activo',
                'asset_nombre' => 'Nombre Activo',
                'comprador_nombre' => 'Comprador',
                'comprador_documento' => 'Documento',
                'tipo_venta' => 'Tipo Venta',
                'precio_venta' => 'Precio Venta',
                'valor_libros' => 'Valor en Libros',
                'ganancia_perdida' => 'Ganancia/Pérdida',
            ],
            'maintenance' => [
                'numero' => 'Número Orden',
                'asset_codigo' => 'Código Activo',
                'asset_nombre' => 'Nombre Activo',
                'tipo' => 'Tipo',
                'prioridad' => 'Prioridad',
                'estado' => 'Estado',
                'fecha_programada' => 'Fecha Programada',
                'costo_estimado' => 'Costo Estimado',
                'costo_real' => 'Costo Real',
                'asignado_a' => 'Asignado A',
            ],
            'inventory-audits' => [
                'numero' => 'Número Auditoría',
                'nombre' => 'Nombre',
                'fecha_inicio' => 'Fecha Inicio',
                'fecha_fin' => 'Fecha Fin',
                'estado' => 'Estado',
                'total_esperados' => 'Total Esperados',
                'total_escaneados' => 'Total Escaneados',
                'encontrados' => 'Encontrados',
                'faltantes' => 'Faltantes',
                'sobrantes' => 'Sobrantes',
                'porcentaje_completado' => '% Completado',
            ],
            'summary' => [
                'metrica' => 'Métrica',
                'valor' => 'Valor',
                'detalle' => 'Detalle',
            ],
            default => [],
        };
    }

    /**
     * Reporte de listado de activos
     */
    public function assetList(Request $request)
    {
        $query = Asset::with(['categoria', 'ubicacion', 'responsable']);

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->categoria_id);
        }
        if ($request->filled('ubicacion_id')) {
            $query->where('ubicacion_id', $request->ubicacion_id);
        }
        if ($request->filled('responsable_id')) {
            $query->where('responsable_id', $request->responsable_id);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_adquisicion', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_adquisicion', '<=', $request->fecha_hasta);
        }

        $activos = $query->get()->map(function ($asset) {
            $depreciacion = AssetDepreciation::where('asset_id', $asset->id)
                ->latest('periodo')->first();

            return [
                'id' => $asset->id,
                'codigo' => $asset->codigo,
                'nombre' => $asset->nombre,
                'categoria' => $asset->categoria?->nombre ?? '-',
                'ubicacion' => $asset->ubicacion?->nombre ?? '-',
                'responsable' => $asset->responsable?->nombre ?? 'Sin asignar',
                'estado' => $asset->estado,
                'valor_compra' => $asset->valor_compra,
                'depreciacion_acumulada' => $depreciacion?->depreciacion_acumulada ?? 0,
                'valor_en_libros' => $depreciacion?->valor_en_libros ?? $asset->valor_compra,
                'fecha_adquisicion' => $asset->fecha_adquisicion,
            ];
        });

        return response()->json([
            'titulo' => 'Reporte de Activos',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_activos' => $activos->count(),
                'valor_total' => $activos->sum('valor_compra'),
                'valor_en_libros_total' => $activos->sum('valor_en_libros'),
                'depreciacion_total' => $activos->sum('depreciacion_acumulada'),
            ],
            'data' => $activos,
        ]);
    }

    /**
     * Reporte de depreciación acumulada
     */
    public function depreciation(Request $request)
    {
        $query = Asset::with('categoria')
            ->where('estado', '!=', 'retirado')
            ->whereNotNull('vida_util_anos')
            ->where('vida_util_anos', '>', 0);

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->categoria_id);
        }

        $activos = $query->get()->map(function ($asset) {
            $depreciacion = AssetDepreciation::where('asset_id', $asset->id)
                ->latest('periodo')->first();

            $depAcum = $depreciacion?->depreciacion_acumulada ?? 0;
            $valorLibros = $depreciacion?->valor_en_libros ?? $asset->valor_compra;
            $porcentaje = $asset->valor_compra > 0
                ? round(($depAcum / $asset->valor_compra) * 100, 2)
                : 0;

            return [
                'id' => $asset->id,
                'codigo' => $asset->codigo,
                'nombre' => $asset->nombre,
                'categoria' => $asset->categoria?->nombre ?? '-',
                'valor_compra' => $asset->valor_compra,
                'valor_residual' => $asset->valor_residual ?? 0,
                'vida_util_anos' => $asset->vida_util_anos,
                'depreciacion_acumulada' => $depAcum,
                'valor_en_libros' => $valorLibros,
                'porcentaje_depreciado' => $porcentaje,
            ];
        });

        return response()->json([
            'titulo' => 'Reporte de Depreciación',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_activos' => $activos->count(),
                'valor_total_compra' => $activos->sum('valor_compra'),
                'depreciacion_total' => $activos->sum('depreciacion_acumulada'),
                'valor_en_libros_total' => $activos->sum('valor_en_libros'),
            ],
            'data' => $activos,
        ]);
    }

    /**
     * Reporte de valor por responsable
     */
    public function valueByResponsible(Request $request)
    {
        $activos = Asset::with('responsable')
            ->where('estado', 'activo')
            ->get()
            ->groupBy('responsable_id')
            ->map(function ($items) {
                $responsable = $items->first()->responsable;
                $valorEnLibros = $items->sum(function ($asset) {
                    $dep = AssetDepreciation::where('asset_id', $asset->id)
                        ->latest('periodo')->first();
                    return $dep?->valor_en_libros ?? $asset->valor_compra;
                });

                return [
                    'responsable_id' => $items->first()->responsable_id,
                    'responsable' => $responsable?->nombre ?? 'Sin asignar',
                    'departamento' => $responsable?->departamento ?? '-',
                    'cantidad_activos' => $items->count(),
                    'valor_total' => $items->sum('valor_compra'),
                    'valor_en_libros' => $valorEnLibros,
                ];
            })
            ->values()
            ->sortByDesc('valor_total')
            ->values();

        return response()->json([
            'titulo' => 'Reporte de Valor por Responsable',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_responsables' => $activos->count(),
                'valor_total' => $activos->sum('valor_total'),
                'valor_en_libros_total' => $activos->sum('valor_en_libros'),
            ],
            'data' => $activos,
        ]);
    }

    /**
     * Reporte de valor por ubicación
     */
    public function valueByLocation(Request $request)
    {
        $activos = Asset::with('ubicacion')
            ->where('estado', 'activo')
            ->get()
            ->groupBy('ubicacion_id')
            ->map(function ($items) {
                $ubicacion = $items->first()->ubicacion;
                $valorEnLibros = $items->sum(function ($asset) {
                    $dep = AssetDepreciation::where('asset_id', $asset->id)
                        ->latest('periodo')->first();
                    return $dep?->valor_en_libros ?? $asset->valor_compra;
                });

                return [
                    'ubicacion_id' => $items->first()->ubicacion_id,
                    'ubicacion' => $ubicacion?->nombre ?? 'Sin asignar',
                    'codigo_ubicacion' => $ubicacion?->codigo ?? '-',
                    'cantidad_activos' => $items->count(),
                    'valor_total' => $items->sum('valor_compra'),
                    'valor_en_libros' => $valorEnLibros,
                ];
            })
            ->values()
            ->sortByDesc('valor_total')
            ->values();

        return response()->json([
            'titulo' => 'Reporte de Valor por Ubicación',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_ubicaciones' => $activos->count(),
                'valor_total' => $activos->sum('valor_total'),
                'valor_en_libros_total' => $activos->sum('valor_en_libros'),
            ],
            'data' => $activos,
        ]);
    }

    /**
     * Reporte de movimientos
     */
    public function movements(Request $request)
    {
        $query = AssetMovement::with(['asset', 'ubicacionAnterior', 'ubicacionNueva',
            'responsableAnterior', 'responsableNuevo', 'usuario']);

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $movimientos = $query->latest()->limit(500)->get()->map(function ($mov) {
            return [
                'id' => $mov->id,
                'fecha' => $mov->created_at->format('Y-m-d H:i'),
                'asset_id' => $mov->asset_id,
                'asset_codigo' => $mov->asset?->codigo ?? '-',
                'asset_nombre' => $mov->asset?->nombre ?? '-',
                'tipo' => $mov->tipo,
                'ubicacion_anterior' => $mov->ubicacionAnterior?->nombre ?? '-',
                'ubicacion_nueva' => $mov->ubicacionNueva?->nombre ?? '-',
                'responsable_anterior' => $mov->responsableAnterior?->nombre ?? '-',
                'responsable_nuevo' => $mov->responsableNuevo?->nombre ?? '-',
                'motivo' => $mov->motivo ?? '-',
                'usuario' => $mov->usuario?->name ?? '-',
            ];
        });

        $resumenTipos = $movimientos->groupBy('tipo')->map->count();

        return response()->json([
            'titulo' => 'Reporte de Movimientos',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_movimientos' => $movimientos->count(),
                'por_tipo' => $resumenTipos,
            ],
            'data' => $movimientos,
        ]);
    }

    /**
     * Reporte de ventas
     */
    public function sales(Request $request)
    {
        $query = AssetMovement::with(['asset'])
            ->where('tipo', 'venta')
            ->whereNotNull('precio_venta');

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $ventas = $query->latest()->get()->map(function ($mov) {
            $valorLibros = $mov->asset?->valor_compra ?? 0;
            $dep = AssetDepreciation::where('asset_id', $mov->asset_id)
                ->where('periodo', '<', $mov->created_at->format('Y-m'))
                ->latest('periodo')->first();
            if ($dep) {
                $valorLibros = $dep->valor_en_libros;
            }

            return [
                'id' => $mov->id,
                'fecha' => $mov->created_at->format('Y-m-d'),
                'asset_codigo' => $mov->asset?->codigo ?? '-',
                'asset_nombre' => $mov->asset?->nombre ?? '-',
                'comprador_nombre' => $mov->comprador_nombre ?? '-',
                'comprador_documento' => $mov->comprador_documento ?? '-',
                'tipo_venta' => $mov->tipo_venta ?? 'directa',
                'precio_venta' => $mov->precio_venta,
                'valor_libros' => $valorLibros,
                'ganancia_perdida' => $mov->precio_venta - $valorLibros,
            ];
        });

        $ganancias = $ventas->where('ganancia_perdida', '>', 0)->sum('ganancia_perdida');
        $perdidas = abs($ventas->where('ganancia_perdida', '<', 0)->sum('ganancia_perdida'));

        return response()->json([
            'titulo' => 'Reporte de Ventas de Activos',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_ventas' => $ventas->count(),
                'ingresos_totales' => $ventas->sum('precio_venta'),
                'valor_libros_total' => $ventas->sum('valor_libros'),
                'ganancia_neta' => $ventas->sum('ganancia_perdida'),
                'ganancias' => $ganancias,
                'perdidas' => $perdidas,
            ],
            'data' => $ventas,
        ]);
    }

    /**
     * Reporte de mantenimiento
     */
    public function maintenance(Request $request)
    {
        $query = MaintenanceOrder::with(['activo', 'asignadoA']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $ordenes = $query->latest()->get()->map(function ($orden) {
            return [
                'id' => $orden->id,
                'numero' => $orden->numero,
                'asset_codigo' => $orden->activo?->codigo ?? '-',
                'asset_nombre' => $orden->activo?->nombre ?? '-',
                'tipo' => $orden->tipo,
                'prioridad' => $orden->prioridad,
                'estado' => $orden->estado,
                'fecha_programada' => $orden->fecha_programada,
                'fecha_completado' => $orden->fecha_completado,
                'costo_estimado' => $orden->costo_estimado ?? 0,
                'costo_real' => $orden->costo_real ?? 0,
                'asignado_a' => $orden->asignadoA?->nombre ?? '-',
            ];
        });

        return response()->json([
            'titulo' => 'Reporte de Mantenimiento',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total_ordenes' => $ordenes->count(),
                'pendientes' => $ordenes->where('estado', 'pendiente')->count(),
                'en_ejecucion' => $ordenes->where('estado', 'en_ejecucion')->count(),
                'completadas' => $ordenes->where('estado', 'completado')->count(),
                'costo_estimado_total' => $ordenes->sum('costo_estimado'),
                'costo_real_total' => $ordenes->sum('costo_real'),
            ],
            'data' => $ordenes,
        ]);
    }

    /**
     * Reporte de auditorías de inventario
     */
    public function inventoryAudits(Request $request)
    {
        try {
            $query = InventoryAudit::with('creator');

            if ($request->filled('estado')) {
                $query->where('estado', $request->estado);
            }
            if ($request->filled('fecha_desde')) {
                $query->whereDate('fecha_inicio', '>=', $request->fecha_desde);
            }
            if ($request->filled('fecha_hasta')) {
                $query->whereDate('fecha_inicio', '<=', $request->fecha_hasta);
            }

            $auditorias = $query->latest()->get()->map(function ($audit) {
                $totalEsperados = $audit->total_activos_esperados ?? $audit->items()->count();
                $totalEncontrados = $audit->total_activos_encontrados ?? $audit->itemsEncontrados()->count();
                $faltantes = $audit->itemsFaltantes()->count();
                $porcentaje = $totalEsperados > 0 ? round(($totalEncontrados / $totalEsperados) * 100, 1) : 0;

                return [
                    'id' => $audit->id,
                    'numero' => $audit->codigo ?? "AUD-{$audit->id}",
                    'nombre' => $audit->nombre ?? 'Sin nombre',
                    'fecha_inicio' => $audit->fecha_inicio?->format('Y-m-d'),
                    'fecha_fin' => $audit->fecha_finalizacion?->format('Y-m-d'),
                    'estado' => $audit->estado ?? 'pendiente',
                    'total_esperados' => $totalEsperados,
                    'total_escaneados' => $totalEncontrados,
                    'encontrados' => $totalEncontrados,
                    'faltantes' => $faltantes,
                    'sobrantes' => 0,
                    'porcentaje_completado' => $porcentaje,
                ];
            });

            return response()->json([
                'titulo' => 'Reporte de Auditorías de Inventario',
                'fecha_generacion' => now()->format('Y-m-d H:i:s'),
                'resumen' => [
                    'total_auditorias' => $auditorias->count(),
                    'completadas' => $auditorias->where('estado', 'completada')->count() + $auditorias->where('estado', 'completado')->count(),
                    'en_progreso' => $auditorias->where('estado', 'en_progreso')->count(),
                    'promedio_completado' => round($auditorias->avg('porcentaje_completado') ?? 0, 1),
                ],
                'data' => $auditorias->values(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'titulo' => 'Reporte de Auditorías de Inventario',
                'fecha_generacion' => now()->format('Y-m-d H:i:s'),
                'resumen' => ['total_auditorias' => 0],
                'data' => [],
                'error' => 'No se pudieron cargar las auditorías: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Reporte de bajas y adquisiciones
     */
    public function dispositionsAndAcquisitions(Request $request)
    {
        $fechaDesde = $request->get('fecha_desde', now()->startOfYear()->format('Y-m-d'));
        $fechaHasta = $request->get('fecha_hasta', now()->format('Y-m-d'));

        $adquisiciones = Asset::with(['categoria', 'proveedor'])
            ->whereBetween('fecha_adquisicion', [$fechaDesde, $fechaHasta])
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'codigo' => $a->codigo,
                'nombre' => $a->nombre,
                'categoria' => $a->categoria?->nombre ?? '-',
                'proveedor' => $a->proveedor?->nombre ?? '-',
                'fecha_adquisicion' => $a->fecha_adquisicion,
                'valor_compra' => $a->valor_compra,
            ]);

        $bajas = AssetMovement::with('asset')
            ->where('tipo', 'baja')
            ->whereBetween('created_at', [$fechaDesde, $fechaHasta . ' 23:59:59'])
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'codigo' => $m->asset?->codigo ?? '-',
                'nombre' => $m->asset?->nombre ?? '-',
                'fecha_baja' => $m->created_at->format('Y-m-d'),
                'motivo' => $m->motivo ?? '-',
                'valor' => $m->asset?->valor_compra ?? 0,
            ]);

        return response()->json([
            'titulo' => 'Reporte de Bajas y Adquisiciones',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'periodo' => ['desde' => $fechaDesde, 'hasta' => $fechaHasta],
            'resumen' => [
                'total_adquisiciones' => $adquisiciones->count(),
                'valor_adquisiciones' => $adquisiciones->sum('valor_compra'),
                'total_bajas' => $bajas->count(),
                'valor_bajas' => $bajas->sum('valor'),
            ],
            'adquisiciones' => $adquisiciones,
            'bajas' => $bajas,
        ]);
    }

    /**
     * Reporte de discrepancias
     */
    public function discrepancies(Request $request)
    {
        $query = InventoryDiscrepancy::with(['activo', 'ciclo']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $discrepancias = $query->latest()->get()->map(function ($disc) {
            return [
                'id' => $disc->id,
                'auditoria' => $disc->ciclo?->nombre ?? "Ciclo #{$disc->cycle_id}",
                'activo_codigo' => $disc->activo?->codigo ?? '-',
                'activo_nombre' => $disc->activo?->nombre ?? '-',
                'tipo_discrepancia' => $disc->tipo_discrepancia ?? 'no_especificado',
                'descripcion' => $disc->descripcion ?? '-',
                'estado' => $disc->estado,
                'fecha' => $disc->created_at?->format('Y-m-d'),
            ];
        });

        return response()->json([
            'titulo' => 'Reporte de Discrepancias',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'resumen' => [
                'total' => $discrepancias->count(),
                'detectadas' => $discrepancias->where('estado', 'detectada')->count(),
                'pendientes' => $discrepancias->where('estado', 'pendiente_aprobacion')->count(),
                'resueltas' => $discrepancias->where('estado', 'resuelta')->count(),
            ],
            'data' => $discrepancias,
        ]);
    }

    /**
     * Resumen general del sistema
     */
    public function summary(Request $request)
    {
        $totalActivos = Asset::count();
        $activosActivos = Asset::where('estado', 'activo')->count();
        $valorTotal = Asset::sum('valor_compra');

        $valorEnLibros = Asset::where('estado', 'activo')->get()->sum(function ($asset) {
            $dep = AssetDepreciation::where('asset_id', $asset->id)
                ->latest('periodo')->first();
            return $dep?->valor_en_libros ?? $asset->valor_compra;
        });

        $depreciacionAcumulada = AssetDepreciation::selectRaw('asset_id, MAX(depreciacion_acumulada) as dep')
            ->groupBy('asset_id')
            ->get()
            ->sum('dep');

        $mantenimientosPendientes = MaintenanceOrder::where('estado', 'pendiente')->count();
        $mantenimientosEnCurso = MaintenanceOrder::where('estado', 'en_ejecucion')->count();
        $costoMantenimientoAnual = MaintenanceOrder::whereYear('created_at', now()->year)
            ->whereNotNull('costo_real')
            ->sum('costo_real');

        $movimientosMes = AssetMovement::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $ventasAno = AssetMovement::where('tipo', 'venta')
            ->whereYear('created_at', now()->year)
            ->sum('precio_venta');

        // Datos por categoría para gráfico
        $porCategoria = Asset::with('categoria')
            ->where('estado', 'activo')
            ->get()
            ->groupBy('categoria_id')
            ->map(function ($items) {
                return [
                    'categoria' => $items->first()->categoria?->nombre ?? 'Sin categoría',
                    'cantidad' => $items->count(),
                    'valor' => $items->sum('valor_compra'),
                ];
            })
            ->values();

        // Datos por estado para gráfico
        $porEstado = Asset::selectRaw('estado, COUNT(*) as cantidad')
            ->groupBy('estado')
            ->get()
            ->map(fn($item) => [
                'estado' => ucfirst(str_replace('_', ' ', $item->estado)),
                'cantidad' => $item->cantidad,
            ]);

        // Datos por ubicación
        $totalUbicaciones = AssetLocation::count();
        $activosBaja = Asset::where('estado', 'dado_de_baja')->count();

        return response()->json([
            'titulo' => 'Resumen General del Sistema',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'total_activos' => $totalActivos,
            'activos_activos' => $activosActivos,
            'valor_total' => $valorTotal,
            'valor_en_libros' => $valorEnLibros,
            'depreciacion_total' => $depreciacionAcumulada,
            'mantenimientos_pendientes' => $mantenimientosPendientes,
            'mantenimientos_en_curso' => $mantenimientosEnCurso,
            'costo_mantenimiento_anual' => $costoMantenimientoAnual,
            'movimientos_mes' => $movimientosMes,
            'ventas_ano' => $ventasAno,
            'total_ubicaciones' => $totalUbicaciones,
            'activos_baja' => $activosBaja,
            'por_categoria' => $porCategoria,
            'por_estado' => $porEstado,
            'data' => [], // Para compatibilidad con export
        ]);
    }

    /**
     * Exportar reporte a Excel o PDF
     */
    public function export(Request $request)
    {
        $tipo = $request->get('tipo', 'asset-list');
        $formato = $request->get('formato', 'excel');
        $filtros = $request->except(['tipo', 'formato']);

        $subRequest = new Request($filtros);

        try {
            $response = match($tipo) {
                'asset-list' => $this->assetList($subRequest),
                'depreciation' => $this->depreciation($subRequest),
                'value-responsible' => $this->valueByResponsible($subRequest),
                'value-location' => $this->valueByLocation($subRequest),
                'movements' => $this->movements($subRequest),
                'sales' => $this->sales($subRequest),
                'maintenance' => $this->maintenance($subRequest),
                'inventory-audits' => $this->inventoryAudits($subRequest),
                'dispositions-acquisitions' => $this->dispositionsAndAcquisitions($subRequest),
                'discrepancies' => $this->discrepancies($subRequest),
                'summary' => $this->summary($subRequest),
                default => throw new \Exception('Tipo de reporte no válido'),
            };

            $reportData = $response->getData(true);
            $data = $reportData['data'] ?? [];
            $titulo = $reportData['titulo'] ?? 'Reporte';
            $columns = $this->getReportColumns($tipo);

            if ($tipo === 'dispositions-acquisitions') {
                $data = array_merge(
                    array_map(fn($a) => [...$a, 'tipo_movimiento' => 'Adquisición'], $reportData['adquisiciones'] ?? []),
                    array_map(fn($b) => [...$b, 'tipo_movimiento' => 'Baja'], $reportData['bajas'] ?? [])
                );
                $columns = [
                    'codigo' => 'Código',
                    'nombre' => 'Nombre',
                    'tipo_movimiento' => 'Tipo',
                    'fecha_adquisicion' => 'Fecha Adq.',
                    'fecha_baja' => 'Fecha Baja',
                    'valor_compra' => 'Valor',
                    'motivo' => 'Motivo',
                ];
            }

            $filename = 'reporte_' . str_replace('-', '_', $tipo) . '_' . now()->format('Y-m-d');

            if ($formato === 'excel') {
                $export = new GenericReportExport($data, $columns, $titulo);
                return Excel::download($export, $filename . '.xlsx');
            } else {
                $pdf = Pdf::loadView('reports.generic', [
                    'titulo' => $titulo,
                    'fecha' => now()->format('d/m/Y H:i'),
                    'columns' => $columns,
                    'data' => $data,
                    'resumen' => $reportData['resumen'] ?? null,
                ]);

                $pdf->setPaper('a4', 'landscape');
                return $pdf->download($filename . '.pdf');
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al exportar: ' . $e->getMessage()
            ], 500);
        }
    }
}
