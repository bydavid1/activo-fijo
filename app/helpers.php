<?php

if (!function_exists('authenticated_user_with_permissions')) {
    /**
     * Get the authenticated user with all roles and permissions loaded
     */
    function authenticated_user_with_permissions() {
        if (!auth()->check()) {
            return null;
        }

        return auth()->user()->load([
            'roles.permissions',
            'permissions'
        ]);
    }
}

if (!function_exists('user_data_for_frontend')) {
    /**
     * Format user data for frontend consumption with all permissions
     */
    function user_data_for_frontend() {
        $user = authenticated_user_with_permissions();

        if (!$user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'roles' => $user->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'permissions' => $role->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'display_name' => $permission->display_name,
                            'module' => $permission->module
                        ];
                    })
                ];
            }),
            'permissions' => $user->permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'module' => $permission->module
                ];
            }),
            'all_permissions' => $user->getAllPermissions()
        ];
    }
}
