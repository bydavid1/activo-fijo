<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetMovement extends Model
{
    use SoftDeletes;

    protected $table = 'asset_movements';

    protected $fillable = [
        'asset_id',
        'ubicacion_anterior_id',
        'ubicacion_nueva_id',
        'responsable_anterior_id',
        'responsable_nuevo_id',
        'tipo',
        'motivo',
        'fecha_devolucion_esperada',
        'usuario_id',
        // Campos de venta
        'tipo_venta',
        'tipo_pago',
        'condicion_pago',
        'precio_venta',
        'comprador_nombre',
        'comprador_documento',
        'comprador_telefono',
        'documento_venta',
    ];

    protected $casts = [
        'fecha_devolucion_esperada' => 'date',
        'precio_venta' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Constantes para tipos de movimiento
    const TIPO_TRASLADO = 'traslado';
    const TIPO_REUBICACION = 'reubicacion';
    const TIPO_MANTENIMIENTO = 'mantenimiento';
    const TIPO_VENTA = 'venta';
    const TIPO_BAJA = 'baja';
    const TIPO_OTRO = 'otro';

    // Constantes para tipos de venta
    const VENTA_DIRECTA = 'directa';
    const VENTA_SUBASTA = 'subasta';
    const VENTA_LICITACION = 'licitacion';

    // Constantes para tipos de pago
    const PAGO_EFECTIVO = 'efectivo';
    const PAGO_TRANSFERENCIA = 'transferencia';
    const PAGO_CHEQUE = 'cheque';
    const PAGO_TARJETA = 'tarjeta';
    const PAGO_OTRO = 'otro';

    // Constantes para condiciones de pago
    const CONDICION_CONTADO = 'contado';
    const CONDICION_CREDITO_30 = 'credito_30';
    const CONDICION_CREDITO_60 = 'credito_60';
    const CONDICION_CREDITO_90 = 'credito_90';

    /**
     * Verifica si es un movimiento de venta
     */
    public function esVenta(): bool
    {
        return $this->tipo === self::TIPO_VENTA;
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function ubicacionAnterior()
    {
        return $this->belongsTo(AssetLocation::class, 'ubicacion_anterior_id');
    }

    public function ubicacionNueva()
    {
        return $this->belongsTo(AssetLocation::class, 'ubicacion_nueva_id');
    }

    public function responsableAnterior()
    {
        return $this->belongsTo(\App\Modules\Employees\Models\Employee::class, 'responsable_anterior_id');
    }

    public function responsableNuevo()
    {
        return $this->belongsTo(\App\Modules\Employees\Models\Employee::class, 'responsable_nuevo_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }
}
