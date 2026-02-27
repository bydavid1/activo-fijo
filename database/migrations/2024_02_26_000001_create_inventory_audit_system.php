<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabla principal de auditorías/levantamientos de inventario
        Schema::create('inventory_audits', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique(); // Código único del levantamiento (ej: LEV-2024-001)
            $table->string('nombre'); // Nombre descriptivo del levantamiento
            $table->text('descripcion')->nullable();

            // Criterios de filtro para el levantamiento
            $table->json('criterios')->nullable(); // {department_ids: [], location_ids: [], employee_ids: []}

            // Metadatos del levantamiento
            $table->enum('estado', ['draft', 'in_progress', 'completed', 'cancelled'])
                   ->default('draft');
            $table->integer('total_activos_esperados')->default(0); // Total de activos que deberían estar
            $table->integer('total_activos_encontrados')->default(0); // Total encontrados durante el escaneo

            // Auditoría
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('fecha_inicio')->nullable(); // Cuando se inició el escaneo
            $table->timestamp('fecha_finalizacion')->nullable(); // Cuando se completó
            $table->timestamps();

            $table->index(['estado', 'created_by']);
            $table->index('fecha_inicio');
        });

        // Tabla de ítems esperados en cada levantamiento
        Schema::create('inventory_audit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_audit_id')->constrained()->onDelete('cascade');
            $table->foreignId('asset_id')->constrained('assets');

            // Estado del ítem durante el levantamiento
            $table->enum('estado', ['pending', 'found', 'missing', 'discrepant'])
                   ->default('pending');

            // Datos esperados vs encontrados
            $table->json('datos_esperados')->nullable(); // {responsable_id, ubicacion_id, etc.}
            $table->json('datos_encontrados')->nullable(); // Lo que se encontró al escanear

            // Metadatos del escaneo
            $table->timestamp('fecha_escaneado')->nullable();
            $table->string('codigo_escaneado')->nullable(); // El código que se escaneó
            $table->text('observaciones')->nullable();

            $table->timestamps();

            $table->unique(['inventory_audit_id', 'asset_id']);
            $table->index(['inventory_audit_id', 'estado']);
        });

        // Tabla de hallazgos/discrepancias encontradas
        Schema::create('inventory_audit_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_audit_id')->constrained()->onDelete('cascade');

            $table->enum('tipo', [
                'asset_not_found',      // Activo esperado no encontrado
                'asset_extra',          // Activo escaneado no esperado
                'location_changed',     // Activo encontrado en ubicación diferente
                'responsible_changed',  // Activo con responsable diferente
                'condition_changed',    // Activo con estado diferente
                'other_discrepancy'     // Otra discrepancia
            ]);

            $table->foreignId('asset_id')->nullable()->constrained('assets'); // Null para extras
            $table->string('codigo_escaneado')->nullable(); // Para activos extras

            $table->json('valor_esperado')->nullable(); // Lo que debería ser
            $table->json('valor_encontrado')->nullable(); // Lo que se encontró

            $table->text('descripcion')->nullable();
            $table->enum('severidad', ['low', 'medium', 'high'])->default('medium');
            $table->boolean('resuelto')->default(false);

            $table->timestamp('fecha_detectado')->nullable();
            $table->timestamps();

            $table->index(['inventory_audit_id', 'tipo']);
            $table->index(['tipo', 'severidad']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_audit_findings');
        Schema::dropIfExists('inventory_audit_items');
        Schema::dropIfExists('inventory_audits');
    }
};
