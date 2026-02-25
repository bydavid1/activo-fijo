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
    return Inertia::render('Dashboard', [
        'user' => auth()->user(),
    ]);
})->middleware('auth')->name('dashboard');

// ==================== ASSETS ====================
Route::prefix('assets')->middleware('auth')->name('assets.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Assets/Index', [
            'user' => auth()->user(),
        ]);
    })->name('index');

    Route::get('/create', function () {
        return Inertia::render('Assets/Create', [
            'user' => auth()->user(),
        ]);
    })->name('create');

    Route::get('/{asset}/edit', function ($asset) {
        return Inertia::render('Assets/Edit', [
            'user' => auth()->user(),
            'asset' => $asset,
        ]);
    })->name('edit');
});

// ==================== EMPLOYEES ====================
Route::prefix('employees')->middleware('auth')->name('employees.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Employees/Index', [
            'user' => auth()->user(),
        ]);
    })->name('index');

    Route::get('/create', function () {
        return Inertia::render('Employees/Create', [
            'user' => auth()->user(),
        ]);
    })->name('create');
});

// ==================== INVENTORY ====================
Route::prefix('inventory')->middleware('auth')->name('inventory.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Inventory/Index', [
            'user' => auth()->user(),
        ]);
    })->name('index');
});

// ==================== MAINTENANCE ====================
Route::prefix('maintenance')->middleware('auth')->name('maintenance.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Maintenance/Index', [
            'user' => auth()->user(),
        ]);
    })->name('index');
});

// ==================== REPORTS ====================
Route::prefix('reports')->middleware('auth')->name('reports.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Reports/Index', [
            'user' => auth()->user(),
        ]);
    })->name('index');
});

