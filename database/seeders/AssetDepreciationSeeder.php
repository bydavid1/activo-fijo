<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AssetDepreciationSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $assets = Asset::whereNotNull('vida_util_anos')
                      ->where('vida_util_anos', '>', 0)
                      ->get();

        foreach ($assets as $asset) {
            $fechaAdquisicion = Carbon::parse($asset->fecha_adquisicion);
            $fechaActual = Carbon::now();
            $vidaUtilMeses = $asset->vida_util_anos * 12;
            $valorResidual = $asset->valor_residual ?? ($asset->valor_compra * 0.1);
            $valorDepreciable = $asset->valor_compra - $valorResidual;
            $depreciacionMensual = $valorDepreciable / $vidaUtilMeses;

            // Generar depreciaciones desde la fecha de adquisición hasta ahora
            $fechaActualCalculo = $fechaAdquisicion->copy();
            $depreciacionAcumulada = 0;

            while ($fechaActualCalculo->lte($fechaActual)) {
                $depreciacionAcumulada += $depreciacionMensual;

                // No depreciar más allá del valor depreciable
                if ($depreciacionAcumulada > $valorDepreciable) {
                    $depreciacionAcumulada = $valorDepreciable;
                    $depreciacionMensual = 0; // Ya no hay más depreciación
                }

                $valorEnLibros = $asset->valor_compra - $depreciacionAcumulada;

                // Usar formato YYYYMM como número entero para el período
                $periodoNumero = intval($fechaActualCalculo->format('Ym'));

                AssetDepreciation::updateOrCreate(
                    [
                        'asset_id' => $asset->id,
                        'periodo' => $periodoNumero,
                    ],
                    [
                        'ano' => $fechaActualCalculo->year,
                        'mes' => $fechaActualCalculo->month,
                        'depreciacion_valor' => $depreciacionMensual,
                        'depreciacion_acumulada' => $depreciacionAcumulada,
                        'valor_en_libros' => max($valorEnLibros, $valorResidual),
                    ]
                );

                $fechaActualCalculo->addMonth();
            }
        }

        $this->command->info('AssetDepreciationSeeder: Calculadas depreciaciones para ' . $assets->count() . ' activos.');
    }
}
