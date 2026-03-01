<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\AssetLocation;
use App\Modules\Employees\Models\Employee;
use App\Modules\Suppliers\Models\Supplier;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class EnhancedAssetSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('es_ES');

        // Obtener empleados, categorías, ubicaciones y proveedores
        $employees = Employee::all();
        $categories = AssetCategory::all();
        $locations = AssetLocation::all();
        $suppliers = Supplier::all();

        if ($employees->isEmpty() || $categories->isEmpty() || $locations->isEmpty() || $suppliers->isEmpty()) {
            throw new \Exception('Se requieren empleados, categorías, ubicaciones y proveedores existentes');
        }

        // Array de marcas por categoría para mayor realismo
        $brandsPerCategory = [
            'COMP' => ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple', 'Microsoft'],
            'VEH' => ['Toyota', 'Chevrolet', 'Ford', 'Volkswagen', 'Hyundai', 'Nissan', 'Mazda'],
            'OFIC' => ['Steelcase', 'Herman Miller', 'IKEA', 'Humanscale', 'Teknion', 'Haworth'],
            'HERB' => ['Makita', 'DeWalt', 'Bosch', 'Black & Decker', 'Milwaukee', 'Ryobi'],
            'ELEC' => ['HP', 'Canon', 'Epson', 'Brother', 'Samsung', 'LG', 'Sony'],
        ];

        $estados = ['activo', 'inactivo', 'mantenimiento', 'descartado', 'retirado'];
        $contador_por_categoria = [];

        // Generar 100 activos adicionales
        for ($i = 1; $i <= 100; $i++) {
            $category = $categories->random();
            $categoryCode = $category->codigo;

            // Contador por categoría para códigos únicos
            if (!isset($contador_por_categoria[$categoryCode])) {
                $contador_por_categoria[$categoryCode] = 10; // Empezar desde 10 para evitar conflictos
            } else {
                $contador_por_categoria[$categoryCode]++;
            }

            $codigo = $categoryCode . '-' . str_pad($contador_por_categoria[$categoryCode], 3, '0', STR_PAD_LEFT);

            $brands = $brandsPerCategory[$categoryCode] ?? ['Genérico'];
            $brand = $faker->randomElement($brands);

            // Generar datos específicos por categoría
            $nombre = $this->generateAssetName($categoryCode, $brand, $faker);
            $descripcion = $this->generateDescription($categoryCode, $faker);

            // Generar valores monetarios realistas por categoría
            $valorCompra = $this->generateRealisticValue($categoryCode, $faker);
            $valorResidual = intval($valorCompra * $faker->numberBetween(5, 15) / 100);
            $vidaUtil = $this->getLifeSpanByCategory($categoryCode);

            // Fechas de adquisición entre 2020 y 2024
            $fechaAdquisicion = $faker->dateTimeBetween('-4 years', 'now');

            // Estado más probable de ser activo (70%)
            $estado = $faker->randomElement(array_merge(
                array_fill(0, 7, 'activo'),
                array_fill(0, 2, 'mantenimiento'),
                ['inactivo']
            ));

            Asset::create([
                'codigo' => $codigo,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'marca' => $brand,
                'modelo' => $this->generateModel($brand, $faker),
                'serie' => strtoupper($faker->bothify('???##?##?#')),
                'categoria_id' => $category->id,
                'ubicacion_id' => $locations->random()->id,
                'proveedor_id' => $suppliers->random()->id,
                'responsable_id' => $employees->random()->id,
                'valor_compra' => $valorCompra,
                'valor_residual' => $valorResidual,
                'vida_util_anos' => $vidaUtil,
                'fecha_adquisicion' => $fechaAdquisicion->format('Y-m-d'),
                'estado' => $estado,
            ]);
        }
    }

    private function generateAssetName($categoryCode, $brand, $faker)
    {
        switch ($categoryCode) {
            case 'COMP':
                $types = ['Laptop', 'Desktop', 'Workstation', 'All-in-One', 'Mini PC'];
                $models = ['Pro', 'Business', 'Elite', 'Inspiron', 'ThinkPad', 'Pavilion'];
                return $faker->randomElement($types) . ' ' . $brand . ' ' . $faker->randomElement($models);

            case 'VEH':
                $types = ['Sedan', 'SUV', 'Hatchback', 'Pickup', 'Van'];
                $years = range(2018, 2024);
                return $brand . ' ' . $faker->randomElement($types) . ' ' . $faker->randomElement($years);

            case 'OFIC':
                $items = ['Escritorio', 'Silla', 'Mesa', 'Archivador', 'Estantería', 'Sillón'];
                $types = ['Ejecutivo', 'Ergonómico', 'Modular', 'Tradicional'];
                return $faker->randomElement($items) . ' ' . $faker->randomElement($types);

            case 'HERB':
                $tools = ['Taladro', 'Sierra', 'Lijadora', 'Martillo', 'Destornillador', 'Soldadora'];
                $types = ['Eléctrico', 'Inalámbrico', 'Profesional', 'Industrial'];
                return $faker->randomElement($tools) . ' ' . $faker->randomElement($types);

            case 'ELEC':
                $devices = ['Impresora', 'Scanner', 'Monitor', 'Proyector', 'Televisor', 'Tablet'];
                $types = ['Multifunción', 'Láser', 'LED', 'Smart', 'Profesional'];
                return $faker->randomElement($devices) . ' ' . $faker->randomElement($types);

            default:
                return 'Activo ' . $brand . ' ' . $faker->word();
        }
    }

    private function generateDescription($categoryCode, $faker)
    {
        $descriptions = [
            'COMP' => [
                'Equipo de cómputo para actividades administrativas',
                'Computadora para desarrollo de software',
                'Equipo de oficina para gestión documental',
                'Workstation para diseño gráfico',
                'Equipo para procesamiento de datos'
            ],
            'VEH' => [
                'Vehículo para transporte de personal',
                'Automóvil para visitas comerciales',
                'Vehículo de servicio y mantenimiento',
                'Transporte para actividades operativas',
                'Vehículo asignado a gerencia'
            ],
            'OFIC' => [
                'Mobiliario para área administrativa',
                'Mueble ergonómico de oficina',
                'Mobiliario ejecutivo',
                'Elemento de almacenamiento documental',
                'Mobiliario para sala de reuniones'
            ],
            'HERB' => [
                'Herramienta para mantenimiento general',
                'Equipo para reparaciones menores',
                'Herramienta eléctrica profesional',
                'Instrumento para trabajos técnicos',
                'Equipo especializado de taller'
            ],
            'ELEC' => [
                'Equipo electrónico de oficina',
                'Dispositivo para impresión y digitalización',
                'Equipo de comunicaciones',
                'Dispositivo de visualización',
                'Equipo de procesamiento electrónico'
            ]
        ];

        $categoryDescriptions = $descriptions[$categoryCode] ?? [
            'Activo para uso general',
            'Equipo de trabajo',
            'Elemento operativo'
        ];

        return $faker->randomElement($categoryDescriptions);
    }

    private function generateModel($brand, $faker)
    {
        $prefixes = ['Pro', 'Elite', 'Business', 'Premium', 'Standard', 'Advanced'];
        $suffixes = ['X', 'Plus', 'Max', 'Ultra', 'Lite'];
        $numbers = range(1000, 9999);

        return $faker->randomElement($prefixes) . ' ' . $faker->randomElement($numbers) . $faker->randomElement(array_merge($suffixes, ['']));
    }

    private function generateRealisticValue($categoryCode, $faker)
    {
        switch ($categoryCode) {
            case 'COMP':
                return $faker->numberBetween(2000000, 8000000); // $2M - $8M
            case 'VEH':
                return $faker->numberBetween(30000000, 120000000); // $30M - $120M
            case 'OFIC':
                return $faker->numberBetween(300000, 5000000); // $300K - $5M
            case 'HERB':
                return $faker->numberBetween(100000, 2000000); // $100K - $2M
            case 'ELEC':
                return $faker->numberBetween(500000, 10000000); // $500K - $10M
            default:
                return $faker->numberBetween(200000, 3000000);
        }
    }

    private function getLifeSpanByCategory($categoryCode)
    {
        switch ($categoryCode) {
            case 'COMP':
                return rand(3, 5);
            case 'VEH':
                return rand(8, 15);
            case 'OFIC':
                return rand(8, 12);
            case 'HERB':
                return rand(5, 8);
            case 'ELEC':
                return rand(4, 7);
            default:
                return rand(5, 10);
        }
    }
}
