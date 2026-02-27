<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Assets\Models\Asset;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAuditFinding extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_audit_id',
        'tipo',
        'asset_id',
        'codigo_escaneado',
        'valor_esperado',
        'valor_encontrado',
        'descripcion',
        'severidad',
        'resuelto',
        'fecha_detectado',
    ];

    protected $casts = [
        'valor_esperado' => 'array',
        'valor_encontrado' => 'array',
        'resuelto' => 'boolean',
        'fecha_detectado' => 'datetime',
    ];

    /**
     * Levantamiento al que pertenece este hallazgo
     */
    public function audit(): BelongsTo
    {
        return $this->belongsTo(InventoryAudit::class, 'inventory_audit_id');
    }

    /**
     * Activo asociado (puede ser null para activos extras)
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    /**
     * Obtiene descripción legible del tipo de hallazgo
     */
    public function getTipoDescripcionAttribute(): string
    {
        return match($this->tipo) {
            'asset_not_found' => 'Activo no encontrado',
            'asset_extra' => 'Activo adicional encontrado',
            'location_changed' => 'Cambio de ubicación',
            'responsible_changed' => 'Cambio de responsable',
            'condition_changed' => 'Cambio de estado físico',
            'other_discrepancy' => 'Otra discrepancia',
            default => 'Desconocido'
        };
    }

    /**
     * Obtiene el color del badge según la severidad
     */
    public function getSeveridadColorAttribute(): string
    {
        return match($this->severidad) {
            'low' => 'success',
            'medium' => 'warning',
            'high' => 'danger',
            default => 'secondary'
        };
    }

    /**
     * Marca el hallazgo como resuelto
     */
    public function resolver()
    {
        $this->update([
            'resuelto' => true,
        ]);

        return $this;
    }

    /**
     * Scope para hallazgos no resueltos
     */
    public function scopePendientes($query)
    {
        return $query->where('resuelto', false);
    }

    /**
     * Scope para filtrar por tipo
     */
    public function scopeByTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope para filtrar por severidad
     */
    public function scopeBySeveridad($query, $severidad)
    {
        return $query->where('severidad', $severidad);
    }
}
