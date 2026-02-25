<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryCycle extends Model
{
    use SoftDeletes;

    protected $table = 'inventory_cycles';

    protected $fillable = [
        'nombre',
        'estado',
        'fecha_inicio',
        'fecha_fin',
        'ubicacion_id',
        'usuario_responsable_id',
        'notas',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function ubicacion()
    {
        return $this->belongsTo(\App\Modules\Assets\Models\AssetLocation::class, 'ubicacion_id');
    }

    public function usuarioResponsable()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_responsable_id');
    }

    public function capturas(): HasMany
    {
        return $this->hasMany(InventoryCapture::class, 'cycle_id');
    }

    public function discrepancias(): HasMany
    {
        return $this->hasMany(InventoryDiscrepancy::class, 'cycle_id');
    }
}
