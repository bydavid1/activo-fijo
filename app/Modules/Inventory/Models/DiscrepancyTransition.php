<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class DiscrepancyTransition extends Model
{
    protected $table = 'discrepancy_transitions';

    public $timestamps = true;

    protected $fillable = [
        'discrepancy_id',
        'estado_anterior',
        'estado_nuevo',
        'usuario_id',
        'razon',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function discrepancia()
    {
        return $this->belongsTo(InventoryDiscrepancy::class, 'discrepancy_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }
}
