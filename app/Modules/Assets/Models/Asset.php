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
        'asset_type_id',
        'categoria_id',
        'ubicacion_id',
        'proveedor_id',
        'responsable_id',
        'valor_compra',
        'valor_residual',
        'vida_util_anos',
        'fecha_adquisicion',
        'metodo_depreciacion',
        'periodicidad_depreciacion',
        'aplicar_regla_dia_15',
        'fecha_inicio_depreciacion',
        'estado',
        'tipo_adquisicion',
        'orden_compra',
        'numero_factura',
        'donante_nombre',
        'donacion_documento',
    ];

    protected $casts = [
        'fecha_adquisicion' => 'date',
        'fecha_inicio_depreciacion' => 'date',
        'valor_compra' => 'decimal:2',
        'valor_residual' => 'decimal:2',
        'aplicar_regla_dia_15' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relaciones
    public function tipoBien()
    {
        return $this->belongsTo(AssetType::class, 'asset_type_id');
    }

    public function customValues()
    {
        return $this->hasMany(AssetCustomValue::class, 'asset_id');
    }

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

    public function attachments(): HasMany
    {
        return $this->hasMany(AssetAttachment::class, 'asset_id');
    }

    public function fotoPrincipal()
    {
        return $this->hasOne(AssetAttachment::class, 'asset_id')
                    ->where('tipo', 'foto')
                    ->where('es_principal', true);
    }

    // ═══════════════ MÉTODOS DE DEPRECIACIÓN ═══════════════

    /**
     * Calcula la fecha de inicio de depreciación según regla del día 15
     */
    public function calcularFechaInicioDepreciacion(): \Carbon\Carbon
    {
        if ($this->fecha_inicio_depreciacion) {
            return $this->fecha_inicio_depreciacion;
        }

        $fechaAdquisicion = $this->fecha_adquisicion;

        if ($this->aplicar_regla_dia_15 && $fechaAdquisicion->day > 15) {
            // Si es después del 15, empieza el primer día del mes siguiente
            return $fechaAdquisicion->copy()->addMonth()->startOfMonth();
        }

        // Si es antes o el día 15, empieza el primer día del mes actual
        return $fechaAdquisicion->copy()->startOfMonth();
    }

    /**
     * Calcula la depreciación mensual
     */
    public function getDepreciacionMensualAttribute(): float
    {
        if (!$this->vida_util_anos || $this->vida_util_anos <= 0) {
            return 0;
        }

        $valorDepreciable = $this->valor_compra - $this->valor_residual;
        return $valorDepreciable / ($this->vida_util_anos * 12);
    }

    /**
     * Calcula la depreciación anual
     */
    public function getDepreciacionAnualAttribute(): float
    {
        if (!$this->vida_util_anos || $this->vida_util_anos <= 0) {
            return 0;
        }

        $valorDepreciable = $this->valor_compra - $this->valor_residual;
        return $valorDepreciable / $this->vida_util_anos;
    }

    /**
     * Calcula meses transcurridos desde inicio de depreciación
     */
    public function getMesesDepreciadosAttribute(): int
    {
        $fechaInicio = $this->calcularFechaInicioDepreciacion();
        return $fechaInicio->diffInMonths(now());
    }

    /**
     * Calcula la depreciación acumulada hasta hoy
     */
    public function getDepreciacionAcumuladaAttribute(): float
    {
        $meses = $this->meses_depreciados;
        $mesesVidaUtil = $this->vida_util_anos * 12;

        // No puede superar los meses de vida útil
        $meses = min($meses, $mesesVidaUtil);

        return $this->depreciacion_mensual * $meses;
    }

    /**
     * Calcula el valor en libros actual
     */
    public function getValorEnLibrosAttribute(): float
    {
        $valorEnLibros = $this->valor_compra - $this->depreciacion_acumulada;
        return max($valorEnLibros, $this->valor_residual);
    }

    /**
     * Porcentaje de vida útil transcurrido
     */
    public function getPorcentajeVidaUtilAttribute(): float
    {
        if (!$this->vida_util_anos) return 0;

        $mesesVidaUtil = $this->vida_util_anos * 12;
        $mesesTranscurridos = min($this->meses_depreciados, $mesesVidaUtil);

        return ($mesesTranscurridos / $mesesVidaUtil) * 100;
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
