<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Categorías de activos
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('codigo')->unique();
            $table->text('descripcion')->nullable();
            $table->string('metodo_depreciacion')->default('lineal'); // lineal, acelerada, etc.
            $table->timestamps();
            $table->softDeletes();
        });

        // Ubicaciones
        Schema::create('asset_locations', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('codigo')->unique();
            $table->text('descripcion')->nullable();
            $table->string('edificio')->nullable();
            $table->string('piso')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Proveedores
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('codigo')->unique();
            $table->string('nit')->nullable();
            $table->string('email')->nullable();
            $table->string('telefono')->nullable();
            $table->text('direccion')->nullable();
            $table->string('ciudad')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Activos
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('marca')->nullable();
            $table->string('modelo')->nullable();
            $table->string('serie')->nullable();
            
            // Relaciones
            $table->foreignId('categoria_id')->constrained('asset_categories');
            $table->foreignId('ubicacion_id')->constrained('asset_locations');
            $table->foreignId('proveedor_id')->nullable()->constrained('suppliers');
            $table->foreignId('responsable_id')->nullable()->constrained('users');

            // Datos financieros
            $table->decimal('valor_compra', 15, 2);
            $table->decimal('valor_residual', 15, 2)->default(0);
            $table->integer('vida_util_anos')->nullable(); // años
            $table->date('fecha_adquisicion');
            
            // Estados
            $table->enum('estado', ['activo', 'mantenimiento', 'inactivo', 'descartado', 'retirado'])->default('activo');
            
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('codigo');
            $table->index('categoria_id');
            $table->index('ubicacion_id');
            $table->index('estado');
            $table->index('responsable_id');
        });

        // Tabla de acceso a códigos QR (auditoría)
        Schema::create('qr_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->timestamp('accessed_at');
            
            $table->index(['asset_id', 'accessed_at']);
        });

        // Valuaciones y revalúos
        Schema::create('asset_valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets');
            
            $table->decimal('valor_anterior', 15, 2);
            $table->decimal('valor_nuevo', 15, 2);
            $table->date('fecha_efectiva');
            $table->enum('metodo', ['contable', 'mercado', 'pericia'])->default('contable');
            $table->text('notas')->nullable();
            
            $table->foreignId('usuario_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['asset_id', 'fecha_efectiva']);
            $table->unique(['asset_id', 'fecha_efectiva']);
        });

        // Depreciación calculada
        Schema::create('asset_depreciation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets');
            
            $table->integer('periodo'); // año o mes
            $table->decimal('depreciacion_valor', 15, 2);
            $table->decimal('depreciacion_acumulada', 15, 2);
            $table->decimal('valor_en_libros', 15, 2);
            
            $table->timestamps();

            // Índices
            $table->unique(['asset_id', 'periodo']);
            $table->index(['asset_id', 'periodo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_accesses');
        Schema::dropIfExists('asset_depreciation');
        Schema::dropIfExists('asset_valuations');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('asset_locations');
        Schema::dropIfExists('asset_categories');
    }
};
