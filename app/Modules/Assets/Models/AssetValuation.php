<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetValuation extends Model
{
    use SoftDeletes;

    protected $table = 'asset_valuations';

    protected $fillable = [
        'asset_id',
        'valor_anterior',
        'valor_nuevo',
        'fecha_efectiva',
        'metodo',
        'tipo_revaluo',
        'perito_nombre',
        'documento_respaldo',
        'notas',
        'usuario_id',
    ];

    // Constantes para tipos de revalúo
    const TIPO_REVALORIZACION = 'revalorizacion';
    const TIPO_DETERIORO = 'deterioro';
    const TIPO_AJUSTE_INFLACION = 'ajuste_inflacion';
    const TIPO_TASACION = 'tasacion';

    protected $casts = [
        'fecha_efectiva' => 'date',
        'valor_anterior' => 'decimal:2',
        'valor_nuevo' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }
}
