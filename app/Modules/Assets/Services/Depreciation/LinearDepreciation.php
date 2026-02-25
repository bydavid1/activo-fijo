<?php

namespace App\Modules\Assets\Services\Depreciation;

use App\Modules\Assets\Contracts\DepreciationMethod;

class LinearDepreciation implements DepreciationMethod
{
    /**
     * Cálculo de depreciación lineal: (Valor Compra - Valor Residual) / Años de Vida Útil
     */
    public function calculate(float $valorCompra, float $valorResidual, int $vidaUtil, int $periodo): float
    {
        if ($vidaUtil <= 0 || $periodo <= 0) {
            return 0;
        }

        $depreciacionAnual = ($valorCompra - $valorResidual) / $vidaUtil;
        return round($depreciacionAnual, 2);
    }

    public function getName(): string
    {
        return 'Depreciación Lineal';
    }
}
