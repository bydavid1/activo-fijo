<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryDiscrepancy extends Model
{
    use SoftDeletes;

    protected $table = 'inventory_discrepancies';

    protected $fillable = [
        'cycle_id',
        'asset_id',
        'estado',
        'tipo_discrepancia',
        'descripcion',
        'usuario_id',
        'aprobado_por_id',
        'notas_aprobacion',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function ciclo()
    {
        return $this->belongsTo(InventoryCycle::class, 'cycle_id');
    }

    public function activo()
    {
        return $this->belongsTo(\App\Modules\Assets\Models\Asset::class, 'asset_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }

    public function aprobadoPor()
    {
        return $this->belongsTo(\App\Models\User::class, 'aprobado_por_id');
    }

    public function transiciones(): HasMany
    {
        return $this->hasMany(DiscrepancyTransition::class, 'discrepancy_id');
    }

    // Scopes
    public function scopePendienteAprobacion($query)
    {
        return $query->where('estado', 'pendiente_aprobacion');
    }

    public function scopeAprobadas($query)
    {
        return $query->where('estado', 'aprobada');
    }

    public function scopeRechazadas($query)
    {
        return $query->where('estado', 'rechazada');
    }
}
