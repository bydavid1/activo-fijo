<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Employees\Models\Employee;
use App\Modules\Suppliers\Models\Supplier;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        // Obtener un empleado responsable (custodio)
        $empleado = Employee::first();

        $assets = [
            [
                'codigo' => 'COMP-001',
                'nombre' => 'Laptop Dell Inspiron',
                'descripcion' => 'Laptop para desarrollo',
                'marca' => 'Dell',
                'modelo' => 'Inspiron 15',
                'serie' => 'DL5G7H8K9',
                'categoria_id' => AssetCategory::where('codigo', 'COMP')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'OFC-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'TECH-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 3500000,
                'valor_residual' => 350000,
                'vida_util_anos' => 5,
                'fecha_adquisicion' => '2023-01-15',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'COMP-002',
                'nombre' => 'Desktop HP Pavilion',
                'descripcion' => 'Computadora de escritorio',
                'marca' => 'HP',
                'modelo' => 'Pavilion 500',
                'serie' => 'HP2M3N4O5',
                'categoria_id' => AssetCategory::where('codigo', 'COMP')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'OFC-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'TECH-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 2800000,
                'valor_residual' => 280000,
                'vida_util_anos' => 4,
                'fecha_adquisicion' => '2022-06-20',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'VEH-001',
                'nombre' => 'Toyota Corolla 2021',
                'descripcion' => 'Vehículo para visitas comerciales',
                'marca' => 'Toyota',
                'modelo' => 'Corolla',
                'serie' => 'JTNF0GEX0M5027456',
                'categoria_id' => AssetCategory::where('codigo', 'VEH')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'PAR-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'TECH-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 85000000,
                'valor_residual' => 25500000,
                'vida_util_anos' => 10,
                'fecha_adquisicion' => '2021-03-10',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'OFIC-001',
                'nombre' => 'Escritorio Gerencia',
                'descripcion' => 'Escritorio ejecutivo de madera',
                'marca' => 'Steelcase',
                'modelo' => 'Premium',
                'serie' => 'DESC-2023-001',
                'categoria_id' => AssetCategory::where('codigo', 'OFIC')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'OFC-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'MOB-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 2500000,
                'valor_residual' => 500000,
                'vida_util_anos' => 10,
                'fecha_adquisicion' => '2023-02-14',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'HERB-001',
                'nombre' => 'Taladro Profesional',
                'descripcion' => 'Taladro eléctrico para mantenimiento',
                'marca' => 'Makita',
                'modelo' => 'HP2050',
                'serie' => 'TAL-5500-2023',
                'categoria_id' => AssetCategory::where('codigo', 'HERB')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'TAL-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'HERB-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 450000,
                'valor_residual' => 45000,
                'vida_util_anos' => 5,
                'fecha_adquisicion' => '2023-05-20',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'ELEC-001',
                'nombre' => 'Impresora Multifunción',
                'descripcion' => 'Impresora a color para oficina',
                'marca' => 'HP',
                'modelo' => 'LaserJet Pro',
                'serie' => 'IMP-HP-2023',
                'categoria_id' => AssetCategory::where('codigo', 'ELEC')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'OFC-002')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'TECH-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 1800000,
                'valor_residual' => 180000,
                'vida_util_anos' => 5,
                'fecha_adquisicion' => '2023-03-15',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'SER-001',
                'nombre' => 'Servidor Dell PowerEdge',
                'descripcion' => 'Servidor de datos principal',
                'marca' => 'Dell',
                'modelo' => 'PowerEdge R750',
                'serie' => 'SRV-DELL-001',
                'categoria_id' => AssetCategory::where('codigo', 'ELEC')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'SER-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'TECH-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 25000000,
                'valor_residual' => 2500000,
                'vida_util_anos' => 5,
                'fecha_adquisicion' => '2022-08-01',
                'estado' => 'activo',
            ],
            [
                'codigo' => 'OFIC-002',
                'nombre' => 'Silla Ejecutiva',
                'descripcion' => 'Silla ergonómica con apoyo lumbar',
                'marca' => 'Aeron',
                'modelo' => 'Ergonomic',
                'serie' => 'SIL-ERG-2023',
                'categoria_id' => AssetCategory::where('codigo', 'OFIC')->first()->id,
                'ubicacion_id' => AssetLocation::where('codigo', 'OFC-001')->first()->id,
                'proveedor_id' => Supplier::where('codigo', 'MOB-001')->first()->id,
                'responsable_id' => $empleado->id,
                'valor_compra' => 800000,
                'valor_residual' => 80000,
                'vida_util_anos' => 10,
                'fecha_adquisicion' => '2023-04-10',
                'estado' => 'activo',
            ],
        ];

        foreach ($assets as $asset) {
            Asset::create($asset);
        }
    }
}
