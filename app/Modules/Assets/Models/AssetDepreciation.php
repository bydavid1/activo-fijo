<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;

class AssetDepreciation extends Model
{
    protected $table = 'asset_depreciation';

    public $timestamps = true;

    protected $fillable = [
        'asset_id',
        'tipo_depreciacion',
        'periodo',
        'ano',
        'mes',
        'depreciacion_valor',
        'depreciacion_acumulada',
        'valor_en_libros',
    ];

    protected $casts = [
        'depreciacion_valor' => 'decimal:2',
        'depreciacion_acumulada' => 'decimal:2',
        'valor_en_libros' => 'decimal:2',
        'ano' => 'integer',
        'mes' => 'integer',
    ];

    // Constantes para tipo de depreciación
    const TIPO_FISCAL = 'fiscal';
    const TIPO_FINANCIERA = 'financiera';

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    // Scopes
    public function scopeFiscal($query)
    {
        return $query->where('tipo_depreciacion', self::TIPO_FISCAL);
    }

    public function scopeFinanciera($query)
    {
        return $query->where('tipo_depreciacion', self::TIPO_FINANCIERA);
    }

    public function scopeDelAno($query, int $ano)
    {
        return $query->where('ano', $ano);
    }

    public function scopeDelMes($query, int $ano, int $mes)
    {
        return $query->where('ano', $ano)->where('mes', $mes);
    }
}
