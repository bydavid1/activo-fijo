<?php

namespace App\Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Assets\Models\Asset;

use App\Models\User;

class JournalEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'numero_asiento',
        'fecha',
        'descripcion',
        'asset_id',
        'tipo_origen',
        'estado',
        'anulado_por_id',
        'contabilizado_en',
        'contabilizado_por_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'contabilizado_en' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }
    
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function anuladoPor(): BelongsTo
    {
        return $this->belongsTo(self::class, 'anulado_por_id');
    }

    public function contabilizadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contabilizado_por_id');
    }
}
