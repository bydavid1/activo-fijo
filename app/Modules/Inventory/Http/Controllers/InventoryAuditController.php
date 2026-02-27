<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Employees\Models\Employee;
use App\Modules\Inventory\Models\InventoryAudit;
use App\Modules\Inventory\Models\InventoryAuditFinding;
use App\Modules\Inventory\Models\InventoryAuditItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InventoryAuditController extends Controller
{
    /**
     * Lista todos los levantamientos de inventario
     */
    public function index(Request $request)
    {
        $query = InventoryAudit::with('creator')
            ->withCount([
                'items',
                'itemsEncontrados',
                'itemsFaltantes',
                'findings'
            ]);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('nombre', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        $auditorias = $query->latest()->paginate(15);

        return response()->json([
            'auditorias' => $auditorias,
            'success' => true
        ]);
    }

    /**
     * Crea un nuevo levantamiento
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'criterios' => 'nullable|array',
            'criterios.category_ids' => 'nullable|array',
            'criterios.category_ids.*' => 'exists:asset_categories,id',
            'criterios.location_ids' => 'nullable|array',
            'criterios.location_ids.*' => 'exists:asset_locations,id',
            'criterios.employee_ids' => 'nullable|array',
            'criterios.employee_ids.*' => 'exists:employees,id',
        ]);

        DB::beginTransaction();

        try {
            // Generar código único
            $codigo = $this->generarCodigo();

            // Crear la auditoría
            $auditoria = InventoryAudit::create([
                'codigo' => $codigo,
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'],
                'criterios' => $validated['criterios'] ?? [],
                'created_by' => auth()->id(),
            ]);

            // Obtener activos según criterios
            $activos = $this->obtenerActivosSegunCriterios($validated['criterios'] ?? []);

            // Crear ítems del levantamiento
            foreach ($activos as $activo) {
                InventoryAuditItem::create([
                    'inventory_audit_id' => $auditoria->id,
                    'asset_id' => $activo->id,
                    'datos_esperados' => [
                        'responsable_id' => $activo->responsable_id,
                        'ubicacion_id' => $activo->ubicacion_id,
                        'estado_fisico' => $activo->estado_fisico,
                        'codigo' => $activo->codigo_qr ?: $activo->codigo_barras,
                    ]
                ]);
            }

            // Actualizar total esperados
            $auditoria->update([
                'total_activos_esperados' => $activos->count()
            ]);

            DB::commit();

            return response()->json([
                'auditoria' => $auditoria->load('creator'),
                'message' => 'Levantamiento creado exitosamente',
                'success' => true
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Error al crear el levantamiento: ' . $e->getMessage(),
                'success' => false
            ], 500);
        }
    }

    /**
     * Muestra un levantamiento específico
     */
    public function show($id)
    {
        $auditoria = InventoryAudit::with([
            'creator',
            'items.asset.categoria',
            'items.asset.ubicacion',
            'items.asset.responsable',
            'findings.asset'
        ])->findOrFail($id);

        return response()->json([
            'auditoria' => $auditoria,
            'success' => true
        ]);
    }

    /**
     * Inicia el proceso de escaneo
     */
    public function iniciar($id)
    {
        $auditoria = InventoryAudit::findOrFail($id);

        if ($auditoria->estado !== 'draft') {
            return response()->json([
                'message' => 'El levantamiento ya fue iniciado o completado',
                'success' => false
            ], 422);
        }

        $auditoria->update([
            'estado' => 'in_progress',
            'fecha_inicio' => now()
        ]);

        return response()->json([
            'auditoria' => $auditoria,
            'message' => 'Levantamiento iniciado exitosamente',
            'success' => true
        ]);
    }

    /**
     * Procesa el escaneo de un código
     */
    public function escanearCodigo(Request $request, $id)
    {
        $validated = $request->validate([
            'codigo' => 'required|string',
            'observaciones' => 'nullable|string'
        ]);

        $auditoria = InventoryAudit::findOrFail($id);

        if ($auditoria->estado !== 'in_progress') {
            return response()->json([
                'message' => 'El levantamiento no está en progreso',
                'success' => false
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Buscar el activo por código QR o código de barras
            $activo = Asset::where(function($query) use ($validated) {
                $query->where('codigo_qr', $validated['codigo'])
                      ->orWhere('codigo_barras', $validated['codigo']);
            })->first();

            if (!$activo) {
                // Activo extra (no esperado)
                $this->registrarActivoExtra($auditoria, $validated['codigo'], $validated['observaciones']);

                DB::commit();

                return response()->json([
                    'tipo' => 'extra',
                    'message' => 'Activo adicional encontrado (no estaba en la lista)',
                    'success' => true
                ]);
            }

            // Buscar si este activo está en la lista del levantamiento
            $item = $auditoria->items()->where('asset_id', $activo->id)->first();

            if (!$item) {
                // Activo existe pero no está en este levantamiento
                $this->registrarActivoExtra($auditoria, $validated['codigo'], $validated['observaciones']);

                DB::commit();

                return response()->json([
                    'tipo' => 'fuera_alcance',
                    'activo' => $activo,
                    'message' => 'Activo encontrado pero no pertenece a este levantamiento',
                    'success' => true
                ]);
            }

            if ($item->estado !== 'pending') {
                return response()->json([
                    'tipo' => 'ya_escaneado',
                    'activo' => $activo,
                    'message' => 'Este activo ya fue escaneado anteriormente',
                    'success' => false
                ], 422);
            }

            // Marcar como encontrado
            $datosEncontrados = [
                'responsable_id' => $activo->responsable_id,
                'ubicacion_id' => $activo->ubicacion_id,
                'estado_fisico' => $activo->estado_fisico,
                'codigo' => $validated['codigo'],
            ];

            $item->update([
                'estado' => 'found',
                'datos_encontrados' => $datosEncontrados,
                'fecha_escaneado' => now(),
                'codigo_escaneado' => $validated['codigo'],
                'observaciones' => $validated['observaciones']
            ]);

            // Incrementar contador
            $auditoria->increment('total_activos_encontrados');

            // Verificar discrepancias
            if ($item->tieneDiscrepancias()) {
                $this->registrarDiscrepancias($item);
                $item->update(['estado' => 'discrepant']);
            }

            DB::commit();

            return response()->json([
                'tipo' => 'encontrado',
                'activo' => $activo->load('categoria', 'ubicacion', 'responsable'),
                'item' => $item,
                'progreso' => $auditoria->fresh()->progreso,
                'message' => 'Activo encontrado y registrado exitosamente',
                'success' => true
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Error al procesar el escaneo: ' . $e->getMessage(),
                'success' => false
            ], 500);
        }
    }

    /**
     * Finaliza el levantamiento
     */
    public function finalizar($id)
    {
        $auditoria = InventoryAudit::findOrFail($id);

        if ($auditoria->estado !== 'in_progress') {
            return response()->json([
                'message' => 'El levantamiento no está en progreso',
                'success' => false
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Marcar items pendientes como faltantes
            $auditoria->items()
                ->where('estado', 'pending')
                ->update([
                    'estado' => 'missing'
                ]);

            // Registrar activos faltantes como hallazgos
            $itemsFaltantes = $auditoria->items()->where('estado', 'missing')->get();

            foreach ($itemsFaltantes as $item) {
                InventoryAuditFinding::create([
                    'inventory_audit_id' => $auditoria->id,
                    'tipo' => 'asset_not_found',
                    'asset_id' => $item->asset_id,
                    'descripcion' => 'Activo no encontrado durante el levantamiento',
                    'severidad' => 'high',
                    'fecha_detectado' => now(),
                ]);
            }

            // Finalizar auditoría
            $auditoria->update([
                'estado' => 'completed',
                'fecha_finalizacion' => now()
            ]);

            DB::commit();

            return response()->json([
                'auditoria' => $auditoria->fresh(),
                'message' => 'Levantamiento finalizado exitosamente',
                'success' => true
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Error al finalizar el levantamiento: ' . $e->getMessage(),
                'success' => false
            ], 500);
        }
    }

    /**
     * Obtiene el reporte final del levantamiento
     */
    public function reporte($id)
    {
        $auditoria = InventoryAudit::with([
            'items.asset.categoria',
            'items.asset.ubicacion',
            'items.asset.responsable',
            'findings.asset'
        ])->findOrFail($id);

        $reporte = [
            'encontrados' => $auditoria->itemsEncontrados()->with('asset.categoria', 'asset.ubicacion', 'asset.responsable')->get(),
            'faltantes' => $auditoria->itemsFaltantes()->with('asset.categoria', 'asset.ubicacion', 'asset.responsable')->get(),
            'discrepantes' => $auditoria->itemsDiscrepantes()->with('asset.categoria', 'asset.ubicacion', 'asset.responsable')->get(),
            'extras' => $auditoria->findings()->byTipo('asset_extra')->get(),
            'estadisticas' => [
                'total_esperados' => $auditoria->total_activos_esperados,
                'total_encontrados' => $auditoria->itemsEncontrados()->count(),
                'total_faltantes' => $auditoria->itemsFaltantes()->count(),
                'total_discrepantes' => $auditoria->itemsDiscrepantes()->count(),
                'total_extras' => $auditoria->findings()->byTipo('asset_extra')->count(),
                'porcentaje_encontrados' => $auditoria->total_activos_esperados > 0
                    ? round(($auditoria->itemsEncontrados()->count() / $auditoria->total_activos_esperados) * 100, 2)
                    : 0,
            ]
        ];

        return response()->json([
            'auditoria' => $auditoria,
            'reporte' => $reporte,
            'success' => true
        ]);
    }

    /**
     * Obtiene opciones para formularios
     */
    public function getOptions()
    {
        return response()->json([
            'categorias' => AssetCategory::select('id', 'nombre')->get(),
            'ubicaciones' => AssetLocation::select('id', 'nombre')->get(),
            'responsables' => Employee::select('id', 'nombre')->get(),
            'success' => true
        ]);
    }

    /**
     * Elimina un levantamiento (solo si está en draft)
     */
    public function destroy($id)
    {
        $auditoria = InventoryAudit::findOrFail($id);

        if ($auditoria->estado !== 'draft') {
            return response()->json([
                'message' => 'Solo se pueden eliminar levantamientos en borrador',
                'success' => false
            ], 422);
        }

        $auditoria->delete();

        return response()->json([
            'message' => 'Levantamiento eliminado exitosamente',
            'success' => true
        ]);
    }

    /**
     * Genera un código único para el levantamiento
     */
    private function generarCodigo(): string
    {
        $year = date('Y');
        $month = date('m');

        $ultimo = InventoryAudit::where('codigo', 'like', "LEV-{$year}-{$month}-%")
            ->orderBy('codigo', 'desc')
            ->first();

        if ($ultimo) {
            $numeroActual = (int) substr($ultimo->codigo, -3);
            $nuevoNumero = str_pad($numeroActual + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $nuevoNumero = '001';
        }

        return "LEV-{$year}-{$month}-{$nuevoNumero}";
    }

    /**
     * Obtiene activos según los criterios especificados
     */
    private function obtenerActivosSegunCriterios(array $criterios)
    {
        $query = Asset::with(['categoria', 'ubicacion', 'responsable']);

        if (!empty($criterios['category_ids'])) {
            $query->whereIn('categoria_id', $criterios['category_ids']);
        }

        if (!empty($criterios['location_ids'])) {
            $query->whereIn('ubicacion_id', $criterios['location_ids']);
        }

        if (!empty($criterios['employee_ids'])) {
            $query->whereIn('responsable_id', $criterios['employee_ids']);
        }

        return $query->get();
    }

    /**
     * Registra un activo extra encontrado
     */
    private function registrarActivoExtra($auditoria, $codigo, $observaciones = null)
    {
        InventoryAuditFinding::create([
            'inventory_audit_id' => $auditoria->id,
            'tipo' => 'asset_extra',
            'codigo_escaneado' => $codigo,
            'descripcion' => $observaciones ?: 'Activo adicional encontrado durante el escaneo',
            'severidad' => 'medium',
            'fecha_detectado' => now(),
        ]);
    }

    /**
     * Registra discrepancias encontradas en un ítem
     */
    private function registrarDiscrepancias($item)
    {
        $esperados = $item->datos_esperados;
        $encontrados = $item->datos_encontrados;

        // Verificar cada tipo de discrepancia
        if ($esperados['ubicacion_id'] != $encontrados['ubicacion_id']) {
            InventoryAuditFinding::create([
                'inventory_audit_id' => $item->inventory_audit_id,
                'tipo' => 'location_changed',
                'asset_id' => $item->asset_id,
                'valor_esperado' => ['ubicacion_id' => $esperados['ubicacion_id']],
                'valor_encontrado' => ['ubicacion_id' => $encontrados['ubicacion_id']],
                'descripcion' => 'El activo se encuentra en una ubicación diferente a la registrada',
                'severidad' => 'medium',
                'fecha_detectado' => now(),
            ]);
        }

        if ($esperados['responsable_id'] != $encontrados['responsable_id']) {
            InventoryAuditFinding::create([
                'inventory_audit_id' => $item->inventory_audit_id,
                'tipo' => 'responsible_changed',
                'asset_id' => $item->asset_id,
                'valor_esperado' => ['responsable_id' => $esperados['responsable_id']],
                'valor_encontrado' => ['responsable_id' => $encontrados['responsable_id']],
                'descripcion' => 'El activo tiene un responsable diferente al registrado',
                'severidad' => 'medium',
                'fecha_detectado' => now(),
            ]);
        }

        if ($esperados['estado_fisico'] != $encontrados['estado_fisico']) {
            InventoryAuditFinding::create([
                'inventory_audit_id' => $item->inventory_audit_id,
                'tipo' => 'condition_changed',
                'asset_id' => $item->asset_id,
                'valor_esperado' => ['estado_fisico' => $esperados['estado_fisico']],
                'valor_encontrado' => ['estado_fisico' => $encontrados['estado_fisico']],
                'descripcion' => 'El activo tiene un estado físico diferente al registrado',
                'severidad' => 'low',
                'fecha_detectado' => now(),
            ]);
        }
    }
}
