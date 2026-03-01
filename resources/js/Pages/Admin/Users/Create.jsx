import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';

export default function Create({ roles = [] }) {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
        is_active: true
    });

    const statusOptions = [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/users');
    };

    const roleOptions = roles.map(role => ({
        label: role.display_name,
        value: role.id
    }));

    return (
        <AppLayout
            title="Crear Usuario"
            breadcrumb={[
                { label: 'Inicio', url: '/' },
                { label: 'Usuarios', url: '/admin/users' },
                { label: 'Crear' }
            ]}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Crear Usuario</h1>
                    <Button
                        label="Volver"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        onClick={() => window.history.back()}
                    />
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Nombre Completo *
                                </label>
                                <InputText
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ingrese el nombre completo"
                                    className={`w-full ${errors.name ? 'p-invalid' : ''}`}
                                />
                                {errors.name && (
                                    <Message severity="error" text={errors.name} className="mt-2" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Correo Electrónico *
                                </label>
                                <InputText
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Ingrese el correo electrónico"
                                    className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                                />
                                {errors.email && (
                                    <Message severity="error" text={errors.email} className="mt-2" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Contraseña *
                                </label>
                                <Password
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Ingrese la contraseña"
                                    className={`w-full ${errors.password ? 'p-invalid' : ''}`}
                                    toggleMask
                                    feedback={false}
                                />
                                {errors.password && (
                                    <Message severity="error" text={errors.password} className="mt-2" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Confirmar Contraseña *
                                </label>
                                <Password
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Confirme la contraseña"
                                    className={`w-full ${errors.password_confirmation ? 'p-invalid' : ''}`}
                                    toggleMask
                                    feedback={false}
                                />
                                {errors.password_confirmation && (
                                    <Message severity="error" text={errors.password_confirmation} className="mt-2" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Roles
                                </label>
                                <MultiSelect
                                    value={data.roles}
                                    onChange={(e) => setData('roles', e.value)}
                                    options={roleOptions}
                                    placeholder="Seleccionar roles"
                                    className={`w-full ${errors.roles ? 'p-invalid' : ''}`}
                                    display="chip"
                                    showClear
                                />
                                {errors.roles && (
                                    <Message severity="error" text={errors.roles} className="mt-2" />
                                )}
                                <small className="text-gray-500">
                                    Seleccione uno o más roles para el usuario
                                </small>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Estado
                                </label>
                                <Dropdown
                                    value={data.is_active}
                                    onChange={(e) => setData('is_active', e.value)}
                                    options={statusOptions}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <Button
                                type="button"
                                label="Cancelar"
                                severity="secondary"
                                onClick={() => window.history.back()}
                            />
                            <Button
                                type="submit"
                                label="Crear Usuario"
                                icon="pi pi-check"
                                loading={processing}
                            />
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
