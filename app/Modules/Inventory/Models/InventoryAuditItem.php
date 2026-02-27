<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Assets\Models\Asset;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAuditItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_audit_id',
        'asset_id',
        'estado',
        'datos_esperados',
        'datos_encontrados',
        'fecha_escaneado',
        'codigo_escaneado',
        'observaciones',
    ];

    protected $casts = [
        'datos_esperados' => 'array',
        'datos_encontrados' => 'array',
        'fecha_escaneado' => 'datetime',
    ];

    /**
     * Levantamiento al que pertenece este ítem
     */
    public function audit(): BelongsTo
    {
        return $this->belongsTo(InventoryAudit::class, 'inventory_audit_id');
    }

    /**
     * Activo asociado
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    /**
     * Marca el ítem como encontrado
     */
    public function marcarComoEncontrado($datosEncontrados = [], $observaciones = null)
    {
        $this->update([
            'estado' => 'found',
            'datos_encontrados' => $datosEncontrados,
            'fecha_escaneado' => now(),
            'observaciones' => $observaciones,
        ]);

        // Incrementar contador en la auditoría
        $this->audit->increment('total_activos_encontrados');

        return $this;
    }

    /**
     * Marca el ítem como faltante
     */
    public function marcarComoFaltante($observaciones = null)
    {
        $this->update([
            'estado' => 'missing',
            'observaciones' => $observaciones,
        ]);

        return $this;
    }

    /**
     * Detecta si hay discrepancias entre datos esperados y encontrados
     */
    public function tieneDiscrepancias(): bool
    {
        if (empty($this->datos_esperados) || empty($this->datos_encontrados)) {
            return false;
        }

        // Comparar campos críticos
        $camposCriticos = ['responsable_id', 'ubicacion_id', 'estado_fisico'];

        foreach ($camposCriticos as $campo) {
            if (isset($this->datos_esperados[$campo]) &&
                isset($this->datos_encontrados[$campo]) &&
                $this->datos_esperados[$campo] != $this->datos_encontrados[$campo]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Scope para filtrar por estado
     */
    public function scopeByEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    /**
     * Scope para ítems escaneados
     */
    public function scopeEscaneados($query)
    {
        return $query->whereNotNull('fecha_escaneado');
    }
}
