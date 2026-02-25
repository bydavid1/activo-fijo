<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Empleados
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
            $table->string('email')->unique();
            $table->string('departamento')->nullable();
            $table->string('puesto')->nullable();
            $table->string('telefono')->nullable();

            // Para integración externa
            $table->timestamps();
            $table->softDeletes();

            $table->index('codigo');
            $table->index('email');
        });

        // Integración con APIs externas
        Schema::create('employee_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();

            $table->string('sistema_externo'); // ej: 'SAP', 'Adobe', etc.
            $table->string('id_externo')->unique();
            $table->timestamp('ultima_sincronizacion')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['sistema_externo', 'id_externo']);
        });

        // Log de sincronización
        Schema::create('employee_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();

            $table->enum('accion', ['creado', 'actualizado', 'eliminado']);
            $table->enum('estado', ['exitoso', 'error']);
            $table->json('respuesta')->nullable();
            $table->text('mensaje_error')->nullable();

            $table->timestamps();

            $table->index(['employee_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_sync_logs');
        Schema::dropIfExists('employee_integrations');
        Schema::dropIfExists('employees');
    }
};
