<?php

namespace App\Modules\Assets\Services\Depreciation;

use App\Modules\Assets\Contracts\DepreciationMethod;

/**
 * Depreciación por unidades producidas
 * Distribuye la depreciación uniformemente por periodo (equivalente a lineal)
 * En producción real, se extendería para recibir las unidades producidas por periodo.
 */
class UnitsOfProductionDepreciation implements DepreciationMethod
{
    public function calculate(float $valorCompra, float $valorResidual, int $vidaUtil, int $periodo): float
    {
        // Sin datos reales de unidades producidas, usa distribución uniforme
        // En un caso real: (valorCompra - valorResidual) * (unidadesPeriodo / unidadesTotales)
        return ($valorCompra - $valorResidual) / $vidaUtil;
    }

    public function getName(): string
    {
        return 'Depreciación por Unidades Producidas';
    }
}
