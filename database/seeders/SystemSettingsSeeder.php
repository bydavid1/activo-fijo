<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'metodo_calculo',
                'value' => 'depreciacion',
                'description' => 'Método de cálculo global: depreciacion o amortizacion',
                'group' => 'depreciacion',
            ],
            [
                'key' => 'valor_residual_porcentaje',
                'value' => 10,
                'description' => 'Porcentaje de valor residual por defecto aplicado al valor de compra',
                'group' => 'depreciacion',
            ],
            [
                'key' => 'periodicidad_default',
                'value' => 'mensual',
                'description' => 'Periodicidad de cálculo por defecto: diaria, mensual o anual',
                'group' => 'depreciacion',
            ],
            [
                'key' => 'aplicar_regla_dia_15',
                'value' => true,
                'description' => 'Aplicar regla del día 15 por defecto al crear activos',
                'group' => 'depreciacion',
            ],
            [
                'key' => 'tasas_por_tipo',
                'value' => [
                    'COMP' => ['tasa' => 20, 'descripcion' => 'Equipos de Cómputo'],
                    'VEH'  => ['tasa' => 10, 'descripcion' => 'Vehículos'],
                    'MYE'  => ['tasa' => 10, 'descripcion' => 'Muebles y Enseres'],
                    'MAQ'  => ['tasa' => 6.67, 'descripcion' => 'Maquinaria y Equipo'],
                    'INM'  => ['tasa' => 0, 'descripcion' => 'Bienes Inmuebles (no deprecian)'],
                ],
                'description' => 'Tasas de depreciación/amortización anuales (%) por tipo de bien',
                'group' => 'depreciacion',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
