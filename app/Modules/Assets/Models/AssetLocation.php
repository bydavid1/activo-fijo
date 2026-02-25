<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetLocation extends Model
{
    use SoftDeletes;

    protected $table = 'asset_locations';

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'edificio',
        'piso',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'ubicacion_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(AssetMovement::class, 'ubicacion_nueva_id');
    }
}
