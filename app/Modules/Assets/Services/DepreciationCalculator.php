<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Contracts\DepreciationMethod;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Assets\Services\Depreciation\LinearDepreciation;
use App\Modules\Assets\Services\Depreciation\AcceleratedDepreciation;
use App\Modules\Assets\Services\Depreciation\UnitsOfProductionDepreciation;

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
     * Resolver el método de depreciación correcto para un activo
     */
    public function resolveMethod(Asset $asset): DepreciationMethod
    {
        // Prioridad: activo → categoría → lineal por defecto
        $metodo = $asset->metodo_depreciacion
            ?? $asset->categoria?->metodo_depreciacion
            ?? 'lineal';

        return match ($metodo) {
            'acelerada' => new AcceleratedDepreciation(),
            'unidades_producidas' => new UnitsOfProductionDepreciation(),
            default => new LinearDepreciation(),
        };
    }

    /**
     * Calcular depreciación para un activo
     */
    public function calculateForAsset(Asset $asset): array
    {
        // Resolver método automáticamente desde el activo
        $method = $this->resolveMethod($asset);

        $vidaUtil = $asset->vida_util_anos ?? 5;
        $valorCompra = $asset->valor_compra;
        $valorResidual = $asset->valor_residual ?? 0;

        $depreciacionAcumulada = 0;
        $valorEnLibros = $valorCompra;
        $depreciaciones = [];

        for ($periodo = 1; $periodo <= $vidaUtil; $periodo++) {
            $depreciacionPeriodo = $method->calculate($valorCompra, $valorResidual, $vidaUtil, $periodo);
            $depreciacionAcumulada += $depreciacionPeriodo;
            $valorEnLibros = $valorCompra - $depreciacionAcumulada;

            // Asegurar que no sea menor que el valor residual
            if ($valorEnLibros < $valorResidual) {
                $valorEnLibros = $valorResidual;
                $depreciacionAcumulada = $valorCompra - $valorResidual;
            }

            $depreciaciones[$periodo] = [
                'periodo' => $periodo,
                'depreciacion_valor' => round($depreciacionPeriodo, 2),
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
