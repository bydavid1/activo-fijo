<?php

namespace App\Modules\Assets\Contracts;

interface DepreciationMethod
{
    /**
     * Calcular depreciación para el período
     */
    public function calculate(float $valorCompra, float $valorResidual, int $vidaUtil, int $periodo): float;

    /**
     * Obtener nombre del método
     */
    public function getName(): string;
}
