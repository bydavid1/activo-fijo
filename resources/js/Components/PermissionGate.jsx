import React from 'react';
import { usePermissions } from '@/Composables/usePermissions';

export const PermissionGate = ({
    permission,
    role,
    permissions = [],
    roles = [],
    requireAll = false,
    children,
    fallback = null
}) => {
    const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles } = usePermissions();

    // Verificar permisos individuales
    if (permission && !hasPermission(permission)) {
        return fallback;
    }

    // Verificar rol individual
    if (role && !hasRole(role)) {
        return fallback;
    }

    // Verificar múltiples permisos
    if (permissions.length > 0) {
        const hasRequiredPermissions = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        if (!hasRequiredPermissions) {
            return fallback;
        }
    }

    // Verificar múltiples roles
    if (roles.length > 0) {
        const hasRequiredRoles = requireAll
            ? hasAllRoles(roles)
            : hasAnyRole(roles);

        if (!hasRequiredRoles) {
            return fallback;
        }
    }

    return children;
};

export const AdminGate = ({ children, fallback = null }) => (
    <PermissionGate
        roles={['super_admin', 'admin']}
        children={children}
        fallback={fallback}
    />
);

export const SuperAdminGate = ({ children, fallback = null }) => (
    <PermissionGate
        role="super_admin"
        children={children}
        fallback={fallback}
    />
);

export default PermissionGate;
