<?php

namespace Tests\Unit;

use App\Modules\Accounting\Models\AccountingAccount;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Services\JournalEntryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Exception;
use Tests\TestCase;

class JournalEntryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected JournalEntryService $service;
    protected AccountingAccount $accountCaja;
    protected AccountingAccount $accountBancos;
    protected AccountingAccount $accountAgrupadora;
    protected AccountingAccount $accountInactiva;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(JournalEntryService::class);

        $this->accountCaja = AccountingAccount::create([
            'codigo' => '1.1.01',
            'nombre' => 'CAJA CHICA',
            'tipo' => 'activo',
            'estado' => 'activo',
            'nivel' => 3,
            'permite_movimientos' => true,
        ]);

        $this->accountBancos = AccountingAccount::create([
            'codigo' => '1.1.02',
            'nombre' => 'BANCO MAESTRO',
            'tipo' => 'activo',
            'estado' => 'activo',
            'nivel' => 3,
            'permite_movimientos' => true,
        ]);

        $this->accountAgrupadora = AccountingAccount::create([
            'codigo' => '1.1',
            'nombre' => 'ACTIVO CORRIENTE',
            'tipo' => 'activo',
            'estado' => 'activo',
            'nivel' => 2,
            'permite_movimientos' => false,
        ]);

        $this->accountInactiva = AccountingAccount::create([
            'codigo' => '1.1.03',
            'nombre' => 'BANCO OBSOLETO',
            'tipo' => 'activo',
            'estado' => 'inactivo',
            'nivel' => 3,
            'permite_movimientos' => true,
        ]);
    }

    public function test_it_creates_valid_journal_entry(): void
    {
        $entry = $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Transferencia entre caja y banco',
            'estado' => 'borrador',
        ], [
            [
                'accounting_account_id' => $this->accountCaja->id,
                'debe' => 500.00,
                'haber' => 0,
                'concepto' => 'Ingreso a caja',
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 0,
                'haber' => 500.00,
                'concepto' => 'Salida de banco',
            ],
        ]);

        $this->assertNotNull($entry->id);
        $this->assertStringStartsWith('ASI-202608-', $entry->numero_asiento);
        $this->assertEquals('borrador', $entry->estado);
        $this->assertCount(2, $entry->lines);
    }

    public function test_it_prevents_unbalanced_entries(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('El asiento está descuadrado');

        $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Asiento descuadrado',
        ], [
            [
                'accounting_account_id' => $this->accountCaja->id,
                'debe' => 500.00,
                'haber' => 0,
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 0,
                'haber' => 400.00,
            ],
        ]);
    }

    public function test_it_prevents_line_with_debe_and_haber_simultaneously(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Una misma línea no puede tener valores en el debe y el haber simultáneamente');

        $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Línea inválida',
        ], [
            [
                'accounting_account_id' => $this->accountCaja->id,
                'debe' => 500.00,
                'haber' => 100.00,
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 0,
                'haber' => 400.00,
            ],
        ]);
    }

    public function test_it_prevents_line_with_both_debe_and_haber_zero(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Una línea no puede quedar con ambos valores en cero');

        $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Línea en cero',
        ], [
            [
                'accounting_account_id' => $this->accountCaja->id,
                'debe' => 0,
                'haber' => 0,
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 500.00,
                'haber' => 500.00,
            ],
        ]);
    }

    public function test_it_prevents_using_grouping_accounts(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('es una cuenta agrupadora y no permite movimientos');

        $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Uso de cuenta agrupadora',
        ], [
            [
                'accounting_account_id' => $this->accountAgrupadora->id,
                'debe' => 500.00,
                'haber' => 0,
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 0,
                'haber' => 500.00,
            ],
        ]);
    }

    public function test_it_posts_draft_entry(): void
    {
        $entry = $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Borrador para contabilizar',
            'estado' => 'borrador',
        ], [
            [
                'accounting_account_id' => $this->accountCaja->id,
                'debe' => 300.00,
                'haber' => 0,
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 0,
                'haber' => 300.00,
            ],
        ]);

        $posted = $this->service->postEntry($entry);

        $this->assertEquals('contabilizado', $posted->estado);
        $this->assertNotNull($posted->contabilizado_en);
    }

    public function test_it_voids_posted_entry_with_reversal_contrapartida(): void
    {
        $entry = $this->service->createEntry([
            'fecha' => '2026-08-01',
            'descripcion' => 'Asiento original a anular',
            'estado' => 'contabilizado',
        ], [
            [
                'accounting_account_id' => $this->accountCaja->id,
                'debe' => 300.00,
                'haber' => 0,
            ],
            [
                'accounting_account_id' => $this->accountBancos->id,
                'debe' => 0,
                'haber' => 300.00,
            ],
        ]);

        $reversal = $this->service->voidEntry($entry, 'Error de digitación');

        $entry->refresh();
        $this->assertEquals('anulado', $entry->estado);
        $this->assertEquals($reversal->id, $entry->anulado_por_id);

        $this->assertEquals('contabilizado', $reversal->estado);
        $this->assertEquals('anulacion', $reversal->tipo_origen);

        // En la contrapartida, la línea 1 debe ser Haber 300 y línea 2 Debe 300
        $linesReversal = $reversal->lines;
        $this->assertEquals(0, (float) $linesReversal[0]->debe);
        $this->assertEquals(300.00, (float) $linesReversal[0]->haber);
        $this->assertEquals(300.00, (float) $linesReversal[1]->debe);
        $this->assertEquals(0, (float) $linesReversal[1]->haber);
    }
}
