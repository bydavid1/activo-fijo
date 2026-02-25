<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Assets Events
use App\Modules\Assets\Events\AssetCreated;
use App\Modules\Assets\Events\AssetMoved;
use App\Modules\Assets\Events\AssetRevalued;
use App\Modules\Assets\Events\AssetDisposed;
use App\Modules\Assets\Listeners\LogAssetCreated;
use App\Modules\Assets\Listeners\LogAssetMoved;
use App\Modules\Assets\Listeners\LogAssetRevalued;

// Inventory Events
use App\Modules\Inventory\Events\DiscrepancyDetected;
use App\Modules\Inventory\Events\DiscrepancyApproved;
use App\Modules\Inventory\Listeners\LogDiscrepancyApproved;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     */
    protected $listen = [
        // Assets
        AssetCreated::class => [
            LogAssetCreated::class,
        ],
        AssetMoved::class => [
            LogAssetMoved::class,
        ],
        AssetRevalued::class => [
            LogAssetRevalued::class,
        ],
        AssetDisposed::class => [
            // Listeners para disposición
        ],

        // Inventory
        DiscrepancyDetected::class => [
            // Listeners para discrepancia detectada
        ],
        DiscrepancyApproved::class => [
            LogDiscrepancyApproved::class,
        ],
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

