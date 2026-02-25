<?php

namespace App\Modules\Assets\Events;

use App\Modules\Assets\Models\AssetMovement;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssetMoved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public AssetMovement $movement,
    ) {}
}
