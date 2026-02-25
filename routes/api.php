<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Modules\Assets\Http\Controllers\AssetController;
use App\Modules\Employees\Http\Controllers\EmployeeController;
use App\Modules\Inventory\Http\Controllers\InventoryController;
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

Route::middleware('auth:web')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// ==================== ASSETS ====================
Route::prefix('assets')->name('assets.')->group(function () {
    Route::get('/', [AssetController::class, 'index'])->name('index');
    Route::post('/', [AssetController::class, 'store'])->name('store');
    Route::get('/options', [AssetController::class, 'getOptions'])->name('options');
    Route::get('/{asset}', [AssetController::class, 'show'])->name('show');
    Route::put('/{asset}', [AssetController::class, 'update'])->name('update');
    Route::delete('/{asset}', [AssetController::class, 'destroy'])->name('destroy');
    Route::get('/{asset}/qr', [AssetController::class, 'generateQR'])->name('qr');
    Route::post('/{asset}/movements', [AssetController::class, 'recordMovement'])->name('record-movement');
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
    Route::get('/asset-list', [ReportController::class, 'assetList'])->name('asset-list');
    Route::get('/depreciation', [ReportController::class, 'depreciation'])->name('depreciation');
    Route::get('/value-responsible', [ReportController::class, 'valueByResponsible'])->name('value-responsible');
    Route::get('/movements', [ReportController::class, 'movements'])->name('movements');
    Route::get('/discrepancies', [ReportController::class, 'discrepancies'])->name('discrepancies');
    Route::get('/maintenance', [ReportController::class, 'maintenance'])->name('maintenance');
    Route::post('/export', [ReportController::class, 'export'])->name('export');
});
