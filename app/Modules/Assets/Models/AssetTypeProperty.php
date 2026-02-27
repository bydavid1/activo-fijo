<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetTypeProperty extends Model
{
    protected $table = 'asset_type_properties';

    protected $fillable = [
        'asset_type_id',
        'nombre',
        'etiqueta',
        'tipo_dato',
        'opciones',
        'requerido',
        'orden',
    ];

    protected $casts = [
        'opciones' => 'array',
        'requerido' => 'boolean',
        'orden' => 'integer',
    ];

    // ── Relaciones ──

    public function assetType(): BelongsTo
    {
        return $this->belongsTo(AssetType::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(AssetCustomValue::class, 'asset_type_property_id');
    }
}
