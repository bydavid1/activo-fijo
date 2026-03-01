<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'module'
    ];

    /**
     * Relación con roles
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }

    /**
     * Relación con usuarios (permisos directos)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permissions');
    }

    /**
     * Obtener permisos agrupados por módulo
     */
    public static function getByModule()
    {
        return self::all()->groupBy('module');
    }

    /**
     * Crear permisos en lote para un módulo
     */
    public static function createForModule(string $module, array $actions, string $displayPrefix = null)
    {
        $displayPrefix = $displayPrefix ?? ucfirst($module);

        foreach ($actions as $action) {
            self::firstOrCreate(
                ['name' => "{$module}.{$action}"],
                [
                    'display_name' => "{$displayPrefix} - " . ucfirst($action),
                    'description' => "Permitir {$action} en el módulo de {$displayPrefix}",
                    'module' => $module
                ]
            );
        }
    }
}
