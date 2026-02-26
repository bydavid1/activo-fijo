<?php

namespace App\Modules\Assets\Services\Depreciation;

use App\Modules\Assets\Contracts\DepreciationMethod;

/**
 * Depreciación acelerada (suma de dígitos de los años)
 * Los primeros años deprecian más que los últimos.
 */
class AcceleratedDepreciation implements DepreciationMethod
{
    public function calculate(float $valorCompra, float $valorResidual, int $vidaUtil, int $periodo): float
    {
        // Método de suma de dígitos de los años
        $sumaDigitos = ($vidaUtil * ($vidaUtil + 1)) / 2;
        $anosRestantes = $vidaUtil - $periodo + 1;
        $factor = $anosRestantes / $sumaDigitos;

        return ($valorCompra - $valorResidual) * $factor;
    }

    public function getName(): string
    {
        return 'Depreciación Acelerada (Suma de Dígitos)';
    }
}
