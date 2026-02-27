<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tipos de bienes (ej: Inmuebles, Equipos de cómputo, Vehículos, etc.)
        Schema::create('asset_types', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');           // "Bienes Inmuebles", "Equipos de Cómputo"
            $table->string('codigo')->unique(); // "INM", "COMP", "VEH"
            $table->text('descripcion')->nullable();
            $table->boolean('es_depreciable')->default(true);
            $table->integer('vida_util_default')->nullable(); // Años por defecto para este tipo
            $table->string('cuenta_contable')->nullable();    // Código contable asociado
            $table->timestamps();
            $table->softDeletes();
        });

        // Propiedades personalizadas por tipo de bien
        Schema::create('asset_type_properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_type_id')->constrained('asset_types')->cascadeOnDelete();
            $table->string('nombre');          // Nombre técnico: "area_m2", "placa", "direccion"
            $table->string('etiqueta');        // Label para el UI: "Área (m²)", "Placa", "Dirección"
            $table->enum('tipo_dato', [
                'texto',      // Input text
                'numero',     // Input number
                'decimal',    // Input number con decimales
                'fecha',      // Calendar
                'booleano',   // Checkbox / switch
                'seleccion',  // Dropdown (opciones en JSON)
                'textarea',   // Textarea largo
            ])->default('texto');
            $table->json('opciones')->nullable();  // Para tipo "seleccion": ["Opción A", "Opción B"]
            $table->boolean('requerido')->default(false);
            $table->integer('orden')->default(0);  // Orden de aparición en el formulario
            $table->timestamps();

            // Un tipo no puede tener dos propiedades con el mismo nombre
            $table->unique(['asset_type_id', 'nombre']);
        });

        // Valores de propiedades personalizadas por activo
        Schema::create('asset_custom_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('asset_type_property_id')->constrained('asset_type_properties')->cascadeOnDelete();
            $table->text('valor')->nullable(); // Almacenado como texto, se castea según tipo_dato
            $table->timestamps();

            // Un activo solo tiene un valor por propiedad
            $table->unique(['asset_id', 'asset_type_property_id']);
        });

        // Agregar columna asset_type_id a la tabla assets
        Schema::table('assets', function (Blueprint $table) {
            $table->foreignId('asset_type_id')
                  ->nullable()
                  ->after('serie')
                  ->constrained('asset_types')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['asset_type_id']);
            $table->dropColumn('asset_type_id');
        });

        Schema::dropIfExists('asset_custom_values');
        Schema::dropIfExists('asset_type_properties');
        Schema::dropIfExists('asset_types');
    }
};
