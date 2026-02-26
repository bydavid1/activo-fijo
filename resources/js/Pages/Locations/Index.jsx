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

const Locations = ({ user }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const toast = useRef(null);

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        edificio: '',
        piso: '',
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await axios.get('/api/locations');
            setLocations(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando ubicaciones' });
            setLoading(false);
        }
    };

    const handleOpenDialog = (location = null) => {
        if (location) {
            setEditingLocation(location);
            setFormData({
                nombre: location.nombre,
                codigo: location.codigo,
                descripcion: location.descripcion || '',
                edificio: location.edificio || '',
                piso: location.piso || '',
            });
        } else {
            setEditingLocation(null);
            setFormData({
                nombre: '',
                codigo: '',
                descripcion: '',
                edificio: '',
                piso: '',
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveLocation = async () => {
        try {
            if (editingLocation) {
                await axios.put(`/api/locations/${editingLocation.id}`, formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Ubicación actualizada' });
            } else {
                await axios.post('/api/locations', formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Ubicación creada' });
            }
            setDisplayDialog(false);
            fetchLocations();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error guardando ubicación';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    const handleDeleteLocation = async (location) => {
        if (confirm(`¿Eliminar ubicación "${location.nombre}"?`)) {
            try {
                await axios.delete(`/api/locations/${location.id}`);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Ubicación eliminada' });
                fetchLocations();
            } catch (error) {
                const msg = error.response?.data?.message || 'Error eliminando ubicación';
                toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
            }
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
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={() => handleDeleteLocation(rowData)}
                    tooltip="Eliminar"
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
                    <h5 className="text-2xl font-bold">Ubicaciones</h5>
                    <Button
                        label="Nueva Ubicación"
                        icon="pi pi-plus"
                        onClick={() => handleOpenDialog()}
                        className="p-button-success"
                    />
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar ubicaciones..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={locations}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    striped
                >
                    <Column field="codigo" header="Código" sortable style={{ width: '12%' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ width: '22%' }} />
                    <Column field="edificio" header="Edificio" style={{ width: '18%' }} />
                    <Column field="piso" header="Piso" style={{ width: '10%' }} />
                    <Column field="descripcion" header="Descripción" style={{ width: '25%' }} />
                    <Column
                        body={actionBodyTemplate}
                        header="Acciones"
                        style={{ width: '13%' }}
                    />
                </DataTable>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog
                visible={displayDialog}
                style={{ width: '40vw' }}
                header={editingLocation ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
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
                            disabled={!!editingLocation}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nombre</label>
                        <InputText
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Edificio</label>
                        <InputText
                            value={formData.edificio}
                            onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Piso</label>
                        <InputText
                            value={formData.piso}
                            onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
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
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Guardar"
                        icon="pi pi-check"
                        onClick={handleSaveLocation}
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
        </AppLayout>
    );
};

export default Locations;
