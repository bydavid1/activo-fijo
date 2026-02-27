<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetType extends Model
{
    use SoftDeletes;

    protected $table = 'asset_types';

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'es_depreciable',
        'vida_util_default',
        'cuenta_contable',
    ];

    protected $casts = [
        'es_depreciable' => 'boolean',
        'vida_util_default' => 'integer',
    ];

    // ── Relaciones ──

    public function properties(): HasMany
    {
        return $this->hasMany(AssetTypeProperty::class)->orderBy('orden');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'asset_type_id');
    }
}
