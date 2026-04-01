<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Contracts\DepreciationMethod;
use App\Modules\Assets\Events\AssetDepreciated;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Assets\Services\Depreciation\LinearDepreciation;
use App\Modules\Assets\Services\Depreciation\AcceleratedDepreciation;
use App\Modules\Assets\Services\Depreciation\UnitsOfProductionDepreciation;
use App\Models\SystemSetting;

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
     * Resolver la vida útil de un activo usando:
     * 1. El valor configurado en el activo
     * 2. La tasa del tipo de bien en system_settings
     * 3. La vida útil default del tipo de bien
     * 4. 5 años como fallback
     */
    public function resolveVidaUtil(Asset $asset): int
    {
        // Si el activo tiene vida útil explícita, usarla
        if ($asset->vida_util_anos && $asset->vida_util_anos > 0) {
            return $asset->vida_util_anos;
        }

        // Intentar derivar de la tasa configurada en system_settings
        if ($asset->tipoBien) {
            $tasasPorTipo = SystemSetting::get('tasas_por_tipo', []);
            $codigo = $asset->tipoBien->codigo;

            if (isset($tasasPorTipo[$codigo]) && $tasasPorTipo[$codigo]['tasa'] > 0) {
                return (int) round(100 / $tasasPorTipo[$codigo]['tasa']);
            }

            // Fallback a la vida útil default del tipo de bien
            if ($asset->tipoBien->vida_util_default) {
                return $asset->tipoBien->vida_util_default;
            }
        }

        return 5; // fallback final
    }

    /**
     * Calcular depreciación para un activo
     */
    public function calculateForAsset(Asset $asset): array
    {
        // Resolver método automáticamente desde el activo
        $method = $this->resolveMethod($asset);

        $vidaUtil = $this->resolveVidaUtil($asset);
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

        // Limpiar previas depreciaciones de este activo según estrategia (opcional),
        // pero AssetDepreciation::updateOrCreate lo maneja por periodo

        $depreciacionesGuardadas = [];
        foreach ($depreciaciones as $data) {
            $depreciacionesGuardadas[] = AssetDepreciation::updateOrCreate(
                ['asset_id' => $asset->id, 'periodo' => $data['periodo']],
                $data
            )->toArray();
        }

        // Emitir evento para el módulo contable
        event(new AssetDepreciated($asset, $depreciacionesGuardadas));
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
