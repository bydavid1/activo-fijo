import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

// Componente de item de menú personalizado
const MenuItem = ({ item, collapsed, onNavigate }) => {
    const hasSubItems = item.items && item.items.length > 0;

    const handleClick = () => {
        if (item.href) {
            onNavigate?.();
            window.location.href = item.href;
        }
    };

    // Si tiene subitems, mostrar como grupo siempre expandido
    if (hasSubItems) {
        return (
            <div className="mb-2">
                {!collapsed && (
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.label}
                    </p>
                )}
                <div className={collapsed ? '' : 'ml-2'}>
                    {item.items.map((subItem, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                onNavigate?.();
                                window.location.href = subItem.href;
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg transition-all duration-200
                                hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm
                                ${collapsed ? 'justify-center px-2' : ''}`}
                            title={collapsed ? subItem.label : undefined}
                        >
                            {collapsed && <i className={`${item.icon} text-base`}></i>}
                            {!collapsed && subItem.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Item normal sin subitems
    return (
        <div className="mb-1">
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200
                    hover:bg-blue-50 hover:text-blue-600 text-gray-700
                    ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
            >
                <i className={`${item.icon} text-lg`}></i>
                {!collapsed && (
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                )}
            </button>
        </div>
    );
};

export default function AppLayout({ children, user }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const toast = useRef(null);

    // Detectar tamaño de pantalla
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const menuItems = [
        {
            label: 'Dashboard',
            icon: 'pi pi-home',
            href: '/',
        },
        {
            label: 'Activos',
            icon: 'pi pi-box',
            items: [
                { label: 'Listar', href: '/assets' },
                { label: 'Crear', href: '/assets/create' },
            ]
        },
        {
            label: 'Movimientos',
            icon: 'pi pi-arrow-right-arrow-left',
            href: '/movements',
        },
        {
            label: 'Empleados',
            icon: 'pi pi-users',
            href: '/employees',
        },
        {
            label: 'Inventario',
            icon: 'pi pi-check-square',
            href: '/inventory-audits',
        },
        {
            label: 'Mantenimiento',
            icon: 'pi pi-wrench',
            href: '/maintenance',
        },
        {
            label: 'Administración',
            icon: 'pi pi-cog',
            items: [
                { label: 'Tipos de Bien', href: '/asset-types' },
                { label: 'Categorías', href: '/categories' },
                { label: 'Ubicaciones', href: '/locations' },
                { label: 'Proveedores', href: '/suppliers' },
            ]
        },
        {
            label: 'Reportes',
            icon: 'pi pi-chart-bar',
            href: '/reports',
        },
    ];

    const handleLogout = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/logout';
        form.innerHTML = `<input type="hidden" name="_token" value="${document.querySelector('meta[name="csrf-token"]').content}">`;
        document.body.appendChild(form);
        form.submit();
    };

    const SidebarContent = ({ onNavigate, collapsed = false }) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`p-4 border-b border-gray-200 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && <h1 className="text-xl font-bold text-blue-600">Activo Fijo</h1>}
                {!isMobile && (
                    <Button
                        icon={collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'}
                        className="p-button-rounded p-button-text p-button-sm"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-2">
                {menuItems.map((item, idx) => (
                    <MenuItem
                        key={idx}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-gray-200">
                <div className={`flex items-center gap-3 mb-2 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>
                <Button
                    label={collapsed ? '' : 'Cerrar Sesión'}
                    icon="pi pi-sign-out"
                    className={`w-full p-button-danger p-button-sm text-sm ${collapsed ? 'p-button-icon-only' : ''}`}
                    onClick={handleLogout}
                    tooltip={collapsed ? 'Cerrar Sesión' : undefined}
                    tooltipOptions={{ position: 'right' }}
                />
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            <Toast ref={toast} />

            {/* Mobile Header */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-14 bg-white shadow-md z-50 flex items-center justify-between px-4">
                    <Button
                        icon="pi pi-bars"
                        className="p-button-rounded p-button-text"
                        onClick={() => setMobileSidebarVisible(true)}
                    />
                    <h1 className="text-lg font-bold text-blue-600">Activo Fijo</h1>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                </div>
            )}

            {/* Mobile Sidebar (Overlay) */}
            {isMobile && (
                <Sidebar
                    visible={mobileSidebarVisible}
                    onHide={() => setMobileSidebarVisible(false)}
                    className="w-72"
                    showCloseIcon={true}
                    pt={{
                        root: { className: 'p-0' },
                        header: { className: 'p-2' },
                        content: { className: 'p-0 h-full' },
                        closeButton: { className: 'w-8 h-8' }
                    }}
                >
                    <SidebarContent onNavigate={() => setMobileSidebarVisible(false)} />
                </Sidebar>
            )}

            {/* Desktop Sidebar (Fixed) */}
            {!isMobile && (
                <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transition-all duration-300 flex-shrink-0`}>
                    <SidebarContent collapsed={sidebarCollapsed} />
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}>
                <div className="p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
