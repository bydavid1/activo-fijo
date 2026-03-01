import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';
import { router } from '@inertiajs/react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const Reports = ({ user }) => {
    // Leer el reporte de la URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const initialReport = urlParams.get('report') || null;

    const [selectedReport, setSelectedReport] = useState(initialReport);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showResults, setShowResults] = useState(!!initialReport);
    const toast = useRef(null);

    // Filtros
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [categoriaId, setCategoriaId] = useState(null);
    const [ubicacionId, setUbicacionId] = useState(null);
    const [estadoFiltro, setEstadoFiltro] = useState(null);

    // Opciones para filtros
    const [categorias, setCategorias] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

    // Categorías de reportes
    const reportCategories = [
        {
            title: 'Activos',
            icon: 'pi pi-box',
            color: 'bg-indigo-500',
            reports: [
                { label: 'Lista de Activos', value: 'asset-list', icon: 'pi pi-list', description: 'Listado completo con valores y depreciación' },
                { label: 'Depreciación', value: 'depreciation', icon: 'pi pi-chart-line', description: 'Análisis de depreciación por activo' },
                { label: 'Bajas y Adquisiciones', value: 'dispositions-acquisitions', icon: 'pi pi-sync', description: 'Historial de altas y bajas' },
            ]
        },
        {
            title: 'Análisis de Valor',
            icon: 'pi pi-dollar',
            color: 'bg-green-500',
            reports: [
                { label: 'Valor por Responsable', value: 'value-responsible', icon: 'pi pi-users', description: 'Distribución de valor por persona' },
                { label: 'Valor por Ubicación', value: 'value-location', icon: 'pi pi-map-marker', description: 'Distribución de valor por ubicación' },
                { label: 'Resumen General', value: 'summary', icon: 'pi pi-chart-pie', description: 'Dashboard con métricas clave' },
            ]
        },
        {
            title: 'Operaciones',
            icon: 'pi pi-cog',
            color: 'bg-amber-500',
            reports: [
                { label: 'Movimientos', value: 'movements', icon: 'pi pi-arrows-h', description: 'Transferencias y cambios de ubicación' },
                { label: 'Ventas de Activos', value: 'sales', icon: 'pi pi-shopping-cart', description: 'Historial de ventas y compradores' },
                { label: 'Mantenimiento', value: 'maintenance', icon: 'pi pi-wrench', description: 'Órdenes de trabajo y costos' },
            ]
        },
        {
            title: 'Inventario',
            icon: 'pi pi-clipboard',
            color: 'bg-purple-500',
            reports: [
                { label: 'Auditorías de Inventario', value: 'inventory-audits', icon: 'pi pi-search', description: 'Resultados de auditorías realizadas' },
                { label: 'Discrepancias', value: 'discrepancies', icon: 'pi pi-exclamation-triangle', description: 'Diferencias encontradas' },
            ]
        }
    ];

    // Obtener todas las opciones de reportes
    const allReports = reportCategories.flatMap(cat => cat.reports);

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        if (selectedReport && showResults) {
            fetchReport();
        }
    }, [selectedReport, showResults]);

    // Actualizar URL cuando cambia el reporte
    useEffect(() => {
        if (selectedReport && showResults) {
            const newUrl = `${window.location.pathname}?report=${selectedReport}`;
            window.history.replaceState({}, '', newUrl);
        } else if (!showResults) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [selectedReport, showResults]);

    const fetchOptions = async () => {
        setOptionsLoading(true);
        try {
            const response = await axios.get('/api/reports/options');
            setCategorias(response.data.categorias || []);
            setUbicaciones(response.data.ubicaciones || []);
        } catch (error) {
            console.error('Error cargando opciones:', error);
            // Intentar cargar desde assets/options como fallback
            try {
                const fallback = await axios.get('/api/assets/options');
                setCategorias(fallback.data.categorias || []);
                setUbicaciones(fallback.data.ubicaciones || []);
            } catch (e) {
                console.error('Fallback también falló:', e);
            }
        } finally {
            setOptionsLoading(false);
        }
    };

    const fetchReport = async () => {
        if (!selectedReport) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fechaInicio) params.append('fecha_desde', fechaInicio.toISOString().split('T')[0]);
            if (fechaFin) params.append('fecha_hasta', fechaFin.toISOString().split('T')[0]);
            if (categoriaId) params.append('categoria_id', categoriaId);
            if (ubicacionId) params.append('ubicacion_id', ubicacionId);
            if (estadoFiltro) params.append('estado', estadoFiltro);

            const response = await axios.get(`/api/reports/${selectedReport}?${params.toString()}`);
            setReportData(response.data.data ?? response.data ?? []);
        } catch (error) {
            console.error('Error cargando reporte:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error cargando reporte', life: 3000 });
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        if (!selectedReport) {
            toast.current?.show({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona un reporte primero', life: 3000 });
            return;
        }

        setExporting(true);
        try {
            const params = {};
            if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            if (fechaFin) params.fecha_fin = fechaFin.toISOString().split('T')[0];
            if (categoriaId) params.categoria_id = categoriaId;
            if (ubicacionId) params.ubicacion_id = ubicacionId;

            const response = await axios.post('/api/reports/export', {
                tipo: selectedReport,
                formato: format,
                filtros: params
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = format === 'excel' ? 'xlsx' : 'pdf';
            const reportName = allReports.find(r => r.value === selectedReport)?.label || selectedReport;
            link.setAttribute('download', `${reportName}_${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `Reporte exportado como ${format.toUpperCase()}`, life: 3000 });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error exportando reporte', life: 3000 });
        } finally {
            setExporting(false);
        }
    };

    const handleSelectReport = (reportValue) => {
        setSelectedReport(reportValue);
        setShowResults(true);
    };

    const handleBack = () => {
        setShowResults(false);
        setReportData(null);
        setSelectedReport(null);
        window.history.replaceState({}, '', window.location.pathname);
    };

    const clearFilters = () => {
        setFechaInicio(null);
        setFechaFin(null);
        setCategoriaId(null);
        setUbicacionId(null);
        setEstadoFiltro(null);
    };

    const formatCurrency = (value) => {
        return `$${(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatDate = (value) => {
        if (!value) return '-';
        try {
            return new Date(value).toLocaleDateString('es-CO');
        } catch {
            return value;
        }
    };

    const formatPercent = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const estadoBodyTemplate = (rowData, field = 'estado') => {
        const estado = rowData[field];
        if (!estado) return '-';
        const severityMap = {
            'activo': 'success',
            'en_uso': 'success',
            'completado': 'success',
            'completada': 'success',
            'en_proceso': 'info',
            'en_progreso': 'info',
            'pendiente': 'warning',
            'programado': 'warning',
            'en_mantenimiento': 'info',
            'dado_de_baja': 'danger',
            'cancelado': 'danger',
            'cancelada': 'danger',
        };
        return <Tag value={estado?.replace(/_/g, ' ')} severity={severityMap[estado] || 'secondary'} />;
    };

    // ========== Renderizado de Reportes ==========

    const renderAssetList = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <DataTable value={data} paginator rows={10} stripedRows showGridlines
                emptyMessage="No hay activos disponibles" className="text-sm"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                rowsPerPageOptions={[10, 25, 50]}>
                <Column field="codigo" header="Código" sortable style={{ minWidth: '120px' }} />
                <Column field="nombre" header="Nombre" sortable style={{ minWidth: '200px' }} />
                <Column field="categoria" header="Categoría" sortable style={{ minWidth: '150px' }} />
                <Column field="ubicacion" header="Ubicación" sortable style={{ minWidth: '150px' }} />
                <Column field="responsable" header="Responsable" sortable style={{ minWidth: '150px' }} />
                <Column field="valor_compra" header="Valor Compra" body={(row) => formatCurrency(row.valor_compra)} sortable style={{ minWidth: '130px' }} />
                <Column field="depreciacion_acumulada" header="Depreciación" body={(row) => formatCurrency(row.depreciacion_acumulada)} sortable style={{ minWidth: '130px' }} />
                <Column field="valor_en_libros" header="Valor Libros" body={(row) => formatCurrency(row.valor_en_libros)} sortable style={{ minWidth: '130px' }} />
                <Column field="estado" header="Estado" body={(row) => estadoBodyTemplate(row)} sortable style={{ minWidth: '120px' }} />
            </DataTable>
        );
    };

    const renderDepreciation = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        if (data.length === 0) {
            return (
                <div className="text-center py-12">
                    <i className="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No hay datos de depreciación disponibles</p>
                </div>
            );
        }
        return (
            <div className="space-y-6">
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="codigo" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="valor_compra" name="Valor Compra" fill="#6366f1" />
                            <Bar dataKey="depreciacion_acumulada" name="Depreciación" fill="#ef4444" />
                            <Bar dataKey="valor_en_libros" name="Valor Libros" fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <DataTable value={data} paginator rows={10} stripedRows showGridlines emptyMessage="No hay datos">
                    <Column field="codigo" header="Código" sortable />
                    <Column field="nombre" header="Nombre" sortable />
                    <Column field="valor_compra" header="Valor Compra" body={(row) => formatCurrency(row.valor_compra)} sortable />
                    <Column field="depreciacion_acumulada" header="Depreciación" body={(row) => formatCurrency(row.depreciacion_acumulada)} sortable />
                    <Column field="valor_en_libros" header="Valor Libros" body={(row) => formatCurrency(row.valor_en_libros)} sortable />
                    <Column field="porcentaje_depreciado" header="% Depreciado" body={(row) => formatPercent(row.porcentaje_depreciado)} sortable />
                </DataTable>
            </div>
        );
    };

    const renderValueByResponsible = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                <YAxis dataKey="responsable" type="category" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                <Bar dataKey="valor_total" name="Valor Total" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} dataKey="cantidad_activos" nameKey="responsable" cx="50%" cy="50%" outerRadius={100} label>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <DataTable value={data} stripedRows showGridlines emptyMessage="No hay datos">
                    <Column field="responsable" header="Responsable" sortable />
                    <Column field="cantidad_activos" header="Cant. Activos" sortable />
                    <Column field="valor_total" header="Valor Total" body={(row) => formatCurrency(row.valor_total)} sortable />
                    <Column field="valor_en_libros" header="Valor Libros" body={(row) => formatCurrency(row.valor_en_libros)} sortable />
                </DataTable>
            </div>
        );
    };

    const renderValueByLocation = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <div className="space-y-6">
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="ubicacion" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="valor_total" name="Valor Total" fill="#6366f1" />
                            <Bar dataKey="valor_en_libros" name="Valor Libros" fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <DataTable value={data} stripedRows showGridlines emptyMessage="No hay datos">
                    <Column field="ubicacion" header="Ubicación" sortable />
                    <Column field="cantidad_activos" header="Cant. Activos" sortable />
                    <Column field="valor_total" header="Valor Total" body={(row) => formatCurrency(row.valor_total)} sortable />
                    <Column field="valor_en_libros" header="Valor Libros" body={(row) => formatCurrency(row.valor_en_libros)} sortable />
                </DataTable>
            </div>
        );
    };

    const renderMovements = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <DataTable value={data} paginator rows={10} stripedRows showGridlines emptyMessage="No hay movimientos">
                <Column field="fecha" header="Fecha" body={(row) => formatDate(row.fecha)} sortable style={{ minWidth: '100px' }} />
                <Column field="asset_codigo" header="Código" sortable style={{ minWidth: '100px' }} />
                <Column field="asset_nombre" header="Activo" sortable style={{ minWidth: '150px' }} />
                <Column field="tipo" header="Tipo" body={(row) => <Tag value={row.tipo} />} sortable style={{ minWidth: '100px' }} />
                <Column field="ubicacion_anterior" header="Origen" sortable style={{ minWidth: '120px' }} />
                <Column field="ubicacion_nueva" header="Destino" sortable style={{ minWidth: '120px' }} />
                <Column field="motivo" header="Motivo" style={{ minWidth: '150px' }} />
                <Column field="usuario" header="Usuario" sortable style={{ minWidth: '120px' }} />
            </DataTable>
        );
    };

    const renderSales = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <div className="space-y-6">
                {data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-shopping-cart text-3xl text-green-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Total Ventas</p>
                                <p className="text-2xl font-bold text-green-700">{data.length}</p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-dollar text-3xl text-blue-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Valor Total</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatCurrency(data.reduce((sum, r) => sum + (r.precio_venta || 0), 0))}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
                <DataTable value={data} paginator rows={10} stripedRows showGridlines emptyMessage="No hay ventas registradas">
                    <Column field="fecha" header="Fecha" body={(row) => formatDate(row.fecha)} sortable />
                    <Column field="asset_codigo" header="Código" sortable />
                    <Column field="asset_nombre" header="Activo" sortable />
                    <Column field="comprador_nombre" header="Comprador" sortable />
                    <Column field="precio_venta" header="Precio Venta" body={(row) => formatCurrency(row.precio_venta)} sortable />
                    <Column field="valor_libros" header="Valor Libros" body={(row) => formatCurrency(row.valor_libros)} sortable />
                    <Column field="ganancia_perdida" header="Gan/Pérd" body={(row) => (
                        <span className={(row.ganancia_perdida || 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {formatCurrency(row.ganancia_perdida)}
                        </span>
                    )} sortable />
                </DataTable>
            </div>
        );
    };

    const renderMaintenance = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <div className="space-y-6">
                {data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-wrench text-3xl text-indigo-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Total Órdenes</p>
                                <p className="text-2xl font-bold text-indigo-700">{data.length}</p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-dollar text-3xl text-amber-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Costo Total</p>
                                <p className="text-2xl font-bold text-amber-700">
                                    {formatCurrency(data.reduce((sum, r) => sum + (r.costo_real || r.costo_estimado || 0), 0))}
                                </p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-check-circle text-3xl text-green-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Completadas</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {data.filter(r => r.estado === 'completado' || r.estado === 'completada').length}
                                </p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-clock text-3xl text-orange-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold text-orange-700">
                                    {data.filter(r => r.estado === 'pendiente' || r.estado === 'programado').length}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
                <DataTable value={data} paginator rows={10} stripedRows showGridlines emptyMessage="No hay órdenes de mantenimiento">
                    <Column field="numero" header="# Orden" sortable />
                    <Column field="asset_codigo" header="Código" sortable />
                    <Column field="asset_nombre" header="Activo" sortable />
                    <Column field="tipo" header="Tipo" body={(row) => <Tag value={row.tipo} severity={row.tipo === 'preventivo' ? 'info' : 'warning'} />} sortable />
                    <Column field="prioridad" header="Prioridad" body={(row) => (
                        <Tag value={row.prioridad} severity={row.prioridad === 'alta' ? 'danger' : row.prioridad === 'media' ? 'warning' : 'secondary'} />
                    )} sortable />
                    <Column field="fecha_programada" header="Programado" body={(row) => formatDate(row.fecha_programada)} sortable />
                    <Column field="fecha_completado" header="Completado" body={(row) => formatDate(row.fecha_completado)} sortable />
                    <Column field="costo_estimado" header="Costo Est." body={(row) => formatCurrency(row.costo_estimado)} sortable />
                    <Column field="costo_real" header="Costo Real" body={(row) => formatCurrency(row.costo_real)} sortable />
                    <Column field="estado" header="Estado" body={(row) => estadoBodyTemplate(row)} sortable />
                </DataTable>
            </div>
        );
    };

    const renderInventoryAudits = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <div className="space-y-6">
                {data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-search text-3xl text-purple-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Total Auditorías</p>
                                <p className="text-2xl font-bold text-purple-700">{data.length}</p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-check text-3xl text-green-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Completadas</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {data.filter(r => r.estado === 'completado' || r.estado === 'completada').length}
                                </p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-exclamation-triangle text-3xl text-red-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Con Faltantes</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {data.filter(r => (r.faltantes || 0) > 0).length}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
                <DataTable value={data} paginator rows={10} stripedRows showGridlines emptyMessage="No hay auditorías registradas">
                    <Column field="numero" header="# Auditoría" sortable />
                    <Column field="nombre" header="Nombre" sortable />
                    <Column field="fecha_inicio" header="Inicio" body={(row) => formatDate(row.fecha_inicio)} sortable />
                    <Column field="fecha_fin" header="Fin" body={(row) => formatDate(row.fecha_fin)} sortable />
                    <Column field="total_esperados" header="Esperados" sortable />
                    <Column field="total_escaneados" header="Escaneados" sortable />
                    <Column field="encontrados" header="Encontrados" sortable />
                    <Column field="faltantes" header="Faltantes" body={(row) => (
                        <span className={(row.faltantes || 0) > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{row.faltantes || 0}</span>
                    )} sortable />
                    <Column field="porcentaje_completado" header="% Completado" body={(row) => formatPercent(row.porcentaje_completado)} sortable />
                    <Column field="estado" header="Estado" body={(row) => estadoBodyTemplate(row)} sortable />
                </DataTable>
            </div>
        );
    };

    const renderDiscrepancies = () => {
        const data = Array.isArray(reportData) ? reportData : [];
        return (
            <div className="space-y-6">
                {data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-exclamation-triangle text-3xl text-red-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Total Discrepancias</p>
                                <p className="text-2xl font-bold text-red-700">{data.length}</p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-search text-3xl text-orange-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Faltantes</p>
                                <p className="text-2xl font-bold text-orange-700">
                                    {data.filter(r => r.tipo_discrepancia === 'faltante').length}
                                </p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-plus-circle text-3xl text-amber-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Sobrantes</p>
                                <p className="text-2xl font-bold text-amber-700">
                                    {data.filter(r => r.tipo_discrepancia === 'sobrante').length}
                                </p>
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                            <div className="text-center">
                                <i className="pi pi-check-circle text-3xl text-green-600 mb-2"></i>
                                <p className="text-sm text-gray-600">Resueltas</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {data.filter(r => r.estado === 'resuelta').length}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}
                <DataTable value={data} paginator rows={10} stripedRows showGridlines emptyMessage="No hay discrepancias registradas">
                    <Column field="auditoria" header="Auditoría" sortable />
                    <Column field="activo_codigo" header="Código" sortable />
                    <Column field="activo_nombre" header="Activo" sortable />
                    <Column field="tipo_discrepancia" header="Tipo" body={(row) => (
                        <Tag value={row.tipo_discrepancia?.replace(/_/g, ' ') || '-'} severity={row.tipo_discrepancia === 'faltante' ? 'danger' : 'warning'} />
                    )} sortable />
                    <Column field="descripcion" header="Descripción" style={{ maxWidth: '250px' }} />
                    <Column field="estado" header="Estado" body={(row) => estadoBodyTemplate(row)} sortable />
                    <Column field="fecha" header="Fecha" body={(row) => formatDate(row.fecha)} sortable />
                </DataTable>
            </div>
        );
    };

    const renderDispositionsAcquisitions = () => {
        const data = reportData || {};
        const adquisiciones = Array.isArray(data.adquisiciones) ? data.adquisiciones : (Array.isArray(data) ? data : []);
        const bajas = Array.isArray(data.bajas) ? data.bajas : [];
        const resumen = data.resumen || {};

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                        <div className="text-center">
                            <i className="pi pi-plus-circle text-3xl text-blue-600 mb-2"></i>
                            <p className="text-sm text-gray-600">Adquisiciones</p>
                            <p className="text-2xl font-bold text-blue-700">{resumen.total_adquisiciones || adquisiciones.length}</p>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                        <div className="text-center">
                            <i className="pi pi-dollar text-3xl text-green-600 mb-2"></i>
                            <p className="text-sm text-gray-600">Valor Adquirido</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(resumen.valor_adquisiciones || adquisiciones.reduce((s,a) => s + (a.valor_compra||0), 0))}</p>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0">
                        <div className="text-center">
                            <i className="pi pi-minus-circle text-3xl text-red-600 mb-2"></i>
                            <p className="text-sm text-gray-600">Bajas</p>
                            <p className="text-2xl font-bold text-red-700">{resumen.total_bajas || bajas.length}</p>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
                        <div className="text-center">
                            <i className="pi pi-wallet text-3xl text-orange-600 mb-2"></i>
                            <p className="text-sm text-gray-600">Valor Bajas</p>
                            <p className="text-2xl font-bold text-orange-700">{formatCurrency(resumen.valor_bajas)}</p>
                        </div>
                    </Card>
                </div>

                {adquisiciones.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i className="pi pi-plus-circle text-blue-600"></i> Adquisiciones
                        </h3>
                        <DataTable value={adquisiciones} paginator rows={5} stripedRows showGridlines>
                            <Column field="codigo" header="Código" sortable />
                            <Column field="nombre" header="Nombre" sortable />
                            <Column field="categoria" header="Categoría" sortable />
                            <Column field="valor_compra" header="Valor" body={(row) => formatCurrency(row.valor_compra)} sortable />
                            <Column field="fecha_adquisicion" header="Fecha" body={(row) => formatDate(row.fecha_adquisicion)} sortable />
                        </DataTable>
                    </div>
                )}

                {bajas.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i className="pi pi-minus-circle text-red-600"></i> Bajas
                        </h3>
                        <DataTable value={bajas} paginator rows={5} stripedRows showGridlines>
                            <Column field="codigo" header="Código" sortable />
                            <Column field="nombre" header="Nombre" sortable />
                            <Column field="motivo" header="Motivo" />
                            <Column field="fecha_baja" header="Fecha" body={(row) => formatDate(row.fecha_baja || row.fecha)} sortable />
                        </DataTable>
                    </div>
                )}
            </div>
        );
    };

    const renderSummary = () => {
        const data = reportData || {};
        const porCategoria = Array.isArray(data.por_categoria) ? data.por_categoria : [];
        const porEstado = Array.isArray(data.por_estado) ? data.por_estado : [];

        return (
            <div className="space-y-6">
                {/* KPIs principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
                        <div className="text-center">
                            <i className="pi pi-box text-4xl mb-2 opacity-80"></i>
                            <p className="text-sm opacity-80">Total Activos</p>
                            <p className="text-3xl font-bold">{data.total_activos || 0}</p>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <div className="text-center">
                            <i className="pi pi-dollar text-4xl mb-2 opacity-80"></i>
                            <p className="text-sm opacity-80">Valor Total</p>
                            <p className="text-3xl font-bold">{formatCurrency(data.valor_total)}</p>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                        <div className="text-center">
                            <i className="pi pi-chart-line text-4xl mb-2 opacity-80"></i>
                            <p className="text-sm opacity-80">Depreciación</p>
                            <p className="text-3xl font-bold">{formatCurrency(data.depreciacion_total)}</p>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
                        <div className="text-center">
                            <i className="pi pi-book text-4xl mb-2 opacity-80"></i>
                            <p className="text-sm opacity-80">Valor en Libros</p>
                            <p className="text-3xl font-bold">{formatCurrency(data.valor_en_libros)}</p>
                        </div>
                    </Card>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {porCategoria.length > 0 && (
                        <Card title="Activos por Categoría" className="shadow-sm">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={porCategoria} dataKey="cantidad" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} label>
                                            {porCategoria.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    {porEstado.length > 0 && (
                        <Card title="Activos por Estado" className="shadow-sm">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={porEstado} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="estado" type="category" width={100} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="cantidad" fill="#6366f1" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Estadísticas adicionales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-50 border-0">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Movimientos (mes)</p>
                            <p className="text-2xl font-bold text-gray-800">{data.movimientos_mes || 0}</p>
                        </div>
                    </Card>
                    <Card className="bg-gray-50 border-0">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Mant. Pendientes</p>
                            <p className="text-2xl font-bold text-orange-600">{data.mantenimientos_pendientes || 0}</p>
                        </div>
                    </Card>
                    <Card className="bg-gray-50 border-0">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Activos en Baja</p>
                            <p className="text-2xl font-bold text-red-600">{data.activos_baja || 0}</p>
                        </div>
                    </Card>
                    <Card className="bg-gray-50 border-0">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Ubicaciones</p>
                            <p className="text-2xl font-bold text-gray-800">{data.total_ubicaciones || 0}</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    const renderReport = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <p className="text-gray-500 mt-4">Cargando reporte...</p>
                </div>
            );
        }

        if (!reportData) {
            return (
                <div className="text-center py-12">
                    <i className="pi pi-chart-bar text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">Selecciona un reporte para ver los datos</p>
                </div>
            );
        }

        switch (selectedReport) {
            case 'asset-list': return renderAssetList();
            case 'depreciation': return renderDepreciation();
            case 'value-responsible': return renderValueByResponsible();
            case 'value-location': return renderValueByLocation();
            case 'movements': return renderMovements();
            case 'sales': return renderSales();
            case 'maintenance': return renderMaintenance();
            case 'inventory-audits': return renderInventoryAudits();
            case 'discrepancies': return renderDiscrepancies();
            case 'dispositions-acquisitions': return renderDispositionsAcquisitions();
            case 'summary': return renderSummary();
            default: return null;
        }
    };

    const currentReportLabel = allReports.find(r => r.value === selectedReport)?.label || 'Reporte';

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <i className="pi pi-chart-bar text-indigo-600"></i>
                    Centro de Reportes
                </h1>
                <p className="text-gray-600 mt-1">Genera y exporta reportes personalizados del sistema</p>
            </div>

            {/* Vista de Selección de Reportes */}
            {!showResults && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportCategories.map((category, catIndex) => (
                        <Card key={catIndex} className="shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                                    <i className={`${category.icon} text-white text-lg`}></i>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                            </div>
                            <div className="space-y-2">
                                {category.reports.map((report) => (
                                    <div
                                        key={report.value}
                                        onClick={() => handleSelectReport(report.value)}
                                        className="p-3 rounded-lg cursor-pointer transition-all border bg-gray-50 border-transparent hover:bg-indigo-50 hover:border-indigo-200"
                                    >
                                        <div className="flex items-start gap-3">
                                            <i className={`${report.icon} text-gray-500 mt-0.5`}></i>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{report.label}</p>
                                                <p className="text-sm text-gray-500">{report.description}</p>
                                            </div>
                                            <i className="pi pi-chevron-right text-gray-400"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Vista de Resultados */}
            {showResults && (
                <Card className="shadow-sm">
                    {/* Encabezado con botón atrás */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                        <Button
                            icon="pi pi-arrow-left"
                            onClick={handleBack}
                            className="p-button-text p-button-rounded"
                            tooltip="Volver a la selección"
                        />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-800">{currentReportLabel}</h2>
                        </div>
                    </div>

                    {/* Filtros principales */}
                    <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reporte</label>
                            <Dropdown
                                value={selectedReport}
                                onChange={(e) => {
                                    setSelectedReport(e.value);
                                    setReportData(null);
                                }}
                                options={allReports}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar reporte"
                                className="w-full"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                            <Calendar
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.value)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                className="w-full"
                                placeholder="Desde"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                            <Calendar
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.value)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                className="w-full"
                                placeholder="Hasta"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                icon="pi pi-search"
                                label="Aplicar"
                                onClick={fetchReport}
                                className="p-button-primary"
                                size="small"
                            />
                            <Button
                                icon="pi pi-filter-slash"
                                onClick={clearFilters}
                                className="p-button-outlined p-button-secondary"
                                tooltip="Limpiar filtros"
                                size="small"
                            />
                        </div>
                    </div>

                    {/* Filtros adicionales */}
                    <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b">
                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <Dropdown
                                value={categoriaId}
                                onChange={(e) => setCategoriaId(e.value)}
                                options={categorias}
                                optionLabel="nombre"
                                optionValue="id"
                                placeholder="Todas"
                                className="w-full"
                                showClear
                                loading={optionsLoading}
                            />
                        </div>
                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                            <Dropdown
                                value={ubicacionId}
                                onChange={(e) => setUbicacionId(e.value)}
                                options={ubicaciones}
                                optionLabel="nombre"
                                optionValue="id"
                                placeholder="Todas"
                                className="w-full"
                                showClear
                                loading={optionsLoading}
                            />
                        </div>
                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <Dropdown
                                value={estadoFiltro}
                                onChange={(e) => setEstadoFiltro(e.value)}
                                options={[
                                    { label: 'Activo', value: 'activo' },
                                    { label: 'En Uso', value: 'en_uso' },
                                    { label: 'En Mantenimiento', value: 'en_mantenimiento' },
                                    { label: 'Dado de Baja', value: 'dado_de_baja' },
                                ]}
                                placeholder="Todos"
                                className="w-full"
                                showClear
                            />
                        </div>
                    </div>

                    {/* Acciones de exportación */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                            label="Exportar Excel"
                            icon="pi pi-file-excel"
                            onClick={() => handleExport('excel')}
                            className="p-button-success"
                            size="small"
                            loading={exporting}
                        />
                        <Button
                            label="Exportar PDF"
                            icon="pi pi-file-pdf"
                            onClick={() => handleExport('pdf')}
                            className="p-button-danger"
                            size="small"
                            loading={exporting}
                        />
                        <Button
                            label="Actualizar"
                            icon="pi pi-refresh"
                            onClick={fetchReport}
                            className="p-button-outlined"
                            size="small"
                            loading={loading}
                        />
                    </div>

                    <Divider />

                    {/* Contenido del reporte */}
                    {renderReport()}
                </Card>
            )}
        </AppLayout>
    );
};

export default Reports;
