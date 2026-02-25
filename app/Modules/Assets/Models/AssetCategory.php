<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetCategory extends Model
{
    use SoftDeletes;

    protected $table = 'asset_categories';

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'metodo_depreciacion',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'categoria_id');
    }
}
