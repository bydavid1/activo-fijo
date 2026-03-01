<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Modules\Assets\Http\Controllers\AssetController;
use App\Modules\Assets\Http\Controllers\AssetCategoryController;
use App\Modules\Assets\Http\Controllers\AssetLocationController;
use App\Modules\Assets\Http\Controllers\AssetTypeController;
use App\Modules\Suppliers\Http\Controllers\SupplierController;
use App\Modules\Employees\Http\Controllers\EmployeeController;
use App\Modules\Inventory\Http\Controllers\InventoryController;
use App\Modules\Inventory\Http\Controllers\InventoryAuditController;
use App\Modules\Maintenance\Http\Controllers\MaintenanceController;
use App\Modules\Reports\Http\Controllers\ReportController;

// Test endpoint (sin autenticación)
Route::get('/test', function () {
    return response()->json([
        'message' => 'API working!',
        'authenticated' => auth()->check(),
        'user' => auth()->user(),
    ]);
});

// ==================== TODAS LAS RUTAS PROTEGIDAS ====================
// Usamos auth:web porque Inertia comparte la sesión web
Route::middleware('auth:web')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // ==================== ASSETS ====================
    Route::prefix('assets')->name('assets.')->group(function () {
        Route::get('/', [AssetController::class, 'index'])->name('index');
        Route::post('/', [AssetController::class, 'store'])->name('store');
        Route::get('/options', [AssetController::class, 'getOptions'])->name('options');
        Route::post('/batch-labels', [AssetController::class, 'generateBatchLabels'])->name('batch-labels');
        Route::get('/{asset}', [AssetController::class, 'show'])->name('show');
        Route::put('/{asset}', [AssetController::class, 'update'])->name('update');
        Route::delete('/{asset}', [AssetController::class, 'destroy'])->name('destroy');
        Route::get('/{asset}/qr', [AssetController::class, 'generateQR'])->name('qr');
        Route::get('/{asset}/barcode', [AssetController::class, 'generateBarcode'])->name('barcode');
        Route::get('/{asset}/label', [AssetController::class, 'generateLabel'])->name('label');
        Route::post('/{asset}/movements', [AssetController::class, 'recordMovement'])->name('record-movement');
        Route::post('/{asset}/dispose', [AssetController::class, 'dispose'])->name('dispose');
        Route::post('/{asset}/revalue', [AssetController::class, 'revalue'])->name('revalue');
        // Nuevas rutas
        Route::post('/{asset}/sell', [AssetController::class, 'sellAsset'])->name('sell');
        Route::post('/{asset}/attachments', [AssetController::class, 'uploadAttachment'])->name('attachments.store');
        Route::delete('/{asset}/attachments/{attachment}', [AssetController::class, 'deleteAttachment'])->name('attachments.destroy');
    });

    // ==================== MOVEMENTS ====================
    Route::prefix('movements')->name('movements.')->group(function () {
        Route::get('/', [AssetController::class, 'listMovements'])->name('index');
    });

    // ==================== CATEGORIES ====================
    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', [AssetCategoryController::class, 'index'])->name('index');
        Route::post('/', [AssetCategoryController::class, 'store'])->name('store');
        Route::get('/{category}', [AssetCategoryController::class, 'show'])->name('show');
        Route::put('/{category}', [AssetCategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [AssetCategoryController::class, 'destroy'])->name('destroy');
    });

    // ==================== ASSET TYPES (Tipos de Bien) ====================
    Route::prefix('asset-types')->name('asset-types.')->group(function () {
        Route::get('/', [AssetTypeController::class, 'index'])->name('index');
        Route::post('/', [AssetTypeController::class, 'store'])->name('store');
        Route::get('/{assetType}', [AssetTypeController::class, 'show'])->name('show');
        Route::put('/{assetType}', [AssetTypeController::class, 'update'])->name('update');
        Route::delete('/{assetType}', [AssetTypeController::class, 'destroy'])->name('destroy');
        // Propiedades del tipo
        Route::post('/{assetType}/properties', [AssetTypeController::class, 'storeProperty'])->name('properties.store');
        Route::put('/{assetType}/properties/{property}', [AssetTypeController::class, 'updateProperty'])->name('properties.update');
        Route::delete('/{assetType}/properties/{property}', [AssetTypeController::class, 'destroyProperty'])->name('properties.destroy');
    });

    // ==================== LOCATIONS ====================
    Route::prefix('locations')->name('locations.')->group(function () {
        Route::get('/', [AssetLocationController::class, 'index'])->name('index');
        Route::post('/', [AssetLocationController::class, 'store'])->name('store');
        Route::get('/{location}', [AssetLocationController::class, 'show'])->name('show');
        Route::put('/{location}', [AssetLocationController::class, 'update'])->name('update');
        Route::delete('/{location}', [AssetLocationController::class, 'destroy'])->name('destroy');
    });

    // ==================== SUPPLIERS ====================
    Route::prefix('suppliers')->name('suppliers.')->group(function () {
        Route::get('/', [SupplierController::class, 'index'])->name('index');
        Route::post('/', [SupplierController::class, 'store'])->name('store');
        Route::get('/{supplier}', [SupplierController::class, 'show'])->name('show');
        Route::put('/{supplier}', [SupplierController::class, 'update'])->name('update');
        Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('destroy');
    });

    // ==================== EMPLOYEES ====================
    Route::prefix('employees')->name('employees.')->group(function () {
        Route::get('/', [EmployeeController::class, 'index'])->name('index');
        Route::post('/', [EmployeeController::class, 'store'])->name('store');
        Route::get('/{employee}', [EmployeeController::class, 'show'])->name('show');
        Route::put('/{employee}', [EmployeeController::class, 'update'])->name('update');
        Route::post('/sync', [EmployeeController::class, 'syncExternal'])->name('sync');
        Route::get('/{employee}/sync-logs', [EmployeeController::class, 'getSyncLogs'])->name('sync-logs');
    });

    // ==================== ASSET TYPES ====================
    Route::prefix('asset-types')->name('asset-types.')->group(function () {
        Route::get('/', [AssetTypeController::class, 'index'])->name('index');
        Route::post('/', [AssetTypeController::class, 'store'])->name('store');
        Route::get('/{assetType}', [AssetTypeController::class, 'show'])->name('show');
        Route::put('/{assetType}', [AssetTypeController::class, 'update'])->name('update');
        Route::delete('/{assetType}', [AssetTypeController::class, 'destroy'])->name('destroy');

        // Asset Type Properties
        Route::post('/{assetType}/properties', [AssetTypeController::class, 'storeProperty'])->name('properties.store');
        Route::put('/{assetType}/properties/{property}', [AssetTypeController::class, 'updateProperty'])->name('properties.update');
        Route::delete('/{assetType}/properties/{property}', [AssetTypeController::class, 'destroyProperty'])->name('properties.destroy');
    });

    // ==================== INVENTORY AUDITS ====================
    Route::prefix('inventory-audits')->name('inventory-audits.')->group(function () {
        Route::get('/', [InventoryAuditController::class, 'index'])->name('index');
        Route::post('/', [InventoryAuditController::class, 'store'])->name('store');
        Route::get('/options', [InventoryAuditController::class, 'getOptions'])->name('options');
        Route::get('/{audit}', [InventoryAuditController::class, 'show'])->name('show');
        Route::delete('/{audit}', [InventoryAuditController::class, 'destroy'])->name('destroy');

        // Audit Actions
        Route::post('/{audit}/iniciar', [InventoryAuditController::class, 'iniciar'])->name('iniciar');
        Route::post('/{audit}/escanear', [InventoryAuditController::class, 'escanearCodigo'])->name('escanear');
        Route::post('/{audit}/finalizar', [InventoryAuditController::class, 'finalizar'])->name('finalizar');
        Route::get('/{audit}/reporte', [InventoryAuditController::class, 'reporte'])->name('reporte');
    });

    // ==================== INVENTORY ====================
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/cycles', [InventoryController::class, 'listCycles'])->name('cycles.index');
        Route::post('/cycles', [InventoryController::class, 'createCycle'])->name('cycles.store');
        Route::put('/cycles/{cycle}/status', [InventoryController::class, 'updateCycleStatus'])->name('cycles.update-status');
        Route::post('/cycles/{cycle}/captures', [InventoryController::class, 'captureAsset'])->name('captures.store');
        Route::get('/cycles/{cycle}/discrepancies', [InventoryController::class, 'listDiscrepancies'])->name('discrepancies.index');
        Route::put('/discrepancies/{discrepancy}/approve', [InventoryController::class, 'approveDiscrepancy'])->name('discrepancies.approve');
        Route::put('/discrepancies/{discrepancy}/reject', [InventoryController::class, 'rejectDiscrepancy'])->name('discrepancies.reject');
        Route::get('/discrepancies/{discrepancy}/transitions', [InventoryController::class, 'getTransitions'])->name('discrepancies.transitions');
    });

    // ==================== MAINTENANCE ====================
    Route::prefix('maintenance')->name('maintenance.')->group(function () {
        Route::get('/', [MaintenanceController::class, 'index'])->name('index');
        Route::post('/', [MaintenanceController::class, 'store'])->name('store');
        Route::get('/options', [MaintenanceController::class, 'getOptions'])->name('options');
        Route::get('/{order}', [MaintenanceController::class, 'show'])->name('show');
        Route::put('/{order}', [MaintenanceController::class, 'update'])->name('update');
        Route::delete('/{order}', [MaintenanceController::class, 'destroy'])->name('destroy');
        Route::put('/{order}/status', [MaintenanceController::class, 'updateStatus'])->name('update-status');
        Route::get('/{order}/history', [MaintenanceController::class, 'getHistory'])->name('history');
    });

    // ==================== REPORTS ====================
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/options', [ReportController::class, 'getOptions'])->name('options');
        Route::get('/asset-list', [ReportController::class, 'assetList'])->name('asset-list');
        Route::get('/depreciation', [ReportController::class, 'depreciation'])->name('depreciation');
        Route::get('/value-responsible', [ReportController::class, 'valueByResponsible'])->name('value-responsible');
        Route::get('/value-location', [ReportController::class, 'valueByLocation'])->name('value-location');
        Route::get('/dispositions-acquisitions', [ReportController::class, 'dispositionsAndAcquisitions'])->name('dispositions-acquisitions');
        Route::get('/movements', [ReportController::class, 'movements'])->name('movements');
        Route::get('/sales', [ReportController::class, 'sales'])->name('sales');
        Route::get('/discrepancies', [ReportController::class, 'discrepancies'])->name('discrepancies');
        Route::get('/maintenance', [ReportController::class, 'maintenance'])->name('maintenance');
        Route::get('/inventory-audits', [ReportController::class, 'inventoryAudits'])->name('inventory-audits');
        Route::get('/summary', [ReportController::class, 'summary'])->name('summary');
        Route::post('/export', [ReportController::class, 'export'])->name('export');
    });
}); // Cierre del middleware auth:web
