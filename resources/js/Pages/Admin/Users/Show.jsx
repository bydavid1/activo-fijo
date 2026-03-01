import React from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';

export default function Show({ user }) {
    const getUserStatus = () => {
        return user.is_active ?
            <Badge value="Activo" severity="success" /> :
            <Badge value="Inactivo" severity="danger" />;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout
            title={`Usuario: ${user.name}`}
            breadcrumb={[
                { label: 'Inicio', url: '/' },
                { label: 'Usuarios', url: '/admin/users' },
                { label: user.name }
            ]}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Perfil de Usuario
                    </h1>
                    <div className="flex gap-3">
                        <Button
                            label="Editar"
                            icon="pi pi-pencil"
                            onClick={() => window.location.href = `/admin/users/${user.id}/edit`}
                        />
                        <Button
                            label="Volver"
                            icon="pi pi-arrow-left"
                            severity="secondary"
                            onClick={() => window.history.back()}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información Personal */}
                    <div className="lg:col-span-2">
                        <Card title="Información Personal" className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre Completo
                                    </label>
                                    <p className="text-gray-900 font-medium">{user.name}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Correo Electrónico
                                    </label>
                                    <p className="text-gray-900">{user.email}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estado
                                    </label>
                                    <div>{getUserStatus()}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de Registro
                                    </label>
                                    <p className="text-gray-900">{formatDate(user.created_at)}</p>
                                </div>

                                {user.updated_at !== user.created_at && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Última Actualización
                                        </label>
                                        <p className="text-gray-900">{formatDate(user.updated_at)}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Permisos */}
                        {user.all_permissions && user.all_permissions.length > 0 && (
                            <Card title="Todos los Permisos">
                                <div className="flex flex-wrap gap-2">
                                    {user.all_permissions.map((permission, index) => (
                                        <Chip
                                            key={index}
                                            label={permission.display_name || permission.name}
                                            className="bg-blue-100 text-blue-800"
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Panel Lateral */}
                    <div>
                        {/* Roles */}
                        <Card title="Roles Asignados" className="mb-6">
                            {user.roles && user.roles.length > 0 ? (
                                <div className="space-y-3">
                                    {user.roles.map((role, index) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-gray-900">
                                                {role.display_name}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {role.description}
                                            </p>
                                            {role.permissions && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {role.permissions.length} permisos
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Sin roles asignados</p>
                            )}
                        </Card>

                        {/* Estadísticas */}
                        <Card title="Estadísticas">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Roles:</span>
                                    <Badge value={user.roles?.length || 0} severity="info" />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Permisos totales:</span>
                                    <Badge value={user.all_permissions?.length || 0} severity="success" />
                                </div>

                                <Divider />

                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Usuario desde {formatDate(user.created_at).split(',')[0]}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
