<?php

namespace App\Modules\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaintenanceOrder extends Model
{
    use SoftDeletes;

    protected $table = 'maintenance_orders';

    protected $fillable = [
        'numero',
        'asset_id',
        'tipo',
        'estado',
        'fecha_programada',
        'fecha_completada',
        'descripcion',
        'asignado_a_id',
        'usuario_id',
        'costo_estimado',
        'costo_real',
    ];

    protected $casts = [
        'fecha_programada' => 'date',
        'fecha_completada' => 'date',
        'costo_estimado' => 'decimal:2',
        'costo_real' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function activo()
    {
        return $this->belongsTo(\App\Modules\Assets\Models\Asset::class, 'asset_id');
    }

    public function asignadoA()
    {
        return $this->belongsTo(\App\Models\User::class, 'asignado_a_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(MaintenanceHistory::class, 'maintenance_order_id');
    }

    // Scopes
    public function scopeCompletadas($query)
    {
        return $query->where('estado', 'completado');
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeEnEjecucion($query)
    {
        return $query->where('estado', 'en_ejecucion');
    }
}
