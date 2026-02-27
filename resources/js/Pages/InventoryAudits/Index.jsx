import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ user }) {
    const [levantamientos, setLevantamientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [options, setOptions] = useState({
        categorias: [],
        ubicaciones: [],
        responsables: []
    });

    const toast = useRef(null);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        criterios: {
            category_ids: [],
            location_ids: [],
            employee_ids: []
        }
    });

    // Cargar datos iniciales
    useEffect(() => {
        loadLevantamientos();
        loadOptions();
    }, []);

    const loadLevantamientos = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/inventory-audits');
            if (response.data.success) {
                setLevantamientos(response.data.auditorias.data || []);
            }
        } catch (error) {
            console.error('Error cargando levantamientos:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar los levantamientos',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const loadOptions = async () => {
        try {
            const response = await axios.get('/api/inventory-audits/options');
            if (response.data.success) {
                setOptions(response.data);
            }
        } catch (error) {
            console.error('Error cargando opciones:', error);
        }
    };

    const openNew = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            criterios: {
                category_ids: [],
                location_ids: [],
                employee_ids: []
            }
        });
        setEditingItem(null);
        setShowDialog(true);
    };

    const hideDialog = () => {
        setShowDialog(false);
        setEditingItem(null);
    };

    const saveLevantamiento = async () => {
        try {
            setSubmitting(true);

            const response = await axios.post('/api/inventory-audits', formData);

            if (response.data.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: response.data.message,
                    life: 3000
                });

                hideDialog();
                loadLevantamientos();
            }
        } catch (error) {
            console.error('Error guardando levantamiento:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al crear el levantamiento',
                life: 5000
            });
        } finally {
            setSubmitting(false);
        }
    };

    const deleteLevantamiento = async (levantamiento) => {
        try {
            const response = await axios.delete(`/api/inventory-audits/${levantamiento.id}`);

            if (response.data.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: response.data.message,
                    life: 3000
                });

                loadLevantamientos();
            }
        } catch (error) {
            console.error('Error eliminando levantamiento:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al eliminar el levantamiento',
                life: 5000
            });
        }
    };

    const confirmDelete = (levantamiento) => {
        confirmDialog({
            message: `¿Está seguro de eliminar el levantamiento "${levantamiento.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteLevantamiento(levantamiento)
        });
    };

    const iniciarLevantamiento = async (levantamiento) => {
        try {
            const response = await axios.post(`/api/inventory-audits/${levantamiento.id}/iniciar`);

            if (response.data.success) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: response.data.message,
                    life: 3000
                });

                // Navegar al scanner
                router.visit(`/inventory-audits/${levantamiento.id}/scanner`);
            }
        } catch (error) {
            console.error('Error iniciando levantamiento:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al iniciar el levantamiento',
                life: 5000
            });
        }
    };

    const verReporte = (levantamiento) => {
        router.visit(`/inventory-audits/${levantamiento.id}/report`);
    };

    const continuarEscaneo = (levantamiento) => {
        router.visit(`/inventory-audits/${levantamiento.id}/scanner`);
    };

    // Templates para las columnas
    const estadoBodyTemplate = (rowData) => {
        const severityMap = {
            'draft': 'secondary',
            'in_progress': 'warning',
            'completed': 'success',
            'cancelled': 'danger'
        };

        const labelMap = {
            'draft': 'Borrador',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };

        return (
            <Badge
                value={labelMap[rowData.estado]}
                severity={severityMap[rowData.estado]}
            />
        );
    };

    const progresoBodyTemplate = (rowData) => {
        if (rowData.estado === 'draft') {
            return <span className="text-500">No iniciado</span>;
        }

        const progreso = rowData.progreso || 0;
        const encontrados = rowData.items_encontrados_count || 0;
        const total = rowData.total_activos_esperados || 0;

        return (
            <div className="flex flex-column gap-1">
                <div className="flex justify-content-between align-items-center">
                    <small className="text-600">{encontrados}/{total}</small>
                    <small className="text-600">{progreso.toFixed(1)}%</small>
                </div>
                <ProgressBar
                    value={progreso}
                    style={{ height: '6px' }}
                    showValue={false}
                />
            </div>
        );
    };

    const fechaBodyTemplate = (rowData) => {
        if (!rowData.created_at) return '-';

        const fecha = new Date(rowData.created_at);
        return fecha.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                {rowData.estado === 'draft' && (
                    <>
                        <Button
                            icon="pi pi-play"
                            rounded
                            outlined
                            className="p-button-success"
                            tooltip="Iniciar levantamiento"
                            onClick={() => iniciarLevantamiento(rowData)}
                        />

                        <Button
                            icon="pi pi-trash"
                            rounded
                            outlined
                            className="p-button-danger"
                            tooltip="Eliminar"
                            onClick={() => confirmDelete(rowData)}
                        />
                    </>
                )}

                {rowData.estado === 'in_progress' && (
                    <Button
                        icon="pi pi-camera"
                        rounded
                        outlined
                        className="p-button-warning"
                        tooltip="Continuar escaneo"
                        onClick={() => continuarEscaneo(rowData)}
                    />
                )}

                {rowData.estado === 'completed' && (
                    <Button
                        icon="pi pi-chart-bar"
                        rounded
                        outlined
                        className="p-button-info"
                        tooltip="Ver reporte"
                        onClick={() => verReporte(rowData)}
                    />
                )}
            </div>
        );
    };

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const header = (
        <div className="flex justify-content-between align-items-center">
            <h2 className="m-0">Levantamientos de Inventario</h2>
            <div className="flex gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Buscar..."
                    />
                </span>
                <Button
                    label="Nuevo Levantamiento"
                    icon="pi pi-plus"
                    onClick={openNew}
                />
            </div>
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                outlined
                onClick={hideDialog}
                disabled={submitting}
            />
            <Button
                label="Crear Levantamiento"
                icon="pi pi-check"
                loading={submitting}
                onClick={saveLevantamiento}
            />
        </div>
    );

    return (
        <AppLayout user={user}>
            <Head title="Levantamientos de Inventario" />

            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="card">
                <DataTable
                    value={levantamientos}
                    header={header}
                    loading={loading}
                    globalFilter={globalFilter}
                    emptyMessage="No se encontraron levantamientos"
                    paginator
                    rows={15}
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    className="p-datatable-gridlines"
                >
                    <Column field="codigo" header="Código" sortable style={{ minWidth: '120px' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ minWidth: '200px' }} />
                    <Column field="descripcion" header="Descripción" style={{ minWidth: '200px' }} />
                    <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '120px' }} />
                    <Column field="total_activos_esperados" header="Activos" sortable style={{ minWidth: '100px' }} />
                    <Column header="Progreso" body={progresoBodyTemplate} style={{ minWidth: '150px' }} />
                    <Column field="created_at" header="Fecha" body={fechaBodyTemplate} sortable style={{ minWidth: '150px' }} />
                    <Column header="Acciones" body={actionBodyTemplate} style={{ minWidth: '120px' }} />
                </DataTable>
            </div>

            <Dialog
                visible={showDialog}
                style={{ width: '600px' }}
                header="Nuevo Levantamiento de Inventario"
                modal
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="p-fluid grid formgrid">
                    <div className="field col-12">
                        <label htmlFor="nombre">Nombre *</label>
                        <InputText
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            required
                            className={!formData.nombre ? 'p-invalid' : ''}
                        />
                    </div>

                    <div className="field col-12">
                        <label htmlFor="descripcion">Descripción</label>
                        <InputTextarea
                            id="descripcion"
                            value={formData.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="field col-12">
                        <label>Criterios de Selección</label>
                        <small className="p-error d-block mb-2">
                            Los activos del levantamiento se filtrarán según los criterios seleccionados.
                            Si no selecciona ningún criterio, se incluirán todos los activos.
                        </small>
                    </div>

                    <div className="field col-12 md:col-4">
                        <label htmlFor="categorias">Categorías</label>
                        <MultiSelect
                            id="categorias"
                            value={formData.criterios.category_ids}
                            onChange={(e) => handleInputChange('criterios.category_ids', e.value)}
                            options={options.categorias}
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Seleccionar categorías"
                            display="chip"
                        />
                    </div>

                    <div className="field col-12 md:col-4">
                        <label htmlFor="ubicaciones">Ubicaciones</label>
                        <MultiSelect
                            id="ubicaciones"
                            value={formData.criterios.location_ids}
                            onChange={(e) => handleInputChange('criterios.location_ids', e.value)}
                            options={options.ubicaciones}
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Seleccionar ubicaciones"
                            display="chip"
                        />
                    </div>

                    <div className="field col-12 md:col-4">
                        <label htmlFor="responsables">Responsables</label>
                        <MultiSelect
                            id="responsables"
                            value={formData.criterios.employee_ids}
                            onChange={(e) => handleInputChange('criterios.employee_ids', e.value)}
                            options={options.responsables}
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Seleccionar responsables"
                            display="chip"
                        />
                    </div>
                </div>
            </Dialog>
        </AppLayout>
    );
}
