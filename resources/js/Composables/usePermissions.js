import { usePage } from '@inertiajs/react';

export const usePermissions = () => {
    const { user } = usePage().props;

    const hasPermission = (permission) => {
        if (!user || !user.is_active) return false;

        // Super admin tiene todos los permisos
        if (user.roles?.some(role => role.name === 'super_admin')) {
            return true;
        }

        // Verificar permisos directos del usuario
        if (user.permissions?.some(p => p.name === permission)) {
            return true;
        }

        // Verificar permisos a través de roles
        return user.roles?.some(role =>
            role.permissions?.some(p => p.name === permission)
        ) || false;
    };

    const hasRole = (roleName) => {
        return user?.roles?.some(role => role.name === roleName) || false;
    };

    const hasAnyRole = (roleNames) => {
        return roleNames.some(roleName => hasRole(roleName));
    };

    const hasAllRoles = (roleNames) => {
        return roleNames.every(roleName => hasRole(roleName));
    };

    const hasAnyPermission = (permissions) => {
        return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions) => {
        return permissions.every(permission => hasPermission(permission));
    };

    const canAccess = (module) => {
        const modulePermissions = {
            assets: ['assets.view'],
            maintenance: ['maintenance.view'],
            inventory: ['inventory.view'],
            reports: ['reports.view'],
            employees: ['employees.view'],
            movements: ['movements.view'],
            admin: ['admin.manage_users', 'admin.manage_roles'],
            config: ['config.categories', 'config.locations', 'config.suppliers', 'config.asset_types']
        };

        const requiredPermissions = modulePermissions[module] || [];
        return hasAnyPermission(requiredPermissions);
    };

    const isAdmin = () => {
        return hasAnyRole(['super_admin', 'admin']);
    };

    const isSuperAdmin = () => {
        return hasRole('super_admin');
    };

    const getUserRoles = () => {
        return user?.roles?.map(role => ({
            name: role.name,
            displayName: role.display_name,
            description: role.description
        })) || [];
    };

    const getUserPermissions = () => {
        const directPermissions = user?.permissions || [];
        const rolePermissions = user?.roles?.flatMap(role => role.permissions || []) || [];

        // Combinar y eliminar duplicados
        const allPermissions = [...directPermissions, ...rolePermissions];
        const uniquePermissions = allPermissions.filter((permission, index, self) =>
            index === self.findIndex(p => p.name === permission.name)
        );

        return uniquePermissions.map(permission => ({
            name: permission.name,
            displayName: permission.display_name,
            description: permission.description,
            module: permission.module
        }));
    };

    return {
        hasPermission,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        hasAnyPermission,
        hasAllPermissions,
        canAccess,
        isAdmin,
        isSuperAdmin,
        getUserRoles,
        getUserPermissions,
        user: user || null
    };
};
