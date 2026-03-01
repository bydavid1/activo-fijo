import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function About({ user }) {
    const features = [
        {
            category: "Gestión de Activos",
            icon: "pi pi-box",
            color: "text-blue-600",
            items: [
                "Registro completo de activos fijos con código único",
                "Gestión de categorías y tipos de bienes personalizados",
                "Propiedades personalizadas por tipo de activo",
                "Información detallada: marca, modelo, serie, ubicación",
                "Gestión de responsables y proveedores",
                "Múltiples tipos de adquisición (compra, donación, etc.)",
                "Sistema de archivos adjuntos (fotos, facturas, garantías)",
                "Códigos QR automáticos para identificación"
            ]
        },
        {
            category: "Depreciación Automática",
            icon: "pi pi-chart-line",
            color: "text-green-600",
            items: [
                "Cálculo automático de depreciación mensual/anual",
                "Métodos: Línea recta, acelerada, unidades producidas",
                "Aplicación de regla del día 15",
                "Historial completo de depreciaciones",
                "Valores en tiempo real: compra, residual, libros",
                "Seguimiento de vida útil transcurrida",
                "Reportes de depreciación por período"
            ]
        },
        {
            category: "Movimientos y Trazabilidad",
            icon: "pi pi-history",
            color: "text-orange-600",
            items: [
                "Registro de movimientos: traslados, préstamos, devoluciones",
                "Historial completo de ubicaciones",
                "Trazabilidad de responsables",
                "Control de estados: activo, mantenimiento, retirado",
                "Documentación de motivos y observaciones",
                "Auditoría completa de cambios"
            ]
        },
        {
            category: "Mantenimiento",
            icon: "pi pi-wrench",
            color: "text-purple-600",
            items: [
                "Órdenes de mantenimiento preventivo y correctivo",
                "Asignación a técnicos especializados",
                "Control de estados y fechas",
                "Seguimiento de costos y materiales",
                "Programación de mantenimientos",
                "Historial de intervenciones"
            ]
        },
        {
            category: "Inventarios y Auditorías",
            icon: "pi pi-list-check",
            color: "text-red-600",
            items: [
                "Auditorías periódicas de inventario",
                "Comparación de datos esperados vs encontrados",
                "Estados flexibles: borrador, en progreso, completada",
                "Identificación de discrepancias",
                "Reportes de hallazgos",
                "Control de ubicaciones"
            ]
        },
        {
            category: "Revaluaciones",
            icon: "pi pi-dollar",
            color: "text-indigo-600",
            items: [
                "Revalorización de activos",
                "Ajustes por deterioro",
                "Ajustes por inflación",
                "Tasaciones profesionales",
                "Documentación de peritos",
                "Historial de cambios de valor"
            ]
        },
        {
            category: "Reportes y Análisis",
            icon: "pi pi-chart-bar",
            color: "text-teal-600",
            items: [
                "Listado completo de activos con filtros",
                "Reportes de depreciación por período",
                "Análisis de movimientos",
                "Estados consolidados",
                "Exportación a Excel y PDF",
                "Dashboards interactivos"
            ]
        },
        {
            category: "Gestión de Personal",
            icon: "pi pi-users",
            color: "text-pink-600",
            items: [
                "Registro de empleados responsables",
                "Asignación de activos por persona",
                "Control de responsabilidades",
                "Seguimiento de cambios de responsable",
                "Información de contacto completa"
            ]
        }
    ];

    const technicalSpecs = [
        { label: "Frontend", value: "React + Inertia.js + PrimeReact" },
        { label: "Backend", value: "Laravel 11 + PHP 8.2" },
        { label: "Base de Datos", value: "MySQL con migraciones" },
        { label: "Autenticación", value: "Laravel Auth integrado" },
        { label: "UI/UX", value: "Responsive design + Tailwind CSS" },
        { label: "Arquitectura", value: "Modular (Assets, Maintenance, Inventory)" },
        { label: "Testing", value: "PHPUnit + Seeders completos" },
        { label: "Storage", value: "Sistema de archivos con enlaces simbólicos" }
    ];

    const benefits = [
        {
            title: "Control Total",
            description: "Gestión centralizada de todos los activos fijos de la organización",
            icon: "pi pi-shield"
        },
        {
            title: "Cumplimiento",
            description: "Cumplimiento de normas contables y regulaciones fiscales",
            icon: "pi pi-verified"
        },
        {
            title: "Eficiencia",
            description: "Automatización de cálculos y procesos manuales",
            icon: "pi pi-bolt"
        },
        {
            title: "Transparencia",
            description: "Trazabilidad completa y auditoría de todas las operaciones",
            icon: "pi pi-eye"
        },
        {
            title: "Escalabilidad",
            description: "Sistema modular que crece con las necesidades organizacionales",
            icon: "pi pi-expand"
        },
        {
            title: "Integración",
            description: "APIs preparadas para integración con otros sistemas empresariales",
            icon: "pi pi-link"
        }
    ];

    return (
        <AppLayout user={user}>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 mb-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">
                            Sistema de Activos Fijos
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 opacity-90">
                            Solución integral para la gestión, control y seguimiento de activos organizacionales
                        </p>
                        {/* 🔸 CAPTURA 1: Agregar aquí screenshot del dashboard principal */}
                        <div className="bg-white/10 rounded-lg p-4 mb-6">
                            <p className="text-sm opacity-75">📸 Captura del Dashboard Principal</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <Button
                                label="Ver Dashboard"
                                icon="pi pi-chart-line"
                                className="p-button-lg bg-white text-blue-600 border-0"
                                onClick={() => router.visit('/')}
                            />
                            <Button
                                label="Gestionar Activos"
                                icon="pi pi-box"
                                className="p-button-lg p-button-outlined text-white border-white"
                                onClick={() => router.visit('/assets')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <Card className="mx-4 mb-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">¿Por qué elegir nuestro sistema?</h2>
                    <p className="text-gray-600 text-lg">Una solución completa y moderna para el control de activos fijos</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="text-center p-6 hover:shadow-lg transition-shadow rounded-lg">
                            <div className="mb-4">
                                <i className={`${benefit.icon} text-4xl text-blue-600`}></i>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                            <p className="text-gray-600">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Features Section */}
            <Card className="mx-4 mb-8">
                <h2 className="text-3xl font-bold mb-8 text-center">Funcionalidades del Sistema</h2>
                <div className="grid gap-8">
                    {features.map((feature, index) => (
                        <div key={index}>
                            <div className="flex items-center gap-3 mb-4">
                                <i className={`${feature.icon} text-2xl ${feature.color}`}></i>
                                <h3 className="text-2xl font-bold">{feature.category}</h3>
                            </div>

                            {/* 🔸 CAPTURA: Agregar aquí screenshots específicos de cada módulo */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-500 text-center">
                                    📸 Agregar captura de: {feature.category}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {feature.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-start gap-2">
                                        <i className="pi pi-check text-green-600 mt-1"></i>
                                        <span className="text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                            {index < features.length - 1 && <Divider className="my-8" />}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Technical Specifications */}
            <Card className="mx-4 mb-8">
                <h2 className="text-3xl font-bold mb-8 text-center">Especificaciones Técnicas</h2>

                {/* 🔸 CAPTURA 2: Agregar aquí screenshot de la arquitectura o código */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 mb-6">
                    <p className="text-center text-gray-600 mb-2">📸 Captura de Arquitectura del Sistema</p>
                    <p className="text-sm text-gray-500 text-center">
                        (Mostrar estructura de módulos, base de datos o código representativo)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {technicalSpecs.map((spec, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <span className="font-semibold text-gray-700">{spec.label}:</span>
                            <Tag value={spec.value} className="bg-blue-100 text-blue-800" />
                        </div>
                    ))}
                </div>
            </Card>

            {/* Key Features Highlights */}
            <Card className="mx-4 mb-8">
                <h2 className="text-3xl font-bold mb-8 text-center">Características Destacadas</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* QR Codes */}
                    <div className="text-center">
                        <i className="pi pi-qrcode text-6xl text-blue-600 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">Códigos QR Automáticos</h3>
                        <p className="text-gray-600 mb-4">
                            Generación automática de códigos QR para identificación rápida de activos en campo
                        </p>
                        {/* 🔸 CAPTURA 3: Screenshot de código QR generado */}
                        <div className="bg-gray-100 rounded-lg p-4">
                            <p className="text-sm text-gray-500">📸 Ejemplo de código QR generado</p>
                        </div>
                    </div>

                    {/* Responsive Design */}
                    <div className="text-center">
                        <i className="pi pi-mobile text-6xl text-green-600 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">Diseño Responsivo</h3>
                        <p className="text-gray-600 mb-4">
                            Interfaz adaptativa que funciona perfectamente en escritorio, tablets y dispositivos móviles
                        </p>
                        {/* 🔸 CAPTURA 4: Screenshots en diferentes dispositivos */}
                        <div className="bg-gray-100 rounded-lg p-4">
                            <p className="text-sm text-gray-500">📸 Vista en móvil/tablet</p>
                        </div>
                    </div>

                    {/* Real-time Calculations */}
                    <div className="text-center">
                        <i className="pi pi-calculator text-6xl text-purple-600 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">Cálculos en Tiempo Real</h3>
                        <p className="text-gray-600 mb-4">
                            Depreciación, valores en libros y análisis financiero actualizados automáticamente
                        </p>
                        {/* 🔸 CAPTURA 5: Screenshot de la sección de depreciación */}
                        <div className="bg-gray-100 rounded-lg p-4">
                            <p className="text-sm text-gray-500">📸 Panel de depreciación con gráficos</p>
                        </div>
                    </div>

                    {/* File Management */}
                    <div className="text-center">
                        <i className="pi pi-folder text-6xl text-orange-600 mb-4"></i>
                        <h3 className="text-xl font-bold mb-4">Gestión de Archivos</h3>
                        <p className="text-gray-600 mb-4">
                            Sistema completo para adjuntar fotos, facturas, garantías y documentos relacionados
                        </p>
                        {/* 🔸 CAPTURA 6: Screenshot del modal de archivos */}
                        <div className="bg-gray-100 rounded-lg p-4">
                            <p className="text-sm text-gray-500">📸 Gestión de archivos adjuntos</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Reports Preview */}
            <Card className="mx-4 mb-8">
                <h2 className="text-3xl font-bold mb-8 text-center">Sistema de Reportes</h2>
                <div className="text-center mb-6">
                    <p className="text-gray-600 text-lg">
                        Genera reportes detallados en Excel y PDF para análisis y presentaciones
                    </p>
                </div>

                {/* 🔸 CAPTURA 7: Screenshots de reportes generados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-6 text-center">
                        <i className="pi pi-file-excel text-4xl text-green-600 mb-2"></i>
                        <h4 className="font-bold mb-2">Reportes Excel</h4>
                        <p className="text-sm text-gray-600">📸 Ejemplo de reporte Excel generado</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-6 text-center">
                        <i className="pi pi-file-pdf text-4xl text-red-600 mb-2"></i>
                        <h4 className="font-bold mb-2">Reportes PDF</h4>
                        <p className="text-sm text-gray-600">📸 Ejemplo de reporte PDF generado</p>
                    </div>
                </div>

                <div className="text-center">
                    <Button
                        label="Ver Reportes"
                        icon="pi pi-chart-bar"
                        onClick={() => router.visit('/reports')}
                    />
                </div>
            </Card>

            {/* Call to Action */}
            <Card className="mx-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-center py-8">
                    <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
                    <p className="text-gray-600 text-lg mb-8">
                        Descubre todas las funcionalidades navegando por el sistema
                    </p>

                    {/* 🔸 CAPTURA 8: Screenshot del menú principal/navegación */}
                    <div className="bg-white rounded-lg p-6 mb-6 mx-auto max-w-md">
                        <p className="text-sm text-gray-500">📸 Menú de navegación principal</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Button
                            label="Dashboard Principal"
                            icon="pi pi-home"
                            className="p-button-lg"
                            onClick={() => router.visit('/')}
                        />
                        <Button
                            label="Gestión de Activos"
                            icon="pi pi-box"
                            className="p-button-lg p-button-outlined"
                            onClick={() => router.visit('/assets')}
                        />
                        <Button
                            label="Ver Reportes"
                            icon="pi pi-chart-bar"
                            className="p-button-lg p-button-secondary"
                            onClick={() => router.visit('/reports')}
                        />
                    </div>
                </div>
            </Card>

            {/* Footer Info */}
            <div className="text-center py-8 text-gray-500">
                <p>Sistema de Activos Fijos - Desarrollado con Laravel, React e Inertia.js</p>
                <p className="text-sm mt-2">© 2026 - Gestión Integral de Activos Organizacionales</p>
            </div>
        </AppLayout>
    );
}
