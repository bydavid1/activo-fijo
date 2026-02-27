<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetCustomValue extends Model
{
    protected $table = 'asset_custom_values';

    protected $fillable = [
        'asset_id',
        'asset_type_property_id',
        'valor',
    ];

    // ── Relaciones ──

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(AssetTypeProperty::class, 'asset_type_property_id');
    }

    /**
     * Obtener el valor casteado según el tipo_dato de la propiedad
     */
    public function getValorCasteadoAttribute()
    {
        $tipoDato = $this->property->tipo_dato ?? 'texto';

        return match ($tipoDato) {
            'numero' => (int) $this->valor,
            'decimal' => (float) $this->valor,
            'booleano' => filter_var($this->valor, FILTER_VALIDATE_BOOLEAN),
            'fecha' => $this->valor,
            default => $this->valor,
        };
    }
}
