import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

export default function AppLayout({ children, user }) {
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const toast = useRef(null);

    const menuItems = [
        {
            label: 'Dashboard',
            icon: 'pi pi-fw pi-home',
            command: () => window.location.href = '/',
        },
        {
            label: 'Activos',
            icon: 'pi pi-fw pi-box',
            items: [
                { label: 'Listar', command: () => window.location.href = '/assets' },
                { label: 'Crear', command: () => window.location.href = '/assets/create' },
            ]
        },
        {
            label: 'Movimientos',
            icon: 'pi pi-fw pi-arrow-right-arrow-left',
            command: () => window.location.href = '/movements',
        },
        {
            label: 'Empleados',
            icon: 'pi pi-fw pi-users',
            command: () => window.location.href = '/employees',
        },
        {
            label: 'Inventario',
            icon: 'pi pi-fw pi-check-square',
            items: [
                { label: 'Gestión General', command: () => window.location.href = '/inventory' },
                { label: 'Levantamientos', icon: 'pi pi-camera', command: () => window.location.href = '/inventory-audits' },
            ]
        },
        {
            label: 'Mantenimiento',
            icon: 'pi pi-fw pi-wrench',
            command: () => window.location.href = '/maintenance',
        },
        {
            label: 'Administración',
            icon: 'pi pi-fw pi-cog',
            items: [
                { label: 'Tipos de Bien', command: () => window.location.href = '/asset-types' },
                { label: 'Categorías', command: () => window.location.href = '/categories' },
                { label: 'Ubicaciones', command: () => window.location.href = '/locations' },
                { label: 'Proveedores', command: () => window.location.href = '/suppliers' },
            ]
        },
        {
            label: 'Reportes',
            icon: 'pi pi-fw pi-chart-bar',
            command: () => window.location.href = '/reports',
        },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            <Toast ref={toast} />

            {/* Sidebar */}
            <div className={`${sidebarVisible ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    {sidebarVisible && <h1 className="text-xl font-bold text-blue-600">Activo Fijo</h1>}
                    <Button
                        icon={sidebarVisible ? 'pi pi-angle-left' : 'pi pi-angle-right'}
                        className="p-button-rounded p-button-text"
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                    />
                </div>

                <Menu model={menuItems} className="flex-1 border-none p-0" />

                <div className="p-4 border-t border-gray-200 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        {sidebarVisible && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    <Button
                        label={sidebarVisible ? "Cerrar Sesión" : ""}
                        icon="pi pi-sign-out"
                        className="w-full p-button-rounded p-button-danger mt-3"
                        onClick={() => {
                            // Crear un formulario para submit del logout
                            const form = document.createElement('form');
                            form.method = 'POST';
                            form.action = '/logout';
                            form.innerHTML = `<input type="hidden" name="_token" value="${document.querySelector('meta[name="csrf-token"]').content}">`;
                            document.body.appendChild(form);
                            form.submit();
                        }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
