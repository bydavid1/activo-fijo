<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\AssetCategory;
use Illuminate\Database\Seeder;

class AssetCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nombre' => 'Computadoras', 'codigo' => 'COMP', 'descripcion' => 'Equipos de cómputo: laptops, desktops, etc.'],
            ['nombre' => 'Equipos de Oficina', 'codigo' => 'OFIC', 'descripcion' => 'Muebles y equipos de oficina'],
            ['nombre' => 'Vehículos', 'codigo' => 'VEH', 'descripcion' => 'Vehículos corporativos'],
            ['nombre' => 'Maquinaria', 'codigo' => 'MAQ', 'descripcion' => 'Maquinaria de producción'],
            ['nombre' => 'Equipos de Comunicación', 'codigo' => 'COM', 'descripcion' => 'Teléfonos, radios, etc.'],
            ['nombre' => 'Herramientas', 'codigo' => 'HERB', 'descripcion' => 'Herramientas manuales y eléctricas'],
            ['nombre' => 'Electrónica', 'codigo' => 'ELEC', 'descripcion' => 'Equipos electrónicos diversos'],
            ['nombre' => 'Infraestructura', 'codigo' => 'INFRA', 'descripcion' => 'Infraestructura e instalaciones'],
        ];

        foreach ($categories as $category) {
            AssetCategory::create($category);
        }
    }
}
