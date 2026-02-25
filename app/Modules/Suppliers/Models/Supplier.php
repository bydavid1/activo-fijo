<?php

namespace App\Modules\Suppliers\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    protected $table = 'suppliers';

    protected $fillable = [
        'nombre',
        'codigo',
        'nit',
        'email',
        'telefono',
        'direccion',
        'ciudad',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function activos(): HasMany
    {
        return $this->hasMany(\App\Modules\Assets\Models\Asset::class, 'proveedor_id');
    }
}
