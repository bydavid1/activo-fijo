import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Employees = ({ user }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [syncLogs, setSyncLogs] = useState([]);
    const [displaySyncLogs, setDisplaySyncLogs] = useState(false);
    const toast = useRef(null);

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        email: '',
        departamento: '',
        puesto: '',
        telefono: '',
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees');
            setEmployees(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando empleados' });
            setLoading(false);
        }
    };

    const handleOpenDialog = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData(employee);
        } else {
            setEditingEmployee(null);
            setFormData({
                codigo: '',
                nombre: '',
                email: '',
                departamento: '',
                puesto: '',
                telefono: '',
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveEmployee = async () => {
        try {
            if (editingEmployee) {
                await axios.put(`/api/employees/${editingEmployee.id}`, formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Empleado actualizado' });
            } else {
                await axios.post('/api/employees', formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Empleado creado' });
            }
            setDisplayDialog(false);
            fetchEmployees();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error guardando empleado' });
        }
    };

    const handleSyncEmployees = async () => {
        try {
            const response = await axios.post('/api/employees/sync');
            toast.current.show({
                severity: 'success',
                summary: 'Sincronización completada',
                detail: `Creados: ${response.data.creados}, Actualizados: ${response.data.actualizados}`
            });
            fetchEmployees();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error sincronizando empleados' });
        }
    };

    const handleViewSyncLogs = async (employee) => {
        try {
            const response = await axios.get(`/api/employees/${employee.id}/sync-logs`);
            setSyncLogs(response.data.data || []);
            setDisplaySyncLogs(true);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando logs' });
        }
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
                    icon="pi pi-clock"
                    className="p-button-rounded p-button-info p-button-sm"
                    onClick={() => handleViewSyncLogs(rowData)}
                    tooltip="Ver Logs"
                    tooltipPosition="top"
                />
            </div>
        );
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <Card className="bg-white shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="text-2xl font-bold">Gestión de Empleados</h5>
                    <div className="flex gap-2">
                        <Button
                            label="Sincronizar"
                            icon="pi pi-refresh"
                            onClick={handleSyncEmployees}
                            className="p-button-info"
                        />
                        <Button
                            label="Nuevo Empleado"
                            icon="pi pi-plus"
                            onClick={() => handleOpenDialog()}
                            className="p-button-success"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar empleados..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={employees}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    striped
                >
                    <Column field="codigo" header="Código" sortable style={{ width: '12%' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ width: '20%' }} />
                    <Column field="email" header="Email" style={{ width: '20%' }} />
                    <Column field="departamento" header="Departamento" style={{ width: '18%' }} />
                    <Column field="puesto" header="Puesto" style={{ width: '18%' }} />
                    <Column
                        body={actionBodyTemplate}
                        header="Acciones"
                        style={{ width: '12%' }}
                    />
                </DataTable>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog
                visible={displayDialog}
                style={{ width: '50vw' }}
                header={editingEmployee ? 'Editar Empleado' : 'Crear Nuevo Empleado'}
                modal
                className="p-fluid"
                onHide={() => setDisplayDialog(false)}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Código</label>
                        <InputText
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            disabled={!!editingEmployee}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Email</label>
                        <InputText
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Nombre Completo</label>
                        <InputText
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Departamento</label>
                        <InputText
                            value={formData.departamento}
                            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Puesto</label>
                        <InputText
                            value={formData.puesto}
                            onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Teléfono</label>
                        <InputText
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Guardar"
                        icon="pi pi-check"
                        onClick={handleSaveEmployee}
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

            {/* Sync Logs Dialog */}
            <Dialog
                visible={displaySyncLogs}
                style={{ width: '70vw' }}
                header="Historial de Sincronización"
                modal
                onHide={() => setDisplaySyncLogs(false)}
            >
                <DataTable value={syncLogs} className="w-full">
                    <Column field="accion" header="Acción" />
                    <Column field="estado" header="Estado" />
                    <Column field="mensaje_error" header="Mensaje" />
                    <Column
                        field="created_at"
                        header="Fecha"
                        body={(rowData) => new Date(rowData.created_at).toLocaleString('es-CO')}
                    />
                </DataTable>
            </Dialog>
        </AppLayout>
    );
};

export default Employees;
