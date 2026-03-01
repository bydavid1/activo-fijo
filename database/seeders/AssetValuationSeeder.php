<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetValuation;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class AssetValuationSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = Faker::create('es_ES');

        $assets = Asset::all();
        $users = User::all();

        if ($assets->isEmpty() || $users->isEmpty()) {
            return;
        }

        $metodosValuacion = ['contable', 'mercado', 'pericia'];
        $tiposRevaluo = ['revalorizacion', 'deterioro', 'ajuste_inflacion', 'tasacion'];
        $peritosNombres = [
            'María González Vásquez - Avaluadora Certificada',
            'Carlos Rodríguez López - Perito Judicial',
            'Ana Patricia Jiménez - Especialista en Activos Fijos',
            'Fernando Muñoz Silva - Avaluador Inmobiliario',
            'Claudia Torres Restrepo - Perito en Equipos Industriales',
            'Roberto Castillo Herrera - Especialista en Vehículos',
            'Sandra Vargas Medina - Avaluadora de Maquinaria',
            'Diego Morales Castro - Perito en Tecnología'
        ];

        // Crear 50 revalúos distribuidos en el tiempo
        for ($i = 0; $i < 50; $i++) {
            $asset = $assets->random();
            $fechaEfectiva = $faker->dateTimeBetween('-3 years', '-1 month');
            $metodo = $faker->randomElement($metodosValuacion);
            $tipoRevaluo = $faker->randomElement($tiposRevaluo);

            // Calcular valor anterior (valor en libros aproximado para esa fecha)
            $valorAnterior = $this->calculateBookValueAtDate($asset, $fechaEfectiva, $faker);

            // Calcular nuevo valor según el tipo de revalúo
            $valorNuevo = $this->calculateNewValue($valorAnterior, $tipoRevaluo, $faker);

            // Determinar si necesita perito (obligatorio para pericia y tasación)
            $peritoNombre = null;
            $documentoRespaldo = null;

            if ($metodo === 'pericia' || $tipoRevaluo === 'tasacion') {
                $peritoNombre = $faker->randomElement($peritosNombres);
                $documentoRespaldo = 'AVALUO-' . $asset->codigo . '-' . $fechaEfectiva->format('Y') . '.pdf';
            } elseif ($faker->boolean(30)) { // 30% de probabilidad de tener documento de respaldo
                $documentoRespaldo = 'DOC-REVALUO-' . $asset->codigo . '-' . $fechaEfectiva->format('Ymd') . '.pdf';
            }

            $notas = $this->generateNotes($tipoRevaluo, $valorAnterior, $valorNuevo, $faker);

            AssetValuation::create([
                'asset_id' => $asset->id,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $valorNuevo,
                'fecha_efectiva' => $fechaEfectiva,
                'metodo' => $metodo,
                'tipo_revaluo' => $tipoRevaluo,
                'perito_nombre' => $peritoNombre,
                'documento_respaldo' => $documentoRespaldo,
                'notas' => $notas,
                'usuario_id' => $users->random()->id,
                'created_at' => $fechaEfectiva,
                'updated_at' => $fechaEfectiva,
            ]);
        }

        $this->command->info('AssetValuationSeeder: Creados 50 revalúos de activos.');
    }

    private function calculateBookValueAtDate($asset, $fechaEfectiva, $faker)
    {
        $fechaAdquisicion = Carbon::parse($asset->fecha_adquisicion);

        // Si la fecha efectiva es anterior a la adquisición, usar valor de compra
        if ($fechaEfectiva < $fechaAdquisicion) {
            return $asset->valor_compra;
        }

        // Calcular depreciación acumulada hasta la fecha
        $mesesTranscurridos = $fechaAdquisicion->diffInMonths($fechaEfectiva);
        $vidaUtilMeses = $asset->vida_util_anos * 12;
        $valorDepreciable = $asset->valor_compra - $asset->valor_residual;

        if ($mesesTranscurridos >= $vidaUtilMeses) {
            // Ya está completamente depreciado
            return $asset->valor_residual;
        }

        $depreciacionMensual = $valorDepreciable / $vidaUtilMeses;
        $depreciacionAcumulada = $depreciacionMensual * $mesesTranscurridos;

        return max($asset->valor_compra - $depreciacionAcumulada, $asset->valor_residual);
    }

    private function calculateNewValue($valorAnterior, $tipoRevaluo, $faker)
    {
        switch ($tipoRevaluo) {
            case 'revalorizacion':
                // Aumento entre 10% y 50%
                return intval($valorAnterior * $faker->randomFloat(2, 1.1, 1.5));

            case 'deterioro':
                // Disminución entre 10% y 40%
                return intval($valorAnterior * $faker->randomFloat(2, 0.6, 0.9));

            case 'ajuste_inflacion':
                // Ajuste por inflación entre 3% y 8% anual
                return intval($valorAnterior * $faker->randomFloat(2, 1.03, 1.08));

            case 'tasacion':
                // Puede ser mayor o menor, pero dentro de rangos más amplios
                return intval($valorAnterior * $faker->randomFloat(2, 0.7, 1.8));

            default:
                return intval($valorAnterior * $faker->randomFloat(2, 0.8, 1.3));
        }
    }

    private function generateNotes($tipoRevaluo, $valorAnterior, $valorNuevo, $faker)
    {
        $diferencia = $valorNuevo - $valorAnterior;
        $porcentajeCambio = round(($diferencia / $valorAnterior) * 100, 2);

        $baseNotes = [
            'revalorizacion' => [
                'Revalorización por mejoras en el mercado inmobiliario/tecnológico',
                'Actualización de valor por condiciones favorables del mercado',
                'Incremento de valor debido a escasez en el mercado',
                'Revalorización por ubicación estratégica',
            ],
            'deterioro' => [
                'Deterioro por obsolescencia tecnológica',
                'Reducción de valor por desgaste acelerado',
                'Deterioro por cambios en condiciones de mercado',
                'Disminución por daños identificados en inspección',
            ],
            'ajuste_inflacion' => [
                'Ajuste por inflación según índices oficiales',
                'Actualización por variación del IPC acumulado',
                'Ajuste monetario por inflación del período',
                'Reexpresión por efectos inflacionarios',
            ],
            'tasacion' => [
                'Tasación realizada por perito calificado',
                'Avalúo comercial por perito independiente',
                'Valuación técnica especializada',
                'Peritaje para fines contables y fiscales',
            ]
        ];

        $baseNote = $faker->randomElement($baseNotes[$tipoRevaluo] ?? ['Revalúo técnico del activo']);

        $impactNote = $diferencia > 0 ?
            "Incremento del {$porcentajeCambio}% respecto al valor anterior." :
            "Disminución del " . abs($porcentajeCambio) . "% respecto al valor anterior.";

        return $baseNote . ' ' . $impactNote . ' ' . $faker->optional(0.7)->sentence();
    }
}
