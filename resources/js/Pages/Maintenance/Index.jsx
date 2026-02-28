import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Maintenance = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayDialog, setDisplayDialog] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [displayHistory, setDisplayHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const toast = useRef(null);

    const tipos = [
        { label: 'Preventivo', value: 'preventivo' },
        { label: 'Correctivo', value: 'correctivo' },
    ];

    const estados = [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'En Proceso', value: 'en_proceso' },
        { label: 'Completado', value: 'completado' },
        { label: 'Cancelado', value: 'cancelado' },
    ];

    const [formData, setFormData] = useState({
        asset_id: null,
        tipo: 'preventivo',
        descripcion: '',
        costo_estimado: 0,
        costo_real: 0,
        fecha_programada: new Date(),
        estado: 'pendiente',
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/api/maintenance');
            setOrders(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando órdenes' });
            setLoading(false);
        }
    };

    const handleOpenDialog = (order = null) => {
        if (order) {
            setEditingOrder(order);
            setFormData(order);
        } else {
            setEditingOrder(null);
            setFormData({
                asset_id: null,
                tipo: 'preventivo',
                descripcion: '',
                costo_estimado: 0,
                costo_real: 0,
                fecha_programada: new Date(),
                estado: 'pendiente',
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveOrder = async () => {
        try {
            if (editingOrder) {
                await axios.put(`/api/maintenance/${editingOrder.id}`, formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Orden actualizada' });
            } else {
                await axios.post('/api/maintenance', formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Orden creada' });
            }
            setDisplayDialog(false);
            fetchOrders();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error guardando orden' });
        }
    };

    const handleViewHistory = async (order) => {
        try {
            const response = await axios.get(`/api/maintenance/${order.id}/history`);
            setHistory(response.data.data || []);
            setDisplayHistory(true);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando historial' });
        }
    };

    const handleUpdateStatus = async (order, newStatus) => {
        try {
            const data = {
                estado: newStatus,
                ...(newStatus === 'completado' && {
                    costo_real: order.costo_real,
                    fecha_completada: new Date(),
                })
            };
            await axios.put(`/api/maintenance/${order.id}/status`, data);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado' });
            fetchOrders();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error actualizando estado' });
        }
    };

    const statusBodyTemplate = (rowData) => {
        const status = estados.find(s => s.value === rowData.estado);
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                rowData.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                rowData.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                rowData.estado === 'completado' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
            }`}>
                {status?.label}
            </span>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-warning p-button-sm"
                    onClick={() => handleOpenDialog(rowData)}
                    tooltip="Editar"
                    tooltipPosition="top"
                />
                <Button
                    icon="pi pi-history"
                    className="p-button-rounded p-button-info p-button-sm"
                    onClick={() => handleViewHistory(rowData)}
                    tooltip="Historial"
                    tooltipPosition="top"
                />
            </div>
        );
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <Card className="bg-white shadow mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <h5 className="text-xl md:text-2xl font-bold">Órdenes de Mantenimiento</h5>
                    <Button
                        label="Nueva Orden"
                        icon="pi pi-plus"
                        onClick={() => handleOpenDialog()}
                        className="p-button-success w-full md:w-auto"
                    />
                </div>

                <DataTable
                    value={orders}
                    paginator
                    rows={10}
                    loading={loading}
                    className="w-full"
                    stripedRows
                    scrollable
                    scrollHeight="flex"
                    responsiveLayout="scroll"
                >
                    <Column field="numero" header="Número" sortable style={{ minWidth: '100px' }} />
                    <Column field="asset_id" header="Asset ID" style={{ minWidth: '80px' }} className="hide-on-mobile" />
                    <Column field="tipo" header="Tipo" style={{ minWidth: '100px' }} />
                    <Column field="descripcion" header="Descripción" style={{ minWidth: '150px' }} className="hide-on-mobile" />
                    <Column
                        field="costo_estimado"
                        header="Costo"
                        style={{ minWidth: '100px' }}
                        body={(rowData) => `$${rowData.costo_estimado?.toLocaleString('es-CO') || 0}`}
                    />
                    <Column
                        field="estado"
                        header="Estado"
                        body={statusBodyTemplate}
                        style={{ minWidth: '100px' }}
                    />
                    <Column
                        body={actionBodyTemplate}
                        header="Acciones"
                        style={{ minWidth: '100px' }}
                        frozen
                        alignFrozen="right"
                    />
                </DataTable>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog
                visible={displayDialog}
                style={{ width: '90vw', maxWidth: '700px' }}
                header={editingOrder ? 'Editar Orden' : 'Crear Nueva Orden'}
                modal
                className="p-fluid"
                onHide={() => setDisplayDialog(false)}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo</label>
                        <Dropdown
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.value })}
                            options={tipos}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Estado</label>
                        <Dropdown
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.value })}
                            options={estados}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Descripción</label>
                        <InputText
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Costo Estimado</label>
                        <InputNumber
                            value={formData.costo_estimado}
                            onValueChange={(e) => setFormData({ ...formData, costo_estimado: e.value })}
                            locale="es-CO"
                            currency="COP"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Costo Real</label>
                        <InputNumber
                            value={formData.costo_real}
                            onValueChange={(e) => setFormData({ ...formData, costo_real: e.value })}
                            locale="es-CO"
                            currency="COP"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Guardar"
                        icon="pi pi-check"
                        onClick={handleSaveOrder}
                        className="p-button-success"
                    />
                    <Button
                        label="Cancelar"
                        icon="pi pi-times"
                        onClick={() => setDisplayDialog(false)}
                        className="p-button-secondary"
                    />
                </div>
            </Dialog>

            {/* History Dialog */}
            <Dialog
                visible={displayHistory}
                style={{ width: '90vw', maxWidth: '700px' }}
                header="Historial de Cambios"
                modal
                onHide={() => setDisplayHistory(false)}
            >
                <DataTable
                    value={history}
                    className="w-full"
                    scrollable
                    scrollHeight="flex"
                    responsiveLayout="scroll"
                >
                    <Column
                        field="estado_anterior"
                        header="Estado Anterior"
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="estado_nuevo"
                        header="Estado Nuevo"
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="created_at"
                        header="Fecha"
                        style={{ minWidth: '150px' }}
                        body={(rowData) => new Date(rowData.created_at).toLocaleString('es-CO')}
                    />
                </DataTable>
            </Dialog>
        </AppLayout>
    );
};

export default Maintenance;
