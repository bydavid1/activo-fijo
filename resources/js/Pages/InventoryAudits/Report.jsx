import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Chart } from 'primereact/chart';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import axios from 'axios';

export default function Report({ user, auditId }) {
    const [auditoria, setAuditoria] = useState(null);
    const [reporte, setReporte] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [globalFilter, setGlobalFilter] = useState('');
    const [exportFormat, setExportFormat] = useState('excel');
    const toast = useRef(null);

    useEffect(() => {
        loadReporte();
        initChart();
    }, [auditId]);

    const loadReporte = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/inventory-audits/${auditId}/reporte`);

            if (response.data.success) {
                setAuditoria(response.data.auditoria);
                setReporte(response.data.reporte);
                updateChartData(response.data.reporte.estadisticas);
            }
        } catch (error) {
            console.error('Error cargando reporte:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar el reporte',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const initChart = () => {
        const documentStyle = getComputedStyle(document.documentElement);

        const options = {
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        color: documentStyle.getPropertyValue('--text-color')
                    }
                }
            },
            responsive: true
        };

        setChartOptions(options);
    };

    const updateChartData = (stats) => {
        const documentStyle = getComputedStyle(document.documentElement);

        const data = {
            labels: ['Encontrados', 'Faltantes', 'Discrepantes', 'Extras'],
            datasets: [
                {
                    data: [
                        stats.total_encontrados,
                        stats.total_faltantes,
                        stats.total_discrepantes,
                        stats.total_extras
                    ],
                    backgroundColor: [
                        documentStyle.getPropertyValue('--green-500'),
                        documentStyle.getPropertyValue('--red-500'),
                        documentStyle.getPropertyValue('--orange-500'),
                        documentStyle.getPropertyValue('--blue-500')
                    ],
                    hoverBackgroundColor: [
                        documentStyle.getPropertyValue('--green-400'),
                        documentStyle.getPropertyValue('--red-400'),
                        documentStyle.getPropertyValue('--orange-400'),
                        documentStyle.getPropertyValue('--blue-400')
                    ]
                }
            ]
        };

        setChartData(data);
    };

    const exportReporte = async () => {
        try {
            const response = await axios.post('/api/reports/export', {
                type: 'inventory-audit',
                auditId: auditId,
                format: exportFormat
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Reporte exportado exitosamente',
                life: 3000
            });
        } catch (error) {
            console.error('Error exportando reporte:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al exportar el reporte',
                life: 3000
            });
        }
    };

    const volverAListado = () => {
        router.visit('/inventory-audits');
    };

    // Templates para las columnas
    const codigoBodyTemplate = (rowData) => (
        <Badge value={rowData.asset?.codigo || rowData.codigo_escaneado} />
    );

    const estadoBodyTemplate = (rowData) => {
        const severityMap = {
            'found': 'success',
            'missing': 'danger',
            'discrepant': 'warning'
        };

        const labelMap = {
            'found': 'Encontrado',
            'missing': 'Faltante',
            'discrepant': 'Discrepante'
        };

        return (
            <Tag
                value={labelMap[rowData.estado] || 'Desconocido'}
                severity={severityMap[rowData.estado] || 'secondary'}
            />
        );
    };

    const valorBodyTemplate = (rowData) => (
        <span>${rowData.asset?.valor_compra?.toLocaleString('es-CO') || '0'}</span>
    );

    const fechaBodyTemplate = (rowData) => {
        if (!rowData.fecha_escaneado) return '-';
        return new Date(rowData.fecha_escaneado).toLocaleString('es-CO');
    };

    const tipoHallazgoBodyTemplate = (rowData) => {
        const tipoMap = {
            'asset_not_found': { label: 'No encontrado', severity: 'danger' },
            'asset_extra': { label: 'Extra', severity: 'info' },
            'location_changed': { label: 'Cambio ubicación', severity: 'warning' },
            'responsible_changed': { label: 'Cambio responsable', severity: 'warning' },
            'condition_changed': { label: 'Cambio estado', severity: 'secondary' },
            'other_discrepancy': { label: 'Otra discrepancia', severity: 'secondary' }
        };

        const tipo = tipoMap[rowData.tipo] || { label: 'Desconocido', severity: 'secondary' };
        return <Tag value={tipo.label} severity={tipo.severity} />;
    };

    const severidadBodyTemplate = (rowData) => {
        const severityMap = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'success'
        };

        const labelMap = {
            'high': 'Alta',
            'medium': 'Media',
            'low': 'Baja'
        };

        return (
            <Tag
                value={labelMap[rowData.severidad]}
                severity={severityMap[rowData.severidad]}
            />
        );
    };

    if (loading || !auditoria || !reporte) {
        return (
            <AppLayout user={user}>
                <Head title="Cargando reporte..." />
                <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
                </div>
            </AppLayout>
        );
    }

    const stats = reporte.estadisticas;

    return (
        <AppLayout user={user}>
            <Head title={`Reporte - ${auditoria.nombre}`} />

            <Toast ref={toast} />

            {/* Header */}
            <Card className="mb-4">
                <div className="flex justify-content-between align-items-center mb-3">
                    <div>
                        <h2 className="m-0 mb-2">Reporte de Levantamiento</h2>
                        <div className="flex gap-3 text-sm text-600">
                            <span>Código: {auditoria.codigo}</span>
                            <span>•</span>
                            <span>Nombre: {auditoria.nombre}</span>
                            <span>•</span>
                            <span>Estado: <Badge value="Completado" severity="success" /></span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Dropdown
                            value={exportFormat}
                            options={[
                                { label: 'Excel', value: 'excel' },
                                { label: 'PDF', value: 'pdf' },
                                { label: 'CSV', value: 'csv' }
                            ]}
                            onChange={(e) => setExportFormat(e.value)}
                            className="w-100px"
                        />

                        <Button
                            label="Exportar"
                            icon="pi pi-download"
                            onClick={exportReporte}
                        />

                        <Button
                            label="Volver"
                            icon="pi pi-arrow-left"
                            outlined
                            onClick={volverAListado}
                        />
                    </div>
                </div>

                {/* Fechas del levantamiento */}
                <div className="grid grid-cols-3 gap-3 text-sm text-600">
                    <div>
                        <span className="font-semibold">Iniciado:</span> {new Date(auditoria.fecha_inicio).toLocaleString('es-CO')}
                    </div>
                    <div>
                        <span className="font-semibold">Finalizado:</span> {new Date(auditoria.fecha_finalizacion).toLocaleString('es-CO')}
                    </div>
                    <div>
                        <span className="font-semibold">Duración:</span> {Math.ceil((new Date(auditoria.fecha_finalizacion) - new Date(auditoria.fecha_inicio)) / (1000 * 60 * 60))}h
                    </div>
                </div>
            </Card>

            {/* Resumen ejecutivo */}
            <Card className="mb-4" title="Resumen Ejecutivo">
                <div className="grid grid-cols-2 gap-4">
                    {/* Estadísticas */}
                    <div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-green-50 border-round">
                                <div className="text-3xl font-bold text-green-600">{stats.total_encontrados}</div>
                                <div className="text-sm text-600">Encontrados</div>
                                <div className="text-xs text-500">{stats.porcentaje_encontrados}% del total</div>
                            </div>

                            <div className="text-center p-3 bg-red-50 border-round">
                                <div className="text-3xl font-bold text-red-600">{stats.total_faltantes}</div>
                                <div className="text-sm text-600">Faltantes</div>
                                <div className="text-xs text-500">{((stats.total_faltantes / stats.total_esperados) * 100).toFixed(1)}% del total</div>
                            </div>

                            <div className="text-center p-3 bg-orange-50 border-round">
                                <div className="text-3xl font-bold text-orange-600">{stats.total_discrepantes}</div>
                                <div className="text-sm text-600">Discrepantes</div>
                                <div className="text-xs text-500">Con diferencias</div>
                            </div>

                            <div className="text-center p-3 bg-blue-50 border-round">
                                <div className="text-3xl font-bold text-blue-600">{stats.total_extras}</div>
                                <div className="text-sm text-600">Extras</div>
                                <div className="text-xs text-500">No esperados</div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico circular */}
                    <div className="flex justify-content-center">
                        <Chart
                            type="doughnut"
                            data={chartData}
                            options={chartOptions}
                            style={{ width: '300px', height: '300px' }}
                        />
                    </div>
                </div>

                <Divider />

                {/* Indicadores clave */}
                <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                        <div className="text-lg font-bold">{stats.total_esperados}</div>
                        <div className="text-sm text-600">Total Esperados</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-green-600">{stats.porcentaje_encontrados}%</div>
                        <div className="text-sm text-600">Efectividad</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-red-600">{stats.total_faltantes + stats.total_discrepantes}</div>
                        <div className="text-sm text-600">Problemas</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-blue-600">{stats.total_extras}</div>
                        <div className="text-sm text-600">Hallazgos</div>
                    </div>
                </div>
            </Card>

            {/* Detalles por categoría */}
            <Card>
                <div className="mb-3">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0">Detalle de Activos</h3>
                        <InputText
                            placeholder="Buscar..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-300px"
                        />
                    </div>
                </div>

                <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}>
                    {/* Tab Encontrados */}
                    <TabPanel header={`✅ Encontrados (${stats.total_encontrados})`}>
                        <DataTable
                            value={reporte.encontrados}
                            globalFilter={globalFilter}
                            paginator
                            rows={15}
                            emptyMessage="No hay activos encontrados"
                        >
                            <Column field="asset.codigo" header="Código" body={codigoBodyTemplate} />
                            <Column field="asset.nombre" header="Nombre" />
                            <Column field="asset.categoria.nombre" header="Categoría" />
                            <Column field="asset.ubicacion.nombre" header="Ubicación" />
                            <Column field="asset.responsable.nombre" header="Responsable" />
                            <Column field="asset.valor_compra" header="Valor" body={valorBodyTemplate} />
                            <Column field="fecha_escaneado" header="Fecha Escaneado" body={fechaBodyTemplate} />
                        </DataTable>
                    </TabPanel>

                    {/* Tab Faltantes */}
                    <TabPanel header={`❌ Faltantes (${stats.total_faltantes})`}>
                        <DataTable
                            value={reporte.faltantes}
                            globalFilter={globalFilter}
                            paginator
                            rows={15}
                            emptyMessage="No hay activos faltantes"
                        >
                            <Column field="asset.codigo" header="Código" body={codigoBodyTemplate} />
                            <Column field="asset.nombre" header="Nombre" />
                            <Column field="asset.categoria.nombre" header="Categoría" />
                            <Column field="asset.ubicacion.nombre" header="Ubicación Esperada" />
                            <Column field="asset.responsable.nombre" header="Responsable Esperado" />
                            <Column field="asset.valor_compra" header="Valor" body={valorBodyTemplate} />
                            <Column field="observaciones" header="Observaciones" />
                        </DataTable>
                    </TabPanel>

                    {/* Tab Discrepantes */}
                    {stats.total_discrepantes > 0 && (
                        <TabPanel header={`⚠️ Discrepantes (${stats.total_discrepantes})`}>
                            <DataTable
                                value={reporte.discrepantes}
                                globalFilter={globalFilter}
                                paginator
                                rows={15}
                                emptyMessage="No hay activos con discrepancias"
                            >
                                <Column field="asset.codigo" header="Código" body={codigoBodyTemplate} />
                                <Column field="asset.nombre" header="Nombre" />
                                <Column field="asset.categoria.nombre" header="Categoría" />
                                <Column field="fecha_escaneado" header="Fecha Escaneado" body={fechaBodyTemplate} />
                                <Column field="observaciones" header="Discrepancia" />
                            </DataTable>
                        </TabPanel>
                    )}

                    {/* Tab Extras */}
                    {stats.total_extras > 0 && (
                        <TabPanel header={`➕ Extras (${stats.total_extras})`}>
                            <DataTable
                                value={reporte.extras}
                                globalFilter={globalFilter}
                                paginator
                                rows={15}
                                emptyMessage="No hay activos extras"
                            >
                                <Column field="codigo_escaneado" header="Código Escaneado" />
                                <Column field="descripcion" header="Descripción" />
                                <Column field="fecha_detectado" header="Fecha Detectado" body={(row) => new Date(row.fecha_detectado).toLocaleString('es-CO')} />
                                <Column field="severidad" header="Severidad" body={severidadBodyTemplate} />
                            </DataTable>
                        </TabPanel>
                    )}
                </TabView>
            </Card>
        </AppLayout>
    );
}
