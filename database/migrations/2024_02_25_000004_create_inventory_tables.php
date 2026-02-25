<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ciclos de inventario
        Schema::create('inventory_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->enum('estado', ['planeado', 'en_ejecucion', 'captura_completa', 'en_reconciliacion', 'completado'])->default('planeado');
            
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->foreignId('ubicacion_id')->constrained('asset_locations');
            $table->foreignId('usuario_responsable_id')->constrained('users');
            
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('estado');
            $table->index('ubicacion_id');
        });

        // Capturas de inventario
        Schema::create('inventory_captures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained('inventory_cycles')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets');
            
            $table->foreignId('capturado_por_id')->constrained('users');
            $table->enum('metodo', ['manual', 'qr'])->default('manual');
            
            $table->timestamps();

            $table->index(['cycle_id', 'asset_id']);
        });

        // Discrepancias detectadas
        Schema::create('inventory_discrepancies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained('inventory_cycles');
            $table->foreignId('asset_id')->constrained('assets');
            
            $table->enum('estado', ['detectada', 'pendiente_aprobacion', 'aprobada', 'rechazada', 'resuelta'])->default('detectada');
            $table->enum('tipo_discrepancia', ['faltante', 'ubicacion_incorrecta', 'otro'])->default('faltante');
            
            $table->text('descripcion')->nullable();
            $table->foreignId('usuario_id')->constrained('users');
            
            // Aprobación
            $table->foreignId('aprobado_por_id')->nullable()->constrained('users');
            $table->text('notas_aprobacion')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->index(['cycle_id', 'estado']);
            $table->index(['asset_id', 'estado']);
        });

        // Registro de transiciones de discrepancias
        Schema::create('discrepancy_transitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discrepancy_id')->constrained('inventory_discrepancies')->cascadeOnDelete();
            
            $table->string('estado_anterior');
            $table->string('estado_nuevo');
            $table->foreignId('usuario_id')->constrained('users');
            $table->text('razon')->nullable();
            
            $table->timestamps();

            $table->index(['discrepancy_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discrepancy_transitions');
        Schema::dropIfExists('inventory_discrepancies');
        Schema::dropIfExists('inventory_captures');
        Schema::dropIfExists('inventory_cycles');
    }
};
