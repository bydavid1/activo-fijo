<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryCapture extends Model
{
    use SoftDeletes;

    protected $table = 'inventory_captures';

    public $timestamps = true;

    protected $fillable = [
        'cycle_id',
        'asset_id',
        'capturado_por_id',
        'metodo',
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

    public function capturadoPor()
    {
        return $this->belongsTo(\App\Models\User::class, 'capturado_por_id');
    }
}
