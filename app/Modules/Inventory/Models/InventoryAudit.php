<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use App\Modules\Assets\Models\Asset;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'criterios',
        'estado',
        'total_activos_esperados',
        'total_activos_encontrados',
        'created_by',
        'fecha_inicio',
        'fecha_finalizacion',
    ];

    protected $casts = [
        'criterios' => 'array',
        'fecha_inicio' => 'datetime',
        'fecha_finalizacion' => 'datetime',
    ];

    /**
     * Usuario que creó el levantamiento
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Ítems del levantamiento
     */
    public function items(): HasMany
    {
        return $this->hasMany(InventoryAuditItem::class);
    }

    /**
     * Hallazgos/discrepancias del levantamiento
     */
    public function findings(): HasMany
    {
        return $this->hasMany(InventoryAuditFinding::class);
    }

    /**
     * Items encontrados
     */
    public function itemsEncontrados(): HasMany
    {
        return $this->items()->where('estado', 'found');
    }

    /**
     * Items faltantes
     */
    public function itemsFaltantes(): HasMany
    {
        return $this->items()->where('estado', 'missing');
    }

    /**
     * Items con discrepancias
     */
    public function itemsDiscrepantes(): HasMany
    {
        return $this->items()->where('estado', 'discrepant');
    }

    /**
     * Calcula el progreso del levantamiento
     */
    public function getProgresoAttribute(): float
    {
        if ($this->total_activos_esperados == 0) {
            return 0;
        }

        $procesados = $this->items()->whereIn('estado', ['found', 'missing', 'discrepant'])->count();
        return round(($procesados / $this->total_activos_esperados) * 100, 2);
    }

    /**
     * Scope para filtrar por estado
     */
    public function scopeByEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    /**
     * Scope para levantamientos del usuario actual
     */
    public function scopeMios($query, $userId = null)
    {
        $userId = $userId ?: auth()->id();
        return $query->where('created_by', $userId);
    }
}
