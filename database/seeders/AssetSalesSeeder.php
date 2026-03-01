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

class AssetSalesSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = Faker::create('es_ES');

        $assets = Asset::where('estado', 'activo')->get();
        $locations = AssetLocation::all();
        $employees = Employee::all();
        $users = User::all();

        if ($assets->isEmpty() || $locations->isEmpty() || $employees->isEmpty() || $users->isEmpty()) {
            return;
        }

        $tiposVenta = ['directa', 'subasta', 'licitacion'];
        $tiposPago = ['efectivo', 'transferencia', 'cheque', 'tarjeta'];
        $condicionesPago = ['contado', 'credito_30', 'credito_60'];

        $empresasCompradoras = [
            'Comercializadora Tecnológica LTDA',
            'Inversiones y Suministros SAS',
            'Grupo Empresarial del Pacífico',
            'Compañía de Equipos Industriales',
            'Soluciones Integrales Colombia',
            'Distribuidora Nacional de Activos',
            'Corporación de Bienes Raíces',
            'Empresa de Servicios Múltiples',
            'Consorcio de Inversionistas Unidos',
            'Fundación Benéfica San José'
        ];

        // Crear 25 ventas adicionales con datos completos
        for ($i = 0; $i < 25; $i++) {
            $asset = $assets->random();
            $fechaVenta = $faker->dateTimeBetween('-2 years', '-1 week');

            // Calcular precio de venta basado en depreciación y condiciones del mercado
            $precioVenta = $this->calculateSalePrice($asset, $fechaVenta, $faker);

            $tipoVenta = $faker->randomElement($tiposVenta);
            $esEmpresa = $faker->boolean(60); // 60% son empresas

            if ($esEmpresa) {
                $compradorNombre = $faker->randomElement($empresasCompradoras);
                $compradorDocumento = $faker->numerify('9########-#'); // NIT
                $compradorTelefono = $faker->numerify('60#-###-####');
            } else {
                $compradorNombre = $faker->name();
                $compradorDocumento = $faker->numerify('########'); // Cédula
                $compradorTelefono = $faker->numerify('30#-###-####');
            }

            AssetMovement::create([
                'asset_id' => $asset->id,
                'tipo' => 'venta',
                'ubicacion_anterior_id' => $asset->ubicacion_id,
                'ubicacion_nueva_id' => $locations->random()->id, // Ubicación donde se entrega
                'responsable_anterior_id' => $asset->responsable_id,
                'responsable_nuevo_id' => $employees->random()->id, // Quien entrega
                'motivo' => $this->generateSaleReason($tipoVenta, $faker),
                'usuario_id' => $users->random()->id,

                // Campos específicos de venta
                'tipo_venta' => $tipoVenta,
                'tipo_pago' => $faker->randomElement($tiposPago),
                'condicion_pago' => $faker->randomElement($condicionesPago),
                'precio_venta' => $precioVenta,
                'comprador_nombre' => $compradorNombre,
                'comprador_documento' => $compradorDocumento,
                'comprador_telefono' => $compradorTelefono,
                'documento_venta' => $this->generateSaleDocument($asset, $fechaVenta, $tipoVenta),

                'created_at' => $fechaVenta,
                'updated_at' => $fechaVenta,
            ]);

            // Actualizar el estado del activo a vendido
            $asset->update(['estado' => 'vendido']);
        }

        $this->command->info('AssetSalesSeeder: Creadas 25 ventas adicionales de activos.');
    }

    private function calculateSalePrice($asset, $fechaVenta, $faker)
    {
        // Calcular valor en libros aproximado a la fecha de venta
        $fechaAdquisicion = \Carbon\Carbon::parse($asset->fecha_adquisicion);
        $mesesTranscurridos = $fechaAdquisicion->diffInMonths($fechaVenta);
        $vidaUtilMeses = $asset->vida_util_anos * 12;

        $valorDepreciable = $asset->valor_compra - $asset->valor_residual;
        $depreciacionAcumulada = min(($valorDepreciable / $vidaUtilMeses) * $mesesTranscurridos, $valorDepreciable);
        $valorEnLibros = $asset->valor_compra - $depreciacionAcumulada;

        // Aplicar factores de mercado
        switch ($asset->categoria->codigo ?? 'OTROS') {
            case 'COMP': // Equipos de cómputo se deprecian más rápido
                $factorMercado = $faker->randomFloat(2, 0.3, 0.7);
                break;
            case 'VEH': // Vehículos mantienen mejor valor
                $factorMercado = $faker->randomFloat(2, 0.6, 0.9);
                break;
            case 'OFIC': // Muebles de oficina valor medio
                $factorMercado = $faker->randomFloat(2, 0.4, 0.8);
                break;
            default:
                $factorMercado = $faker->randomFloat(2, 0.5, 0.8);
        }

        return max(intval($valorEnLibros * $factorMercado), 50000); // Mínimo $50,000
    }

    private function generateSaleReason($tipoVenta, $faker)
    {
        $motivos = [
            'directa' => [
                'Venta directa por renovación tecnológica',
                'Liquidación de activo por cambio de sede',
                'Venta autorizada por obsolescencia',
                'Disposición de activo subutilizado',
            ],
            'subasta' => [
                'Venta en subasta pública autorizada',
                'Liquidación por subasta de activos excedentes',
                'Disposición en subasta por renovación de inventario',
                'Venta en martillo público según normativa',
            ],
            'licitacion' => [
                'Venta por licitación pública',
                'Disposición mediante proceso licitatorio',
                'Adjudicación en licitación de activos',
                'Venta por licitación cerrada autorizada',
            ]
        ];

        return $faker->randomElement($motivos[$tipoVenta] ?? $motivos['directa']);
    }

    private function generateSaleDocument($asset, $fechaVenta, $tipoVenta)
    {
        $prefijos = [
            'directa' => 'VENTA-DIR',
            'subasta' => 'SUBASTA',
            'licitacion' => 'LIC-PUB'
        ];

        $prefijo = $prefijos[$tipoVenta] ?? 'VENTA';
        return $prefijo . '-' . $asset->codigo . '-' . $fechaVenta->format('Y') . '.pdf';
    }
}
