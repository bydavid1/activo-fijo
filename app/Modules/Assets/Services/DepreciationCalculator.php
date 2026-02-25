<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Contracts\DepreciationMethod;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Assets\Services\Depreciation\LinearDepreciation;

class DepreciationCalculator
{
    private DepreciationMethod $method;

    public function __construct(?DepreciationMethod $method = null)
    {
        $this->method = $method ?? new LinearDepreciation();
    }

    /**
     * Establecer método de depreciación
     */
    public function setMethod(DepreciationMethod $method): self
    {
        $this->method = $method;
        return $this;
    }

    /**
     * Calcular depreciación para un activo
     */
    public function calculateForAsset(Asset $asset): array
    {
        $vidaUtil = $asset->vida_util_anos ?? 5; // por defecto 5 años
        $valorCompra = $asset->valor_compra;
        $valorResidual = $asset->valor_residual ?? 0;

        $depreciacionAnual = $this->method->calculate($valorCompra, $valorResidual, $vidaUtil, 1);
        $depreciacionAcumulada = 0;
        $valorEnLibros = $valorCompra;

        $depreciaciones = [];

        for ($periodo = 1; $periodo <= $vidaUtil; $periodo++) {
            $depreciacionAcumulada += $depreciacionAnual;
            $valorEnLibros = $valorCompra - $depreciacionAcumulada;

            // Asegurar que no sea menor que el valor residual
            if ($valorEnLibros < $valorResidual) {
                $valorEnLibros = $valorResidual;
                $depreciacionAcumulada = $valorCompra - $valorResidual;
            }

            $depreciaciones[$periodo] = [
                'periodo' => $periodo,
                'depreciacion_valor' => round($depreciacionAnual, 2),
                'depreciacion_acumulada' => round($depreciacionAcumulada, 2),
                'valor_en_libros' => round($valorEnLibros, 2),
            ];
        }

        return $depreciaciones;
    }

    /**
     * Guardar depreciaciones en BD
     */
    public function saveDepreciation(Asset $asset): void
    {
        $depreciaciones = $this->calculateForAsset($asset);

        foreach ($depreciaciones as $data) {
            AssetDepreciation::updateOrCreate(
                ['asset_id' => $asset->id, 'periodo' => $data['periodo']],
                $data
            );
        }
    }

    /**
     * Obtener depreciación actual de un activo
     */
    public function getCurrentValuation(Asset $asset): array
    {
        $depreciacion = AssetDepreciation::where('asset_id', $asset->id)
            ->latest('periodo')
            ->first();

        return $depreciacion ? $depreciacion->toArray() : [
            'valor_en_libros' => $asset->valor_compra,
            'depreciacion_acumulada' => 0,
        ];
    }
}
