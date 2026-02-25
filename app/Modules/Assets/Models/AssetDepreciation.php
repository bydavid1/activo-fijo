<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;

class AssetDepreciation extends Model
{
    protected $table = 'asset_depreciation';

    public $timestamps = false;

    protected $fillable = [
        'asset_id',
        'periodo',
        'depreciacion_valor',
        'depreciacion_acumulada',
        'valor_en_libros',
    ];

    protected $casts = [
        'depreciacion_valor' => 'decimal:2',
        'depreciacion_acumulada' => 'decimal:2',
        'valor_en_libros' => 'decimal:2',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }
}
