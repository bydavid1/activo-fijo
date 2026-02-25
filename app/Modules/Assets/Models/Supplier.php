<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'suppliers';

    protected $fillable = [
        'nombre',
        'codigo',
        'nit',
        'email',
        'telefono',
        'ciudad',
        'direccion',
    ];

    /**
     * Relación: Un proveedor tiene muchos activos
     */
    public function assets()
    {
        return $this->hasMany(Asset::class, 'proveedor_id');
    }
}
