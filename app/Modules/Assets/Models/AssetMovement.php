<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetMovement extends Model
{
    use SoftDeletes;

    protected $table = 'asset_movements';

    protected $fillable = [
        'asset_id',
        'ubicacion_anterior_id',
        'ubicacion_nueva_id',
        'responsable_anterior_id',
        'responsable_nuevo_id',
        'tipo',
        'motivo',
        'fecha_devolucion_esperada',
        'usuario_id',
    ];

    protected $casts = [
        'fecha_devolucion_esperada' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function ubicacionAnterior()
    {
        return $this->belongsTo(AssetLocation::class, 'ubicacion_anterior_id');
    }

    public function ubicacionNueva()
    {
        return $this->belongsTo(AssetLocation::class, 'ubicacion_nueva_id');
    }

    public function responsableAnterior()
    {
        return $this->belongsTo(\App\Modules\Employees\Models\Employee::class, 'responsable_anterior_id');
    }

    public function responsableNuevo()
    {
        return $this->belongsTo(\App\Modules\Employees\Models\Employee::class, 'responsable_nuevo_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }
}
