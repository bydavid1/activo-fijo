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

const Suppliers = ({ user }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const toast = useRef(null);

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        nit: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('/api/suppliers');
            setSuppliers(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando proveedores' });
            setLoading(false);
        }
    };

    const handleOpenDialog = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                nombre: supplier.nombre,
                codigo: supplier.codigo,
                nit: supplier.nit || '',
                email: supplier.email || '',
                telefono: supplier.telefono || '',
                direccion: supplier.direccion || '',
                ciudad: supplier.ciudad || '',
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                nombre: '',
                codigo: '',
                nit: '',
                email: '',
                telefono: '',
                direccion: '',
                ciudad: '',
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveSupplier = async () => {
        try {
            if (editingSupplier) {
                await axios.put(`/api/suppliers/${editingSupplier.id}`, formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Proveedor actualizado' });
            } else {
                await axios.post('/api/suppliers', formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Proveedor creado' });
            }
            setDisplayDialog(false);
            fetchSuppliers();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error guardando proveedor';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    const handleDeleteSupplier = async (supplier) => {
        if (confirm(`¿Eliminar proveedor "${supplier.nombre}"?`)) {
            try {
                await axios.delete(`/api/suppliers/${supplier.id}`);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Proveedor eliminado' });
                fetchSuppliers();
            } catch (error) {
                const msg = error.response?.data?.message || 'Error eliminando proveedor';
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
                    onClick={() => handleDeleteSupplier(rowData)}
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
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <h5 className="text-xl md:text-2xl font-bold">Proveedores</h5>
                    <Button
                        label="Nuevo Proveedor"
                        icon="pi pi-plus"
                        onClick={() => handleOpenDialog()}
                        className="p-button-success w-full md:w-auto"
                    />
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar proveedores..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={suppliers}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    stripedRows
                    scrollable
                    scrollHeight="flex"
                    responsiveLayout="scroll"
                >
                    <Column field="codigo" header="Código" sortable style={{ minWidth: '100px' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ minWidth: '150px' }} />
                    <Column field="nit" header="NIT" style={{ minWidth: '100px' }} className="hide-on-mobile" />
                    <Column field="email" header="Email" style={{ minWidth: '150px' }} className="hide-on-mobile" />
                    <Column field="telefono" header="Teléfono" style={{ minWidth: '100px' }} />
                    <Column field="ciudad" header="Ciudad" style={{ minWidth: '100px' }} className="hide-on-mobile" />
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
                header={editingSupplier ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
                modal
                className="p-fluid"
                onHide={() => setDisplayDialog(false)}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Código</label>
                        <InputText
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            disabled={!!editingSupplier}
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
                        <label className="block text-sm font-semibold mb-2">NIT</label>
                        <InputText
                            value={formData.nit}
                            onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
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
                    <div>
                        <label className="block text-sm font-semibold mb-2">Teléfono</label>
                        <InputText
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Ciudad</label>
                        <InputText
                            value={formData.ciudad}
                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Dirección</label>
                        <InputText
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Guardar"
                        icon="pi pi-check"
                        onClick={handleSaveSupplier}
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

export default Suppliers;
