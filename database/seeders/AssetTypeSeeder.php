<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\AssetType;
use Illuminate\Database\Seeder;

class AssetTypeSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Bienes Inmuebles (no depreciable) ───
        $inmuebles = AssetType::create([
            'nombre'           => 'Bienes Inmuebles',
            'codigo'           => 'INM',
            'descripcion'      => 'Terrenos, edificios y construcciones. No sujetos a depreciación.',
            'es_depreciable'   => false,
            'vida_util_default'=> null,
            'cuenta_contable'  => '1504',
        ]);

        $inmuebles->properties()->createMany([
            ['nombre' => 'direccion',        'etiqueta' => 'Dirección',          'tipo_dato' => 'texto',    'requerido' => true,  'orden' => 1],
            ['nombre' => 'area_m2',          'etiqueta' => 'Área (m²)',          'tipo_dato' => 'decimal',  'requerido' => false, 'orden' => 2],
            ['nombre' => 'numero_escritura', 'etiqueta' => 'Número de Escritura','tipo_dato' => 'texto',    'requerido' => false, 'orden' => 3],
            ['nombre' => 'fecha_escritura',  'etiqueta' => 'Fecha de Escritura', 'tipo_dato' => 'fecha',    'requerido' => false, 'orden' => 4],
            ['nombre' => 'avaluo_catastral', 'etiqueta' => 'Avalúo Catastral',   'tipo_dato' => 'decimal',  'requerido' => false, 'orden' => 5],
            ['nombre' => 'estrato',          'etiqueta' => 'Estrato',            'tipo_dato' => 'numero',   'requerido' => false, 'orden' => 6],
        ]);

        // ─── Equipos de Cómputo (depreciable, 5 años) ───
        $computo = AssetType::create([
            'nombre'           => 'Equipos de Cómputo',
            'codigo'           => 'COMP',
            'descripcion'      => 'Computadores, servidores, portátiles y periféricos.',
            'es_depreciable'   => true,
            'vida_util_default'=> 5,
            'cuenta_contable'  => '1528',
        ]);

        $computo->properties()->createMany([
            ['nombre' => 'procesador',      'etiqueta' => 'Procesador',      'tipo_dato' => 'texto',   'requerido' => false, 'orden' => 1],
            ['nombre' => 'memoria_ram',     'etiqueta' => 'Memoria RAM',     'tipo_dato' => 'texto',   'requerido' => false, 'orden' => 2],
            ['nombre' => 'almacenamiento',  'etiqueta' => 'Almacenamiento',  'tipo_dato' => 'texto',   'requerido' => false, 'orden' => 3],
            ['nombre' => 'sistema_operativo','etiqueta'=> 'Sistema Operativo','tipo_dato' => 'texto',   'requerido' => false, 'orden' => 4],
            ['nombre' => 'direccion_mac',   'etiqueta' => 'Dirección MAC',   'tipo_dato' => 'texto',   'requerido' => false, 'orden' => 5],
            ['nombre' => 'direccion_ip',    'etiqueta' => 'Dirección IP',    'tipo_dato' => 'texto',   'requerido' => false, 'orden' => 6],
        ]);

        // ─── Vehículos (depreciable, 10 años) ───
        $vehiculos = AssetType::create([
            'nombre'           => 'Vehículos',
            'codigo'           => 'VEH',
            'descripcion'      => 'Automóviles, camionetas, motos y vehículos de transporte.',
            'es_depreciable'   => true,
            'vida_util_default'=> 10,
            'cuenta_contable'  => '1540',
        ]);

        $vehiculos->properties()->createMany([
            ['nombre' => 'placa',             'etiqueta' => 'Placa',              'tipo_dato' => 'texto',     'requerido' => true,  'orden' => 1],
            ['nombre' => 'cilindraje',        'etiqueta' => 'Cilindraje (cc)',    'tipo_dato' => 'numero',    'requerido' => false, 'orden' => 2],
            ['nombre' => 'color',             'etiqueta' => 'Color',             'tipo_dato' => 'texto',     'requerido' => false, 'orden' => 3],
            ['nombre' => 'numero_motor',      'etiqueta' => 'Número de Motor',   'tipo_dato' => 'texto',     'requerido' => false, 'orden' => 4],
            ['nombre' => 'numero_chasis',     'etiqueta' => 'Número de Chasis',  'tipo_dato' => 'texto',     'requerido' => false, 'orden' => 5],
            ['nombre' => 'tipo_combustible',  'etiqueta' => 'Tipo de Combustible','tipo_dato' => 'seleccion', 'requerido' => false, 'orden' => 6,
             'opciones' => ['Gasolina', 'Diesel', 'Eléctrico', 'Híbrido', 'Gas Natural']],
            ['nombre' => 'soat_vigente',      'etiqueta' => 'SOAT Vigente',      'tipo_dato' => 'booleano',  'requerido' => false, 'orden' => 7],
            ['nombre' => 'fecha_vence_soat',  'etiqueta' => 'Vence SOAT',        'tipo_dato' => 'fecha',     'requerido' => false, 'orden' => 8],
        ]);

        // ─── Muebles y Enseres (depreciable, 10 años) ───
        $muebles = AssetType::create([
            'nombre'           => 'Muebles y Enseres',
            'codigo'           => 'MYE',
            'descripcion'      => 'Escritorios, sillas, archivadores y mobiliario de oficina.',
            'es_depreciable'   => true,
            'vida_util_default'=> 10,
            'cuenta_contable'  => '1524',
        ]);

        $muebles->properties()->createMany([
            ['nombre' => 'material',   'etiqueta' => 'Material',   'tipo_dato' => 'texto',     'requerido' => false, 'orden' => 1],
            ['nombre' => 'color',      'etiqueta' => 'Color',      'tipo_dato' => 'texto',     'requerido' => false, 'orden' => 2],
            ['nombre' => 'dimensiones','etiqueta' => 'Dimensiones','tipo_dato' => 'texto',     'requerido' => false, 'orden' => 3],
        ]);

        // ─── Maquinaria y Equipo (depreciable, 15 años) ───
        $maquinaria = AssetType::create([
            'nombre'           => 'Maquinaria y Equipo',
            'codigo'           => 'MAQ',
            'descripcion'      => 'Maquinaria industrial, equipos de producción y herramientas pesadas.',
            'es_depreciable'   => true,
            'vida_util_default'=> 15,
            'cuenta_contable'  => '1520',
        ]);

        $maquinaria->properties()->createMany([
            ['nombre' => 'capacidad',     'etiqueta' => 'Capacidad',      'tipo_dato' => 'texto',   'requerido' => false, 'orden' => 1],
            ['nombre' => 'voltaje',       'etiqueta' => 'Voltaje (V)',    'tipo_dato' => 'numero',  'requerido' => false, 'orden' => 2],
            ['nombre' => 'peso_kg',       'etiqueta' => 'Peso (Kg)',      'tipo_dato' => 'decimal', 'requerido' => false, 'orden' => 3],
            ['nombre' => 'requiere_calibracion', 'etiqueta' => 'Requiere Calibración', 'tipo_dato' => 'booleano', 'requerido' => false, 'orden' => 4],
        ]);
    }
}
