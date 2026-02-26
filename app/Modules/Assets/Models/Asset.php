<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $table = 'assets';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'marca',
        'modelo',
        'serie',
        'categoria_id',
        'ubicacion_id',
        'proveedor_id',
        'responsable_id',
        'valor_compra',
        'valor_residual',
        'vida_util_anos',
        'fecha_adquisicion',
        'metodo_depreciacion',
        'estado',
    ];

    protected $casts = [
        'fecha_adquisicion' => 'date',
        'valor_compra' => 'decimal:2',
        'valor_residual' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relaciones
    public function categoria()
    {
        return $this->belongsTo(AssetCategory::class, 'categoria_id');
    }

    public function ubicacion()
    {
        return $this->belongsTo(AssetLocation::class, 'ubicacion_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(\App\Modules\Suppliers\Models\Supplier::class, 'proveedor_id');
    }

    public function responsable()
    {
        return $this->belongsTo(\App\Modules\Employees\Models\Employee::class, 'responsable_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(AssetMovement::class, 'asset_id');
    }

    public function valuaciones(): HasMany
    {
        return $this->hasMany(AssetValuation::class, 'asset_id');
    }

    public function depreciaciones(): HasMany
    {
        return $this->hasMany(AssetDepreciation::class, 'asset_id');
    }

    public function qrAccesses(): HasMany
    {
        return $this->hasMany(\App\Modules\Assets\Models\QRAccess::class, 'asset_id');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopeByLocation($query, $locationId)
    {
        return $query->where('ubicacion_id', $locationId);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('categoria_id', $categoryId);
    }

    public function scopeByResponsible($query, $employeeId)
    {
        return $query->where('responsable_id', $employeeId);
    }
}
