import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Assets = ({ user }) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const toast = useRef(null);

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        marca: '',
        modelo: '',
        serie: '',
        categoria_id: null,
        ubicacion_id: null,
        proveedor_id: null,
        valor_compra: 0,
        valor_residual: 0,
        vida_util_anos: 5,
        fecha_adquisicion: new Date(),
        estado: 'activo',
    });

    useEffect(() => {
        fetchAssets();
        fetchOptions();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await axios.get('/api/assets');
            setAssets(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando activos' });
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const response = await axios.get('/api/assets/options');
            // Aquí vendrían las opciones del servidor
            // Por ahora usamos datos simulados
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleOpenDialog = (asset = null) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData(asset);
        } else {
            setEditingAsset(null);
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                marca: '',
                modelo: '',
                serie: '',
                categoria_id: null,
                ubicacion_id: null,
                proveedor_id: null,
                valor_compra: 0,
                valor_residual: 0,
                vida_util_anos: 5,
                fecha_adquisicion: new Date(),
                estado: 'activo',
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveAsset = async () => {
        try {
            if (editingAsset) {
                await axios.put(`/api/assets/${editingAsset.id}`, formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo actualizado' });
            } else {
                await axios.post('/api/assets', formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo creado' });
            }
            setDisplayDialog(false);
            fetchAssets();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error guardando activo' });
        }
    };

    const handleDeleteAsset = async (asset) => {
        if (confirm(`¿Eliminar activo ${asset.nombre}?`)) {
            try {
                await axios.delete(`/api/assets/${asset.id}`);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo eliminado' });
                fetchAssets();
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error eliminando activo' });
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
                    icon="pi pi-qrcode"
                    className="p-button-rounded p-button-info p-button-sm"
                    tooltip="Ver QR"
                    tooltipPosition="top"
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={() => handleDeleteAsset(rowData)}
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
                    <h5 className="text-2xl font-bold">Gestión de Activos</h5>
                    <Button
                        label="Nuevo Activo"
                        icon="pi pi-plus"
                        onClick={() => handleOpenDialog()}
                        className="p-button-success"
                    />
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar activos..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={assets}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    striped
                >
                    <Column field="codigo" header="Código" sortable style={{ width: '12%' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ width: '20%' }} />
                    <Column field="marca" header="Marca" style={{ width: '12%' }} />
                    <Column
                        field="valor_compra"
                        header="Valor"
                        style={{ width: '15%' }}
                        body={(rowData) => `$${rowData.valor_compra?.toLocaleString('es-CO') || 0}`}
                    />
                    <Column
                        field="estado"
                        header="Estado"
                        style={{ width: '12%' }}
                        body={(rowData) => (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                rowData.estado === 'activo' ? 'bg-green-100 text-green-800' :
                                rowData.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {rowData.estado}
                            </span>
                        )}
                    />
                    <Column
                        body={actionBodyTemplate}
                        header="Acciones"
                        style={{ width: '14%' }}
                        frozen
                        alignFrozen="right"
                    />
                </DataTable>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog
                visible={displayDialog}
                style={{ width: '50vw' }}
                header={editingAsset ? 'Editar Activo' : 'Crear Nuevo Activo'}
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
                            disabled={!!editingAsset}
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
                        <label className="block text-sm font-semibold mb-2">Marca</label>
                        <InputText
                            value={formData.marca}
                            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Modelo</label>
                        <InputText
                            value={formData.modelo}
                            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
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
                    <div>
                        <label className="block text-sm font-semibold mb-2">Valor Compra</label>
                        <InputNumber
                            value={formData.valor_compra}
                            onValueChange={(e) => setFormData({ ...formData, valor_compra: e.value })}
                            locale="es-CO"
                            currency="COP"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Años Vida Útil</label>
                        <InputNumber
                            value={formData.vida_util_anos}
                            onValueChange={(e) => setFormData({ ...formData, vida_util_anos: e.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Guardar"
                        icon="pi pi-check"
                        onClick={handleSaveAsset}
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

export default Assets;
