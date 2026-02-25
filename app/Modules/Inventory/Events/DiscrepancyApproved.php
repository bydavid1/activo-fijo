<?php

namespace App\Modules\Inventory\Events;

use App\Modules\Inventory\Models\InventoryDiscrepancy;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DiscrepancyApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public InventoryDiscrepancy $discrepancy,
    ) {}
}
