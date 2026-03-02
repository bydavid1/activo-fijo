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
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Reporte de Levantamiento</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: '#666' }}>
                            <span><strong>Código:</strong> {auditoria.codigo}</span>
                            <span style={{ color: '#ccc' }}>•</span>
                            <span><strong>Nombre:</strong> {auditoria.nombre}</span>
                            <span style={{ color: '#ccc' }}>•</span>
                            <Badge value="Completado" severity="success" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                        <Dropdown
                            value={exportFormat}
                            options={[
                                { label: 'Excel', value: 'excel' },
                                { label: 'PDF', value: 'pdf' },
                                { label: 'CSV', value: 'csv' }
                            ]}
                            onChange={(e) => setExportFormat(e.value)}
                            style={{ width: '100px' }}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                    <div>
                        <i className="pi pi-calendar" style={{ marginRight: '0.25rem', color: '#999' }}></i>
                        <strong>Iniciado:</strong> {new Date(auditoria.fecha_inicio).toLocaleString('es-CO')}
                    </div>
                    <div>
                        <i className="pi pi-calendar-plus" style={{ marginRight: '0.25rem', color: '#999' }}></i>
                        <strong>Finalizado:</strong> {new Date(auditoria.fecha_finalizacion).toLocaleString('es-CO')}
                    </div>
                    <div>
                        <i className="pi pi-clock" style={{ marginRight: '0.25rem', color: '#999' }}></i>
                        <strong>Duración:</strong> {Math.ceil((new Date(auditoria.fecha_finalizacion) - new Date(auditoria.fecha_inicio)) / (1000 * 60 * 60))}h
                    </div>
                </div>
            </Card>

            {/* Resumen ejecutivo */}
            <Card className="mb-4">
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '600', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', display: 'inline-block' }}>Resumen Ejecutivo</h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                    {/* Estadísticas en grid 2x2 */}
                    <div style={{ flex: '1 1 320px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'center', padding: '1.25rem 1rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a', lineHeight: 1 }}>{stats.total_encontrados}</div>
                                <div style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.25rem' }}>Encontrados</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>{stats.porcentaje_encontrados}% del total</div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '1.25rem 1rem', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626', lineHeight: 1 }}>{stats.total_faltantes}</div>
                                <div style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.25rem' }}>Faltantes</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>{((stats.total_faltantes / stats.total_esperados) * 100).toFixed(1)}% del total</div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '1.25rem 1rem', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ea580c', lineHeight: 1 }}>{stats.total_discrepantes}</div>
                                <div style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.25rem' }}>Discrepantes</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>Con diferencias</div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '1.25rem 1rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb', lineHeight: 1 }}>{stats.total_extras}</div>
                                <div style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.25rem' }}>Extras</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>No esperados</div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico circular */}
                    <div style={{ flex: '0 1 280px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
                        <Chart
                            type="doughnut"
                            data={chartData}
                            options={chartOptions}
                            style={{ width: '250px', height: '250px' }}
                        />
                    </div>
                </div>

                {/* Indicadores clave */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{stats.total_esperados}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>Total Esperados</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{stats.porcentaje_encontrados}%</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>Efectividad</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{stats.total_faltantes + stats.total_discrepantes}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>Problemas</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{stats.total_extras}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>Hallazgos</div>
                    </div>
                </div>
            </Card>

            {/* Detalles por categoría */}
            <Card>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Detalle de Activos</h3>
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            placeholder="Buscar..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            style={{ width: '250px' }}
                        />
                    </span>
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
