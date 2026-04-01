<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Services\JournalEntryService;
use App\Modules\Assets\Models\AssetDepreciation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Models\Activity;
use Inertia\Inertia;

class JournalEntryController extends Controller
{
    protected JournalEntryService $service;

    public function __construct(JournalEntryService $service)
    {
        $this->service = $service;
    }

    /**
     * Vistas Frontend
     */
    public function index()
    {
        return Inertia::render('Accounting/JournalEntries/Index');
    }

    public function create()
    {
        return Inertia::render('Accounting/JournalEntries/Create');
    }

    public function show(JournalEntry $entry)
    {
        // View not strictly required for MVP, but good for linking
        return Inertia::render('Accounting/JournalEntries/Show', [
            'entryId' => $entry->id
        ]);
    }

    /**
     * API - Listado de asientos con filtrado
     */
    public function apiIndex(Request $request)
    {
        $query = JournalEntry::with(['lines.account', 'asset'])->latest('fecha');

        if ($request->filled('tipo_origen')) {
            $query->where('tipo_origen', $request->tipo_origen);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }
        
        if ($request->filled('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * API - Single Asiento con Líneas
     */
    public function apiShow(JournalEntry $entry)
    {
        return response()->json($entry->load(['lines.account', 'asset']));
    }

    /**
     * API - Almacenar asiento manual
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fecha' => 'required|date',
            'descripcion' => 'required|string|max:255',
            'asset_id' => 'nullable|exists:assets,id',
            'lines' => 'required|array|min:2',
            'lines.*.accounting_account_id' => 'required|exists:accounting_accounts,id',
            'lines.*.debe' => 'required|numeric|min:0',
            'lines.*.haber' => 'required|numeric|min:0',
        ]);

        try {
            $entry = $this->service->createEntry(
                [
                    'fecha' => $validated['fecha'],
                    'descripcion' => $validated['descripcion'],
                    'asset_id' => $validated['asset_id'] ?? null,
                    'tipo_origen' => 'manual',
                    'estado' => 'validado'
                ],
                $validated['lines']
            );

            return response()->json([
                'message' => 'Asiento contable creado exitosamente',
                'entry' => $entry->load('lines.account'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el asiento contable: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * API - Ejecutar Cierre Mensual de Depreciación Manualmente
     */
    public function runMonthlyDepreciation(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = $validated['year'];
        $month = $validated['month'];
        
        $fechaAsiento = Carbon::create($year, $month)->endOfMonth();
        
        // Regla de Negocio: No permitir cierres futuros
        if ($fechaAsiento->startOfDay()->isAfter(now()->endOfMonth()->startOfDay())) {
            return response()->json([
                'message' => 'No se puede ejecutar un cierre de depreciación para un mes futuro al actual.'
            ], 422);
        }

        $fechaAsientoString = $fechaAsiento->toDateString();
        
        $depreciacionesCandidatas = AssetDepreciation::with(['asset.tipoBien'])
            ->where('ano', $year)
            ->where('mes', $month)
            ->where('depreciacion_valor', '>', 0)
            ->get();

        $creados = 0;
        $errores = 0;
        $activosAfectados = [];

        foreach ($depreciacionesCandidatas as $dep) {
            $asset = $dep->asset;

            if (!$asset || !$asset->tipoBien) {
                continue; // Activo inválido o sin configuración de cuenta
            }

            // Validar si ya generó en este periodo
            $periodoYaContabilizado = JournalEntry::where('asset_id', $asset->id)
                ->where('tipo_origen', 'depreciacion')
                ->whereYear('fecha', $year)
                ->whereMonth('fecha', $month)
                ->exists();

            if ($periodoYaContabilizado) {
                continue;
            }

            $cuentaGastoId = $asset->tipoBien->cuenta_gasto_depreciacion_id;
            $cuentaAcumuladaId = $asset->tipoBien->cuenta_depreciacion_acumulada_id;

            if (!$cuentaGastoId || !$cuentaAcumuladaId) {
                continue; // No están configurados los identificadores de cuenta para su Tipo
            }

            try {
                $this->service->createEntry(
                    [
                        'fecha' => $fechaAsientoString,
                        'descripcion' => "Depreciación de periodo [{$month}/{$year}] - {$asset->codigo} - {$asset->nombre}",
                        'asset_id' => $asset->id,
                        'tipo_origen' => 'depreciacion',
                        'estado' => 'validado'
                    ],
                    [
                        [
                            'accounting_account_id' => $cuentaGastoId,
                            'debe' => $dep->depreciacion_valor,
                            'haber' => 0
                        ],
                        [
                            'accounting_account_id' => $cuentaAcumuladaId,
                            'debe' => 0,
                            'haber' => $dep->depreciacion_valor
                        ]
                    ]
                );
                $creados++;
                $activosAfectados[] = [
                    'asset_id' => $asset->id,
                    'codigo' => $asset->codigo,
                    'nombre' => $asset->nombre,
                    'monto' => $dep->depreciacion_valor
                ];
            } catch (\Exception $e) {
                Log::error("Manual Depreciation Close Error [Asset {$asset->codigo}]: " . $e->getMessage());
                $errores++;
            }
        }

        // Registrar en Spatie ActivityLog para auditoría del sistema
        if (function_exists('activity')) {
            activity('accounting')
                ->causedBy(auth()->user())
                ->withProperties([
                    'year' => $year,
                    'month' => $month,
                    'asientos_creados' => $creados,
                    'errores' => $errores,
                    'activos' => $activosAfectados
                ])
                ->log("Ejecución manual de Cierre Mensual de Depreciación ({$month}/{$year})");
        }

        return response()->json([
            'message' => 'Cierre mensual ejecutado',
            'entradas_creadas' => $creados,
            'errores_logueados' => $errores
        ], 200);
    }

    /**
     * API - Historial de Cierres de Depreciación
     */
    public function closeHistory()
    {
        if (!class_exists(\Spatie\Activitylog\Models\Activity::class)) {
            return response()->json([]);
        }

        $logs = Activity::where('log_name', 'accounting')
            ->where('description', 'like', 'Ejecución manual de Cierre Mensual%')
            ->with('causer')
            ->latest()
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'fecha_ejecucion' => $log->created_at->format('Y-m-d H:i:s'),
                    'usuario' => $log->causer ? $log->causer->name : 'Sistema',
                    'periodo' => ($log->properties['month'] ?? '?') . '/' . ($log->properties['year'] ?? '?'),
                    'asientos_creados' => $log->properties['asientos_creados'] ?? 0,
                    'errores' => $log->properties['errores'] ?? 0,
                    'activos_afectados' => $log->properties['activos'] ?? []
                ];
            });

        return response()->json($logs);
    }
}
