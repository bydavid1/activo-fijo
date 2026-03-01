<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'last_login',
        'avatar',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login' => 'datetime',
            'is_active' => 'boolean',
            'preferences' => 'array',
        ];
    }

    /**
     * Relación con roles
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Relación con permisos directos
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }

    /**
     * Verificar si el usuario tiene un permiso específico
     */
    public function hasPermission($permission): bool
    {
        // Super admin tiene todos los permisos
        if ($this->hasRole('super_admin')) {
            return true;
        }

        // Verificar permisos directos
        if (is_string($permission)) {
            if ($this->permissions->contains('name', $permission)) {
                return true;
            }
        } else if ($this->permissions->contains($permission)) {
            return true;
        }

        // Verificar permisos a través de roles
        foreach ($this->roles as $role) {
            if ($role->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    public function hasRole($role): bool
    {
        if (is_string($role)) {
            return $this->roles->contains('name', $role);
        }

        return $this->roles->contains($role);
    }

    /**
     * Asignar rol al usuario
     */
    public function assignRole($role)
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->first();
        }

        if ($role && !$this->hasRole($role)) {
            $this->roles()->attach($role);
        }

        return $this;
    }

    /**
     * Remover rol del usuario
     */
    public function removeRole($role)
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->first();
        }

        if ($role) {
            $this->roles()->detach($role);
        }

        return $this;
    }

    /**
     * Sincronizar roles del usuario
     */
    public function syncRoles($roles)
    {
        $roleIds = collect($roles)->map(function ($role) {
            if (is_string($role)) {
                return Role::where('name', $role)->first()?->id;
            }
            return $role->id ?? $role;
        })->filter();

        $this->roles()->sync($roleIds);
        return $this;
    }

    /**
     * Asignar permiso directo al usuario
     */
    public function givePermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }

        if ($permission && !$this->hasPermission($permission)) {
            $this->permissions()->attach($permission);
        }

        return $this;
    }

    /**
     * Revocar permiso directo del usuario
     */
    public function revokePermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }

        if ($permission) {
            $this->permissions()->detach($permission);
        }

        return $this;
    }

    /**
     * Obtener todos los permisos del usuario (roles + permisos directos)
     */
    public function getAllPermissions()
    {
        $permissions = $this->permissions;

        foreach ($this->roles as $role) {
            $permissions = $permissions->merge($role->permissions);
        }

        return $permissions->unique('id');
    }

    /**
     * Verificar si el usuario está activo
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Obtener el nombre de visualización del usuario
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name;
    }

    /**
     * Obtener las iniciales del usuario para el avatar
     */
    public function getInitialsAttribute(): string
    {
        $names = explode(' ', $this->name);
        if (count($names) >= 2) {
            return strtoupper(substr($names[0], 0, 1) . substr($names[1], 0, 1));
        }
        return strtoupper(substr($this->name, 0, 2));
    }
}
