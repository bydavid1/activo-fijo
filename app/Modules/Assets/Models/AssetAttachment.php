<?php

namespace App\Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class AssetAttachment extends Model
{
    use SoftDeletes;

    protected $table = 'asset_attachments';

    protected $fillable = [
        'asset_id',
        'tipo',
        'nombre_original',
        'nombre_archivo',
        'ruta',
        'mime_type',
        'tamano',
        'descripcion',
        'es_principal',
        'usuario_id',
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'tamano' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['url'];

    // ═══════════════ RELACIONES ═══════════════

    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }

    // ═══════════════ ACCESSORS ═══════════════

    public function getUrlAttribute(): ?string
    {
        if ($this->ruta) {
            return Storage::url($this->ruta);
        }
        return null;
    }

    public function getTamanoFormateadoAttribute(): string
    {
        $bytes = $this->tamano;

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' bytes';
    }

    // ═══════════════ SCOPES ═══════════════

    public function scopeFotos($query)
    {
        return $query->where('tipo', 'foto');
    }

    public function scopeDocumentos($query)
    {
        return $query->whereIn('tipo', ['factura', 'orden_compra', 'garantia', 'manual', 'otro']);
    }

    public function scopePrincipal($query)
    {
        return $query->where('es_principal', true);
    }
}
