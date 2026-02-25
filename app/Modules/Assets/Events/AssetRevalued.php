<?php

namespace App\Modules\Assets\Events;

use App\Modules\Assets\Models\AssetValuation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssetRevalued
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public AssetValuation $valuation,
    ) {}
}
