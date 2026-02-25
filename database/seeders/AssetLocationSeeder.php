<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\AssetLocation;
use Illuminate\Database\Seeder;

class AssetLocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            ['nombre' => 'Oficina Principal', 'codigo' => 'OFC-001', 'piso' => 1, 'descripcion' => 'Oficina principal - Piso 1'],
            ['nombre' => 'Oficina Principal - Piso 2', 'codigo' => 'OFC-002', 'piso' => 2, 'descripcion' => 'Oficina principal - Piso 2'],
            ['nombre' => 'Almacén', 'codigo' => 'ALM-001', 'piso' => 0, 'descripcion' => 'Almacén central de inventario'],
            ['nombre' => 'Planta de Producción', 'codigo' => 'PLAN-001', 'piso' => 0, 'descripcion' => 'Planta de producción'],
            ['nombre' => 'Sala de Servidores', 'codigo' => 'SER-001', 'piso' => 1, 'descripcion' => 'Centro de datos y servidores'],
            ['nombre' => 'Parqueadero', 'codigo' => 'PAR-001', 'piso' => -1, 'descripcion' => 'Parqueadero subterráneo'],
            ['nombre' => 'Taller de Mantenimiento', 'codigo' => 'TAL-001', 'piso' => 0, 'descripcion' => 'Taller de reparación y mantenimiento'],
            ['nombre' => 'Oficina Sucursal', 'codigo' => 'OFC-SUC', 'piso' => 1, 'descripcion' => 'Sucursal - Oficina'],
        ];

        foreach ($locations as $location) {
            AssetLocation::create($location);
        }
    }
}
