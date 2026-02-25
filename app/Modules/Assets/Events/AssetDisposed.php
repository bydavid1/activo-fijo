<?php

namespace App\Modules\Assets\Events;

use App\Modules\Assets\Models\Asset;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssetDisposed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Asset $asset,
        public ?float $valorResidual = null,
    ) {}
}
