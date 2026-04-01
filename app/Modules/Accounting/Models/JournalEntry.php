<?php

namespace App\Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Assets\Models\Asset;

class JournalEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'fecha',
        'descripcion',
        'asset_id',
        'tipo_origen',
        'estado'
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }
    
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
