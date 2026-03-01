<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;

// ==================== AUTHENTICATION ====================
Route::get('/login', [LoginController::class, 'showLoginForm'])->middleware('guest')->name('login');
Route::post('/login', [LoginController::class, 'login'])->middleware('guest');
Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth')->name('logout');

Route::get('/register', [RegisterController::class, 'showRegisterForm'])->middleware('guest')->name('register');
Route::post('/register', [RegisterController::class, 'register'])->middleware('guest');

// Dashboard
Route::get('/', function () {
    return Inertia::render('Dashboard');
})->middleware('auth')->name('dashboard');

// ==================== ABOUT / INFO ====================
Route::get('/about', function () {
    return Inertia::render('About');
})->middleware('auth')->name('about');

// ==================== ASSETS ====================
Route::prefix('assets')->middleware(['auth', 'permission:assets.view'])->name('assets.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Assets/Index');
    })->name('index');

    Route::get('/create', function () {
        return Inertia::render('Assets/Create');
    })->middleware('permission:assets.create')->name('create');

    Route::get('/{asset}', function ($asset) {
        return Inertia::render('Assets/Show', [
            'assetId' => $asset,
        ]);
    })->name('show');

    Route::get('/{asset}/edit', function ($asset) {
        return Inertia::render('Assets/Edit', [
            'asset' => $asset,
        ]);
    })->middleware('permission:assets.edit')->name('edit');
});

// ==================== EMPLOYEES ====================
Route::prefix('employees')->middleware(['auth', 'permission:employees.view'])->name('employees.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Employees/Index');
    })->name('index');

    Route::get('/create', function () {
        return Inertia::render('Employees/Create');
    })->middleware('permission:employees.create')->name('create');
});

// ==================== MOVEMENTS ====================
Route::prefix('movements')->middleware(['auth', 'permission:assets.move'])->name('movements.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Movements/Index');
    })->name('index');
});

// ==================== ADMINISTRATION ====================
Route::prefix('categories')->middleware(['auth', 'permission:admin.manage_config'])->name('categories.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Categories/Index');
    })->name('index');
});

Route::prefix('asset-types')->middleware(['auth', 'permission:admin.manage_config'])->name('asset-types.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('AssetTypes/Index');
    })->name('index');
});

Route::prefix('inventory-audits')->middleware(['auth', 'permission:inventory.audit'])->name('inventory-audits.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('InventoryAudits/Index');
    })->name('index');

    Route::get('/{audit}/scanner', function ($audit) {
        return Inertia::render('InventoryAudits/Scanner', [
            'auditId' => $audit,
        ]);
    })->name('scanner');

    Route::get('/{audit}/report', function ($audit) {
        return Inertia::render('InventoryAudits/Report', [
            'auditId' => $audit,
        ]);
    })->name('report');
});

Route::prefix('locations')->middleware(['auth', 'permission:admin.manage_config'])->name('locations.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Locations/Index');
    })->name('index');
});

Route::prefix('suppliers')->middleware(['auth', 'permission:suppliers.view'])->name('suppliers.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Suppliers/Index');
    })->name('index');
});

// ==================== MAINTENANCE ====================
Route::prefix('maintenance')->middleware(['auth', 'permission:maintenance.view'])->name('maintenance.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Maintenance/Index');
    })->name('index');
});

// ==================== REPORTS ====================
Route::prefix('reports')->middleware(['auth', 'permission:reports.view'])->name('reports.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Reports/Index');
    })->name('index');
});

// ==================== ADMIN (USERS & ROLES) ====================
Route::prefix('admin')->middleware(['auth', 'permission:admin.manage_users'])->name('admin.')->group(function () {
    Route::resource('users', App\Http\Controllers\Admin\UserController::class);
    Route::patch('users/{user}/toggle-status', [App\Http\Controllers\Admin\UserController::class, 'toggleStatus'])->name('users.toggle-status');
});

