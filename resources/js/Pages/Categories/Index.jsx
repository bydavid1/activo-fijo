import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Categories = ({ user }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const toast = useRef(null);

    const depreciationMethods = [
        { label: 'Lineal', value: 'lineal' },
        { label: 'Acelerada (Suma de dígitos)', value: 'acelerada' },
        { label: 'Unidades producidas', value: 'unidades_producidas' },
    ];

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        metodo_depreciacion: 'lineal',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/categories');
            setCategories(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando categorías' });
            setLoading(false);
        }
    };

    const handleOpenDialog = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                nombre: category.nombre,
                codigo: category.codigo,
                descripcion: category.descripcion || '',
                metodo_depreciacion: category.metodo_depreciacion || 'lineal',
            });
        } else {
            setEditingCategory(null);
            setFormData({
                nombre: '',
                codigo: '',
                descripcion: '',
                metodo_depreciacion: 'lineal',
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveCategory = async () => {
        try {
            if (editingCategory) {
                await axios.put(`/api/categories/${editingCategory.id}`, formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada' });
            } else {
                await axios.post('/api/categories', formData);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada' });
            }
            setDisplayDialog(false);
            fetchCategories();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error guardando categoría';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    const handleDeleteCategory = async (category) => {
        if (confirm(`¿Eliminar categoría "${category.nombre}"?`)) {
            try {
                await axios.delete(`/api/categories/${category.id}`);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Categoría eliminada' });
                fetchCategories();
            } catch (error) {
                const msg = error.response?.data?.message || 'Error eliminando categoría';
                toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
            }
        }
    };

    const depreciationMethodTemplate = (rowData) => {
        const method = depreciationMethods.find(m => m.value === rowData.metodo_depreciacion);
        return method ? method.label : rowData.metodo_depreciacion;
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
                    onClick={() => handleDeleteCategory(rowData)}
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
                    <h5 className="text-2xl font-bold">Categorías de Activos</h5>
                    <Button
                        label="Nueva Categoría"
                        icon="pi pi-plus"
                        onClick={() => handleOpenDialog()}
                        className="p-button-success"
                    />
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar categorías..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={categories}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    striped
                >
                    <Column field="codigo" header="Código" sortable style={{ width: '15%' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ width: '25%' }} />
                    <Column field="descripcion" header="Descripción" style={{ width: '25%' }} />
                    <Column
                        field="metodo_depreciacion"
                        header="Método Depreciación"
                        body={depreciationMethodTemplate}
                        style={{ width: '20%' }}
                    />
                    <Column
                        body={actionBodyTemplate}
                        header="Acciones"
                        style={{ width: '15%' }}
                    />
                </DataTable>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog
                visible={displayDialog}
                style={{ width: '40vw' }}
                header={editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
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
                            disabled={!!editingCategory}
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
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Descripción</label>
                        <InputText
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Método de Depreciación</label>
                        <Dropdown
                            value={formData.metodo_depreciacion}
                            onChange={(e) => setFormData({ ...formData, metodo_depreciacion: e.value })}
                            options={depreciationMethods}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Guardar"
                        icon="pi pi-check"
                        onClick={handleSaveCategory}
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

export default Categories;
