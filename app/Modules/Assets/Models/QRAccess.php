<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;

class QRAccess extends Model
{
    protected $table = 'qr_accesses';

    public $timestamps = false;

    protected $fillable = [
        'asset_id',
        'user_id',
        'accessed_at',
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
