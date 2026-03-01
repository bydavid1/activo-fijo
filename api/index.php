<?php

// Define the base path
define('LARAVEL_START', microtime(true));

// Check if running on Vercel
if (isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL'])) {
    // Set up paths for Vercel
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    $_SERVER['SCRIPT_FILENAME'] = __FILE__;

    // Ensure storage and bootstrap cache directories exist
    $storagePath = __DIR__ . '/../storage';
    $bootstrapPath = __DIR__ . '/../bootstrap/cache';

    if (!is_dir($storagePath)) {
        mkdir($storagePath, 0755, true);
    }

    if (!is_dir($storagePath . '/logs')) {
        mkdir($storagePath . '/logs', 0755, true);
    }

    if (!is_dir($storagePath . '/framework')) {
        mkdir($storagePath . '/framework', 0755, true);
        mkdir($storagePath . '/framework/cache', 0755, true);
        mkdir($storagePath . '/framework/sessions', 0755, true);
        mkdir($storagePath . '/framework/views', 0755, true);
    }

    if (!is_dir($bootstrapPath)) {
        mkdir($bootstrapPath, 0755, true);
    }
}

// Register the Composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel and handle the request
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
