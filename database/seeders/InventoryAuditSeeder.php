<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Inventory\Models\InventoryAudit;
use App\Modules\Inventory\Models\InventoryAuditItem;
use App\Modules\Inventory\Models\InventoryDiscrepancy;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class InventoryAuditSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = Faker::create('es_ES');

        $assets = Asset::all();
        $locations = AssetLocation::all();
        $users = User::all();

        if ($assets->isEmpty() || $locations->isEmpty() || $users->isEmpty()) {
            return;
        }

        // Crear 15 auditorías de inventario
        for ($i = 0; $i < 15; $i++) {
            $fechaInicio = $faker->dateTimeBetween('-6 months', '-1 month');
            $fechaFin = $faker->optional(0.8)->dateTimeBetween($fechaInicio, 'now');
            $estado = $fechaFin ? 'completed' : $faker->randomElement(['in_progress', 'draft']);

            $auditoria = InventoryAudit::create([
                'codigo' => 'AUD-' . date('His') . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'nombre' => $faker->randomElement([
                    'Auditoría Anual de Activos Fijos',
                    'Inventario Departamental - Administración',
                    'Verificación de Equipos Tecnológicos',
                    'Auditoría de Ubicación - ' . $locations->random()->nombre,
                    'Inventario Físico Trimestral',
                    'Verificación Post-Traslado',
                    'Auditoría de Cumplimiento NIIF',
                    'Inventario de Equipos de Seguridad'
                ]),
                'descripcion' => $faker->paragraph(),
                'criterios' => [
                    'ubicacion_ids' => $locations->random(rand(1, 3))->pluck('id')->toArray(),
                    'categoria_ids' => [],
                    'valor_minimo' => $faker->optional()->numberBetween(100000, 1000000),
                ],
                'estado' => $estado,
                'fecha_inicio' => $fechaInicio,
                'fecha_finalizacion' => $fechaFin,
                'created_by' => $users->random()->id,
                'created_at' => $fechaInicio,
                'updated_at' => $fechaFin ?? $fechaInicio,
            ]);

            // Crear items de auditoría para algunos activos
            $maxAssets = min($assets->count(), 50);
            $minAssets = min(3, $maxAssets);
            $activosAuditados = $assets->random(rand($minAssets, $maxAssets));
            $totalEsperados = $activosAuditados->count();
            $totalEncontrados = 0;

            foreach ($activosAuditados as $asset) {
                $estadoItem = $faker->randomElement(['found', 'missing', 'discrepant']);
                if ($estadoItem === 'found') $totalEncontrados++;

                $item = InventoryAuditItem::create([
                    'inventory_audit_id' => $auditoria->id,
                    'asset_id' => $asset->id,
                    'estado' => $estadoItem,
                    'datos_esperados' => [
                        'ubicacion_id' => $asset->ubicacion_id,
                        'responsable_id' => $asset->responsable_id,
                    ],
                    'datos_encontrados' => $estadoItem === 'missing' ? null : [
                        'ubicacion_id' => $estadoItem === 'discrepant' ? $locations->random()->id : $asset->ubicacion_id,
                        'responsable_id' => $asset->responsable_id,
                    ],
                    'observaciones' => $faker->optional(0.6)->sentence(),
                    'fecha_escaneado' => $estado === 'completed' ?
                        $faker->dateTimeBetween($fechaInicio, $fechaFin) : null,
                    'codigo_escaneado' => $estadoItem !== 'missing' ? $asset->codigo : null,
                ]);

                // TODO: Crear findings usando inventory_audit_findings si se necesita
                /*
                if (in_array($estadoItem, ['missing', 'discrepant'])) {
                    InventoryDiscrepancy::create([
                        'cycle_id' => null, // No usamos cycles por ahora
                        'asset_id' => $asset->id,
                        'estado' => $faker->randomElement(['detectada', 'pendiente_aprobacion', 'resuelta']),
                        'tipo_discrepancia' => $estadoItem === 'missing' ? 'faltante' : 'ubicacion_incorrecta',
                        'descripcion' => $estadoItem === 'missing' ?
                            'Activo no encontrado en ubicación esperada' :
                            'Activo encontrado en ubicación diferente a la registrada',
                        'usuario_id' => $users->random()->id,
                        'created_at' => $fechaInicio,
                        'updated_at' => $fechaFin ?? $fechaInicio,
                    ]);
                }
                */
            }

            // Actualizar totales en la auditoría
            $auditoria->update([
                'total_activos_esperados' => $totalEsperados,
                'total_activos_encontrados' => $totalEncontrados,
            ]);
        }

        $this->command->info('InventoryAuditSeeder: Creadas 15 auditorías con items y discrepancias.');
    }
}
