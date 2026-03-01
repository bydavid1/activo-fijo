<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetMovement;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Employees\Models\Employee;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class AssetMovementSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = Faker::create('es_ES');

        $assets = Asset::all();
        $locations = AssetLocation::all();
        $employees = Employee::all();
        $users = User::all();

        if ($assets->isEmpty() || $locations->isEmpty() || $employees->isEmpty() || $users->isEmpty()) {
            return;
        }

        $movementTypes = ['traslado', 'reubicacion', 'mantenimiento', 'prestamo', 'devolucion', 'venta', 'baja'];
        $motivos = [
            'Cambio de ubicación por reorganización',
            'Asignación a nuevo empleado',
            'Envío a mantenimiento preventivo',
            'Activo dañado irreparable',
            'Venta por obsolescencia',
            'Traslado por cambio de oficina',
            'Reasignación departamental',
            'Mantenimiento correctivo',
            'Fin de vida útil',
            'Actualización tecnológica'
        ];

        // Crear 150 movimientos distribuidos en el tiempo
        for ($i = 0; $i < 150; $i++) {
            $asset = $assets->random();
            $tipo = $faker->randomElement($movementTypes);

            $fechaMovimiento = $faker->dateTimeBetween('-2 years', 'now');

            $locationAnterior = $locations->random();
            $locationNueva = $locations->random(); // Siempre asignar una ubicación
            $responsableAnterior = $employees->random();
            $responsableNuevo = $employees->random(); // Siempre asignar un responsable

            $data = [
                'asset_id' => $asset->id,
                'tipo' => $tipo,
                'ubicacion_anterior_id' => $locationAnterior->id,
                'ubicacion_nueva_id' => $locationNueva->id,
                'responsable_anterior_id' => $responsableAnterior->id,
                'responsable_nuevo_id' => $responsableNuevo->id,
                'motivo' => $faker->randomElement($motivos),
                'usuario_id' => $users->random()->id,
                'created_at' => $fechaMovimiento,
                'updated_at' => $fechaMovimiento,
            ];

            // Campos específicos por tipo de movimiento
            switch ($tipo) {
                case 'venta':
                    $data['precio_venta'] = $faker->numberBetween(50000, 5000000);
                    $data['comprador_nombre'] = $faker->company();
                    $data['comprador_documento'] = $faker->numerify('##########');
                    $data['tipo_venta'] = $faker->randomElement(['directa', 'subasta', 'licitacion']);
                    $data['tipo_pago'] = $faker->randomElement(['efectivo', 'transferencia', 'cheque']);
                    $data['condicion_pago'] = 'contado';
                    break;
            }

            AssetMovement::create($data);
        }

        $this->command->info('AssetMovementSeeder: Creados 150 movimientos de activos.');
    }
}
