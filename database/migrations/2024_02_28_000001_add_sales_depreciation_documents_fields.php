<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════════════════
        // 0. ACTUALIZAR ENUM DE ESTADO PARA INCLUIR 'vendido'
        // ═══════════════════════════════════════════════════════════════════
        \DB::statement("ALTER TABLE assets MODIFY COLUMN estado ENUM('activo', 'mantenimiento', 'inactivo', 'descartado', 'retirado', 'vendido') DEFAULT 'activo'");

        // ═══════════════════════════════════════════════════════════════════
        // 1. CAMPOS ADICIONALES EN ASSETS (tipo adquisición, documentos, depreciación)
        // ═══════════════════════════════════════════════════════════════════
        Schema::table('assets', function (Blueprint $table) {
            // Tipo de adquisición
            $table->enum('tipo_adquisicion', ['compra', 'donacion', 'transferencia', 'comodato', 'leasing'])
                  ->default('compra')
                  ->after('estado');

            // Documentos de compra
            $table->string('orden_compra')->nullable()->after('tipo_adquisicion');
            $table->string('numero_factura')->nullable()->after('orden_compra');

            // Configuración de depreciación
            $table->enum('periodicidad_depreciacion', ['mensual', 'anual'])
                  ->default('mensual')
                  ->after('metodo_depreciacion');

            // Regla del día 15: si se adquiere después del día 15, deprecia desde el siguiente mes
            $table->boolean('aplicar_regla_dia_15')->default(true)->after('periodicidad_depreciacion');
            $table->date('fecha_inicio_depreciacion')->nullable()->after('aplicar_regla_dia_15');

            // Para donaciones
            $table->string('donante_nombre')->nullable()->after('numero_factura');
            $table->text('donacion_documento')->nullable()->after('donante_nombre');
        });

        // ═══════════════════════════════════════════════════════════════════
        // 2. CAMPOS ADICIONALES EN MOVIMIENTOS (ventas y subastas)
        // ═══════════════════════════════════════════════════════════════════
        // Actualizar enum de tipo para incluir venta y baja
        \DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('traslado', 'reubicacion', 'mantenimiento', 'prestamo', 'devolucion', 'venta', 'baja', 'otro') DEFAULT 'traslado'");

        Schema::table('asset_movements', function (Blueprint $table) {

            // Campos para ventas
            $table->enum('tipo_venta', ['directa', 'subasta', 'licitacion'])
                  ->nullable()
                  ->after('tipo');

            $table->enum('tipo_pago', ['efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro'])
                  ->nullable()
                  ->after('tipo_venta');

            $table->enum('condicion_pago', ['contado', 'credito_30', 'credito_60', 'credito_90'])
                  ->nullable()
                  ->after('tipo_pago');

            $table->decimal('precio_venta', 15, 2)->nullable()->after('condicion_pago');

            // Datos del comprador
            $table->string('comprador_nombre')->nullable()->after('precio_venta');
            $table->string('comprador_documento')->nullable()->after('comprador_nombre');
            $table->string('comprador_telefono')->nullable()->after('comprador_documento');

            // Documento de respaldo de la venta
            $table->string('documento_venta')->nullable()->after('comprador_telefono');
        });

        // ═══════════════════════════════════════════════════════════════════
        // 3. MODIFICAR TABLA DE DEPRECIACIÓN (fiscal vs financiera)
        // ═══════════════════════════════════════════════════════════════════
        Schema::table('asset_depreciation', function (Blueprint $table) {
            $table->enum('tipo_depreciacion', ['fiscal', 'financiera'])
                  ->default('financiera')
                  ->after('asset_id');

            // Para identificar el mes/año específico
            $table->integer('ano')->nullable()->after('periodo');
            $table->integer('mes')->nullable()->after('ano');

            // Índice compuesto actualizado
            $table->index(['asset_id', 'tipo_depreciacion', 'ano', 'mes'], 'idx_asset_depreciation_tipo_periodo');
        });

        // ═══════════════════════════════════════════════════════════════════
        // 4. TABLA DE ARCHIVOS ADJUNTOS (fotos, documentos)
        // ═══════════════════════════════════════════════════════════════════
        Schema::create('asset_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');

            $table->enum('tipo', ['foto', 'factura', 'orden_compra', 'garantia', 'manual', 'otro'])
                  ->default('otro');

            $table->string('nombre_original');
            $table->string('nombre_archivo'); // nombre en storage
            $table->string('ruta');
            $table->string('mime_type')->nullable();
            $table->integer('tamano')->nullable(); // en bytes
            $table->text('descripcion')->nullable();
            $table->boolean('es_principal')->default(false); // para foto principal

            $table->foreignId('usuario_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['asset_id', 'tipo']);
        });

        // ═══════════════════════════════════════════════════════════════════
        // 5. AMPLIAR TABLA DE REVALÚOS (ya existe, agregar campos)
        // ═══════════════════════════════════════════════════════════════════
        Schema::table('asset_valuations', function (Blueprint $table) {
            $table->enum('tipo_revaluo', ['revalorizacion', 'deterioro', 'ajuste_inflacion', 'tasacion'])
                  ->default('revalorizacion')
                  ->after('metodo');

            $table->string('perito_nombre')->nullable()->after('tipo_revaluo');
            $table->string('documento_respaldo')->nullable()->after('perito_nombre');
        });
    }

    public function down(): void
    {
        // Eliminar tabla de attachments
        Schema::dropIfExists('asset_attachments');

        // Revertir cambios en asset_valuations
        Schema::table('asset_valuations', function (Blueprint $table) {
            $table->dropColumn(['tipo_revaluo', 'perito_nombre', 'documento_respaldo']);
        });

        // Revertir cambios en asset_depreciation
        Schema::table('asset_depreciation', function (Blueprint $table) {
            $table->dropIndex('idx_asset_depreciation_tipo_periodo');
            $table->dropColumn(['tipo_depreciacion', 'ano', 'mes']);
        });

        // Revertir cambios en asset_movements
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_venta', 'tipo_pago', 'condicion_pago', 'precio_venta',
                'comprador_nombre', 'comprador_documento', 'comprador_telefono',
                'documento_venta'
            ]);
        });

        // Revertir cambios en assets
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_adquisicion', 'orden_compra', 'numero_factura',
                'periodicidad_depreciacion', 'aplicar_regla_dia_15',
                'fecha_inicio_depreciacion', 'donante_nombre', 'donacion_documento'
            ]);
        });
    }
};
