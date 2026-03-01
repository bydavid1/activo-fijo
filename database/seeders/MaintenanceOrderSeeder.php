<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Maintenance\Models\MaintenanceOrder;
use App\Modules\Employees\Models\Employee;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class MaintenanceOrderSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = Faker::create('es_ES');

        $assets = Asset::all();
        $employees = Employee::all();
        $users = User::all();

        if ($assets->isEmpty() || $employees->isEmpty() || $users->isEmpty()) {
            return;
        }

        $tiposMantenimiento = ['preventivo', 'correctivo'];
        $estados = ['programado', 'en_ejecucion', 'completado', 'cancelado', 'pendiente'];

        $descripciones = [
            'preventivo' => [
                'Revisión general de funcionamiento',
                'Limpieza y lubricación de componentes',
                'Verificación de sistemas de seguridad',
                'Calibración de equipos',
                'Actualización de software/firmware',
                'Revisión de conexiones eléctricas',
                'Inspección de desgaste de piezas'
            ],
            'correctivo' => [
                'Reparación de falla en sistema',
                'Reemplazo de componente dañado',
                'Corrección de error de funcionamiento',
                'Reparación de pantalla/display',
                'Arreglo de problema de conectividad',
                'Solución de problema de rendimiento',
                'Reparación de daño físico'
            ],
            'predictivo' => [
                'Análisis de vibraciones',
                'Termografía infrarroja',
                'Análisis de aceites',
                'Monitoreo de condición',
                'Inspección ultrasónica',
                'Análisis de tendencias',
                'Evaluación de vida útil restante'
            ]
        ];

        // Crear 80 órdenes de mantenimiento
        for ($i = 0; $i < 80; $i++) {
            $asset = $assets->random();
            $tipo = $faker->randomElement($tiposMantenimiento);
            $estado = $faker->randomElement($estados);

            // Generar número único basado en timestamp + i
            $numero = 'MTO-' . date('His') . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);

            $fechaCreacion = $faker->dateTimeBetween('-1 year', 'now');
            $fechaProgramada = $faker->dateTimeBetween('-6 months', '+3 months');

            $costoEstimado = $faker->numberBetween(50000, 2000000);
            $costoReal = null;
            $fechaCompletado = null;

            // Si está completado, debe haberse completado en el pasado
            if ($estado === 'completado') {
                $fechaCompletado = $faker->dateTimeBetween('-6 months', 'now');
                $costoReal = intval($costoEstimado * $faker->randomFloat(2, 0.7, 1.5));
            }

            $descripcion = $faker->randomElement($descripciones[$tipo]);

            MaintenanceOrder::create([
                'numero' => $numero,
                'asset_id' => $asset->id,
                'tipo' => $tipo,
                'estado' => $estado,
                'descripcion' => $descripcion,
                'fecha_programada' => $fechaProgramada,
                'fecha_completada' => $fechaCompletado,
                'costo_estimado' => $costoEstimado,
                'costo_real' => $costoReal,
                'asignado_a_id' => $users->random()->id,
                'usuario_id' => $users->random()->id,
                'created_at' => $fechaCreacion,
                'updated_at' => $fechaCompletado ?? $fechaCreacion,
            ]);
        }

        $this->command->info('MaintenanceOrderSeeder: Creadas 80 órdenes de mantenimiento.');
    }
}
