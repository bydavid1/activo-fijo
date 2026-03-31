<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value', 'description', 'group'];

    protected $casts = [
        'value' => 'json',
    ];

    /**
     * Obtener un valor de configuración
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::find($key);
        return $setting ? $setting->value : $default;
    }

    /**
     * Establecer un valor de configuración
     */
    public static function set(string $key, mixed $value, ?string $description = null, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            array_filter([
                'value' => $value,
                'description' => $description,
                'group' => $group,
            ], fn($v) => $v !== null)
        );
    }

    /**
     * Obtener todas las configuraciones agrupadas
     */
    public static function allGrouped(): array
    {
        return static::all()
            ->groupBy('group')
            ->map(fn($items) => $items->pluck('value', 'key'))
            ->toArray();
    }

    /**
     * Obtener todas las configuraciones como key => value
     */
    public static function allSettings(): array
    {
        return static::all()->pluck('value', 'key')->toArray();
    }
}
