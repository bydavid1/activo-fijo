<?php

namespace App\Modules\Assets\Events;

use App\Modules\Assets\Models\Asset;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssetDepreciated
{
    use Dispatchable, SerializesModels;

    public $asset;
    public $depreciacionesNuevas;

    /**
     * Create a new event instance.
     *
     * @param Asset $asset
     * @param array $depreciacionesNuevas Las depreciaciones recién calculadas y guardadas.
     */
    public function __construct(Asset $asset, array $depreciacionesNuevas)
    {
        $this->asset = $asset;
        $this->depreciacionesNuevas = $depreciacionesNuevas;
    }
}
