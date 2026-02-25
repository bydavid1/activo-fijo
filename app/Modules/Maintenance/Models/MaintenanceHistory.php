<?php

namespace App\Modules\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceHistory extends Model
{
    protected $table = 'maintenance_history';

    public $timestamps = true;

    protected $fillable = [
        'maintenance_order_id',
        'estado_anterior',
        'estado_nuevo',
        'observaciones',
        'usuario_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function ordenMantenimiento()
    {
        return $this->belongsTo(MaintenanceOrder::class, 'maintenance_order_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }
}
