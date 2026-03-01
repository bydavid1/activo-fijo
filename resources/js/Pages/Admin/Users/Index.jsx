import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import AppLayout from '@/Layouts/AppLayout';
import { usePermissions } from '@/Composables/usePermissions';
import PermissionGate from '@/Components/PermissionGate';

export default function UsersIndex({ user, users, roles, filters }) {
    const [globalFilter, setGlobalFilter] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.is_active ?? '');
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const toast = useRef(null);
    const { hasPermission } = usePermissions();

    const statusOptions = [
        { label: 'Todos los estados', value: '' },
        { label: 'Activos', value: 1 },
        { label: 'Inactivos', value: 0 }
    ];

    const roleOptions = [
        { label: 'Todos los roles', value: '' },
        ...roles.map(role => ({ label: role.display_name, value: role.name }))
    ];

    const handleFilter = () => {
        router.get('/admin/users', {
            search: globalFilter,
            role: selectedRole,
            is_active: selectedStatus === '' ? undefined : selectedStatus
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setGlobalFilter('');
        setSelectedRole('');
        setSelectedStatus('');
        router.get('/admin/users', {}, {
            preserveState: true,
            replace: true
        });
    };

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setDeleteDialog(true);
    };

    const deleteUser = () => {
        router.delete(`/admin/users/${userToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialog(false);
                setUserToDelete(null);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Usuario eliminado exitosamente'
                });
            },
            onError: () => {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al eliminar usuario'
                });
            }
        });
    };

    const toggleUserStatus = (userData) => {
        router.patch(`/admin/users/${userData.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                const status = userData.is_active ? 'desactivado' : 'activado';
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Usuario ${status} exitosamente`
                });
            }
        });
    };

    const avatarTemplate = (rowData) => {
        if (rowData.avatar) {
            return <Avatar image={rowData.avatar} size="normal" shape="circle" />;
        }
        return (
            <Avatar
                label={rowData.name.charAt(0).toUpperCase()}
                size="normal"
                shape="circle"
                style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
            />
        );
    };

    const nameTemplate = (rowData) => (
        <div className="flex items-center gap-2">
            {avatarTemplate(rowData)}
            <div>
                <div className="font-semibold">{rowData.name}</div>
                <div className="text-sm text-gray-500">{rowData.email}</div>
            </div>
        </div>
    );

    const rolesTemplate = (rowData) => (
        <div className="flex flex-wrap gap-1">
            {rowData.roles.map((role) => (
                <Tag
                    key={role.id}
                    value={role.display_name}
                    severity="info"
                    className="text-xs"
                />
            ))}
        </div>
    );

    const statusTemplate = (rowData) => (
        <Tag
            value={rowData.is_active ? 'Activo' : 'Inactivo'}
            severity={rowData.is_active ? 'success' : 'danger'}
        />
    );

    const lastLoginTemplate = (rowData) => {
        if (!rowData.last_login) return 'Nunca';
        return new Date(rowData.last_login).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const actionsTemplate = (rowData) => (
        <div className="flex gap-2">
            <PermissionGate permission="admin.manage_users">
                <Button
                    icon="pi pi-eye"
                    rounded
                    text
                    severity="info"
                    size="small"
                    onClick={() => router.visit(`/admin/users/${rowData.id}`)}
                    tooltip="Ver detalles"
                />
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="warning"
                    size="small"
                    onClick={() => router.visit(`/admin/users/${rowData.id}/edit`)}
                    tooltip="Editar"
                />
                <Button
                    icon={rowData.is_active ? "pi pi-eye-slash" : "pi pi-eye"}
                    rounded
                    text
                    severity={rowData.is_active ? "warning" : "success"}
                    size="small"
                    onClick={() => toggleUserStatus(rowData)}
                    tooltip={rowData.is_active ? "Desactivar" : "Activar"}
                />
                {!rowData.roles.some(role => role.name === 'super_admin') && rowData.id !== user.id && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        size="small"
                        onClick={() => confirmDelete(rowData)}
                        tooltip="Eliminar"
                    />
                )}
            </PermissionGate>
        </div>
    );

    const header = (
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-2">
                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Buscar usuarios..."
                    className="w-full md:w-80"
                />
                <Dropdown
                    value={selectedRole}
                    options={roleOptions}
                    onChange={(e) => setSelectedRole(e.value)}
                    placeholder="Filtrar por rol"
                    className="w-full md:w-48"
                />
                <Dropdown
                    value={selectedStatus}
                    options={statusOptions}
                    onChange={(e) => setSelectedStatus(e.value)}
                    placeholder="Filtrar por estado"
                    className="w-full md:w-48"
                />
            </div>
            <div className="flex gap-2">
                <Button
                    label="Filtrar"
                    icon="pi pi-search"
                    onClick={handleFilter}
                />
                <Button
                    label="Limpiar"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    onClick={clearFilters}
                />
                <PermissionGate permission="admin.manage_users">
                    <Button
                        label="Nuevo Usuario"
                        icon="pi pi-plus"
                        onClick={() => router.visit('/admin/users/create')}
                    />
                </PermissionGate>
            </div>
        </div>
    );

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <Card className="m-4">
                <div className="flex items-center gap-3 mb-6">
                    <i className="pi pi-users text-3xl text-blue-600"></i>
                    <div>
                        <h1 className="text-2xl font-bold m-0">Gestión de Usuarios</h1>
                        <p className="text-gray-600 text-sm m-0">Administrar usuarios y sus permisos del sistema</p>
                    </div>
                </div>

                <DataTable
                    value={users.data}
                    paginator
                    rows={15}
                    dataKey="id"
                    header={header}
                    emptyMessage="No se encontraron usuarios"
                    className="p-datatable-sm"
                >
                    <Column field="name" header="Usuario" body={nameTemplate} />
                    <Column field="roles" header="Roles" body={rolesTemplate} />
                    <Column field="is_active" header="Estado" body={statusTemplate} />
                    <Column field="last_login" header="Último Acceso" body={lastLoginTemplate} />
                    <Column field="created_at" header="Creado" body={(data) => new Date(data.created_at).toLocaleDateString('es-ES')} />
                    <Column body={actionsTemplate} header="Acciones" style={{ width: '200px' }} />
                </DataTable>
            </Card>

            {/* Delete Dialog */}
            <Dialog
                header="Confirmar Eliminación"
                visible={deleteDialog}
                style={{ width: '450px' }}
                modal
                footer={(
                    <div className="flex justify-end gap-2">
                        <Button label="Cancelar" severity="secondary" onClick={() => setDeleteDialog(false)} />
                        <Button label="Eliminar" severity="danger" onClick={deleteUser} />
                    </div>
                )}
                onHide={() => setDeleteDialog(false)}
            >
                {userToDelete && (
                    <div className="flex items-center gap-3">
                        <i className="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
                        <div>
                            <p>¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.name}</strong>?</p>
                            <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
                        </div>
                    </div>
                )}
            </Dialog>
        </AppLayout>
    );
}
