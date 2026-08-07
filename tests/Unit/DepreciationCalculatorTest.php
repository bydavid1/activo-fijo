<?php

namespace Tests\Unit;

use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetDepreciation;
use App\Modules\Assets\Services\DepreciationCalculator;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DepreciationCalculatorTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('codigo');
            $table->string('nombre');
            $table->decimal('valor_compra', 12, 2)->default(0);
            $table->decimal('valor_residual', 12, 2)->default(0);
            $table->integer('vida_util_anos')->nullable();
            $table->date('fecha_adquisicion')->nullable();
            $table->boolean('depreciable')->default(true);
            $table->string('periodicidad_depreciacion')->default('mensual');
            $table->boolean('aplicar_regla_dia_15')->default(true);
            $table->date('fecha_inicio_depreciacion')->nullable();
            $table->string('estado')->default('disponible');
            $table->timestamps();
        });

        Schema::create('asset_depreciation', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('asset_id');
            $table->integer('periodo');
            $table->integer('ano')->nullable();
            $table->integer('mes')->nullable();
            $table->string('tipo_depreciacion')->default('financiera');
            $table->decimal('depreciacion_valor', 12, 2)->default(0);
            $table->decimal('depreciacion_acumulada', 12, 2)->default(0);
            $table->decimal('valor_en_libros', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('asset_depreciation');
        Schema::dropIfExists('assets');

        parent::tearDown();
    }

    public function test_it_persists_period_month_and_year_when_saving_depreciation(): void
    {
        $asset = Asset::create([
            'codigo' => 'TEST-001',
            'nombre' => 'Laptop de prueba',
            'valor_compra' => 1000.00,
            'valor_residual' => 100.00,
            'vida_util_anos' => 2,
            'fecha_adquisicion' => '2024-01-15',
            'depreciable' => true,
            'periodicidad_depreciacion' => 'mensual',
            'estado' => 'disponible',
        ]);

        $calculator = app(DepreciationCalculator::class);
        $calculator->saveDepreciation($asset);

        $depreciaciones = AssetDepreciation::where('asset_id', $asset->id)->get();

        $this->assertNotEmpty($depreciaciones);
        $this->assertTrue(
            $depreciaciones->contains(fn (AssetDepreciation $dep) => !empty($dep->ano) && !empty($dep->mes)),
            'Se esperaba que cada registro de depreciación tuviera año y mes asignados.'
        );
    }
}
