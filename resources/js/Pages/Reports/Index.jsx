import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Reports = ({ user }) => {
    const [selectedReport, setSelectedReport] = useState('asset-list');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const reportTypes = [
        { label: 'Lista de Activos', value: 'asset-list' },
        { label: 'Depreciación', value: 'depreciation' },
        { label: 'Valor por Responsable', value: 'value-responsible' },
        { label: 'Movimientos', value: 'movements' },
        { label: 'Discrepancias', value: 'discrepancies' },
        { label: 'Mantenimiento', value: 'maintenance' },
    ];

    useEffect(() => {
        fetchReport();
    }, [selectedReport]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/reports/${selectedReport}`);
            setReportData(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando reporte' });
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const response = await axios.post(`/api/reports/export`, {
                tipo: selectedReport,
                formato: format,
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_${selectedReport}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Reporte exportado' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error exportando reporte' });
        }
    };

    const renderReport = () => {
        if (!reportData || reportData.length === 0) {
            return <p className="text-gray-600">No hay datos disponibles</p>;
        }

        switch (selectedReport) {
            case 'asset-list':
                return (
                    <DataTable value={reportData} className="w-full">
                        <Column field="codigo" header="Código" sortable />
                        <Column field="nombre" header="Nombre" sortable />
                        <Column field="categoria_id" header="Categoría" />
                        <Column
                            field="valor_compra"
                            header="Valor Compra"
                            body={(rowData) => `$${rowData.valor_compra?.toLocaleString('es-CO') || 0}`}
                        />
                        <Column
                            field="depreciacion_acumulada"
                            header="Depreciación"
                            body={(rowData) => `$${rowData.depreciacion_acumulada?.toLocaleString('es-CO') || 0}`}
                        />
                        <Column
                            field="valor_en_libros"
                            header="Valor en Libros"
                            body={(rowData) => `$${rowData.valor_en_libros?.toLocaleString('es-CO') || 0}`}
                        />
                    </DataTable>
                );

            case 'depreciation':
                return (
                    <div>
                        <div className="mb-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={reportData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="codigo" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="depreciacion_acumulada" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <DataTable value={reportData} className="w-full">
                            <Column field="codigo" header="Código" />
                            <Column field="nombre" header="Nombre" />
                            <Column
                                field="depreciacion_acumulada"
                                header="Depreciación Acumulada"
                                body={(rowData) => `$${rowData.depreciacion_acumulada?.toLocaleString('es-CO') || 0}`}
                            />
                            <Column
                                field="porcentaje_depreciado"
                                header="% Depreciado"
                                body={(rowData) => `${rowData.porcentaje_depreciado?.toFixed(2)}%`}
                            />
                        </DataTable>
                    </div>
                );

            case 'value-responsible':
                return (
                    <div>
                        <div className="mb-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={reportData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="responsable" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="valor_total" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <DataTable value={reportData} className="w-full">
                            <Column field="responsable" header="Responsable" />
                            <Column field="cantidad_activos" header="Cantidad" />
                            <Column
                                field="valor_total"
                                header="Valor Total"
                                body={(rowData) => `$${rowData.valor_total?.toLocaleString('es-CO') || 0}`}
                            />
                        </DataTable>
                    </div>
                );

            case 'movements':
                return (
                    <DataTable value={reportData} className="w-full" paginator rows={10}>
                        <Column field="asset_codigo" header="Código Activo" />
                        <Column field="ubicacion_anterior" header="Ubicación Anterior" />
                        <Column field="ubicacion_nueva" header="Ubicación Nueva" />
                        <Column field="responsable_anterior" header="Responsable Anterior" />
                        <Column field="responsable_nuevo" header="Responsable Nuevo" />
                        <Column
                            field="fecha_movimiento"
                            header="Fecha"
                            body={(rowData) => new Date(rowData.fecha_movimiento).toLocaleDateString('es-CO')}
                        />
                    </DataTable>
                );

            case 'discrepancies':
                return (
                    <DataTable value={reportData} className="w-full" paginator rows={10}>
                        <Column field="asset_codigo" header="Código Activo" />
                        <Column field="cantidad_esperada" header="Esperado" />
                        <Column field="cantidad_encontrada" header="Encontrado" />
                        <Column field="estado" header="Estado" />
                        <Column
                            field="fecha_deteccion"
                            header="Fecha"
                            body={(rowData) => new Date(rowData.fecha_deteccion).toLocaleDateString('es-CO')}
                        />
                    </DataTable>
                );

            case 'maintenance':
                return (
                    <DataTable value={reportData} className="w-full" paginator rows={10}>
                        <Column field="numero" header="Número Orden" />
                        <Column field="asset_codigo" header="Código Activo" />
                        <Column field="tipo" header="Tipo" />
                        <Column
                            field="costo_total"
                            header="Costo Total"
                            body={(rowData) => `$${rowData.costo_total?.toLocaleString('es-CO') || 0}`}
                        />
                        <Column field="estado" header="Estado" />
                    </DataTable>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <Card className="bg-white shadow mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold mb-2">Seleccionar Reporte</label>
                        <Dropdown
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.value)}
                            options={reportTypes}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full md:w-1/3"
                        />
                    </div>
                    <div className="flex gap-2 mt-8">
                        <Button
                            label="Exportar Excel"
                            icon="pi pi-download"
                            onClick={() => handleExport('excel')}
                            className="p-button-success"
                        />
                        <Button
                            label="Exportar PDF"
                            icon="pi pi-file-pdf"
                            onClick={() => handleExport('pdf')}
                            className="p-button-danger"
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-600">Cargando reporte...</p>
                ) : (
                    renderReport()
                )}
            </Card>
        </AppLayout>
    );
};

export default Reports;
