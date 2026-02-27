import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const dataTypeOptions = [
    { label: 'Texto', value: 'texto' },
    { label: 'Número entero', value: 'numero' },
    { label: 'Número decimal', value: 'decimal' },
    { label: 'Fecha', value: 'fecha' },
    { label: 'Sí / No', value: 'booleano' },
    { label: 'Selección (lista)', value: 'seleccion' },
    { label: 'Texto largo', value: 'textarea' },
];

const AssetTypes = ({ user }) => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);

    // Type dialog
    const [displayTypeDialog, setDisplayTypeDialog] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [typeForm, setTypeForm] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        es_depreciable: true,
        vida_util_default: null,
        cuenta_contable: '',
    });

    // Properties dialog
    const [displayPropsDialog, setDisplayPropsDialog] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [displayPropForm, setDisplayPropForm] = useState(false);
    const [editingProp, setEditingProp] = useState(null);
    const [propForm, setPropForm] = useState({
        nombre: '',
        etiqueta: '',
        tipo_dato: 'texto',
        opciones: [],
        requerido: false,
        orden: 0,
    });
    const [newOption, setNewOption] = useState('');

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const response = await axios.get('/api/asset-types');
            setTypes(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando tipos de bien' });
            setLoading(false);
        }
    };

    // ═══════════════ TYPE CRUD ═══════════════

    const handleOpenTypeDialog = (type = null) => {
        if (type) {
            setEditingType(type);
            setTypeForm({
                nombre: type.nombre,
                codigo: type.codigo,
                descripcion: type.descripcion || '',
                es_depreciable: type.es_depreciable,
                vida_util_default: type.vida_util_default,
                cuenta_contable: type.cuenta_contable || '',
            });
        } else {
            setEditingType(null);
            setTypeForm({
                nombre: '',
                codigo: '',
                descripcion: '',
                es_depreciable: true,
                vida_util_default: null,
                cuenta_contable: '',
            });
        }
        setDisplayTypeDialog(true);
    };

    const handleSaveType = async () => {
        try {
            if (editingType) {
                await axios.put(`/api/asset-types/${editingType.id}`, typeForm);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo de bien actualizado' });
            } else {
                await axios.post('/api/asset-types', typeForm);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo de bien creado' });
            }
            setDisplayTypeDialog(false);
            fetchTypes();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error guardando tipo de bien';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    const handleDeleteType = async (type) => {
        if (confirm(`¿Eliminar tipo "${type.nombre}"?`)) {
            try {
                await axios.delete(`/api/asset-types/${type.id}`);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo de bien eliminado' });
                fetchTypes();
            } catch (error) {
                const msg = error.response?.data?.message || 'Error eliminando tipo';
                toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
            }
        }
    };

    // ═══════════════ PROPERTIES ═══════════════

    const handleOpenPropsDialog = (type) => {
        setSelectedType(type);
        setDisplayPropsDialog(true);
    };

    const handleOpenPropForm = (prop = null) => {
        if (prop) {
            setEditingProp(prop);
            setPropForm({
                nombre: prop.nombre,
                etiqueta: prop.etiqueta,
                tipo_dato: prop.tipo_dato,
                opciones: prop.opciones || [],
                requerido: prop.requerido,
                orden: prop.orden,
            });
        } else {
            setEditingProp(null);
            const maxOrder = selectedType?.properties?.length
                ? Math.max(...selectedType.properties.map(p => p.orden)) + 1
                : 0;
            setPropForm({
                nombre: '',
                etiqueta: '',
                tipo_dato: 'texto',
                opciones: [],
                requerido: false,
                orden: maxOrder,
            });
        }
        setNewOption('');
        setDisplayPropForm(true);
    };

    const handleSaveProp = async () => {
        try {
            const payload = { ...propForm };
            if (payload.tipo_dato !== 'seleccion') {
                payload.opciones = null;
            }

            if (editingProp) {
                await axios.put(`/api/asset-types/${selectedType.id}/properties/${editingProp.id}`, payload);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Propiedad actualizada' });
            } else {
                await axios.post(`/api/asset-types/${selectedType.id}/properties`, payload);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Propiedad agregada' });
            }
            setDisplayPropForm(false);
            // Refrescar tipo seleccionado
            const res = await axios.get(`/api/asset-types/${selectedType.id}`);
            setSelectedType(res.data);
            fetchTypes();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error guardando propiedad';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    const handleDeleteProp = async (prop) => {
        if (confirm(`¿Eliminar propiedad "${prop.etiqueta}"?`)) {
            try {
                await axios.delete(`/api/asset-types/${selectedType.id}/properties/${prop.id}`);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Propiedad eliminada' });
                const res = await axios.get(`/api/asset-types/${selectedType.id}`);
                setSelectedType(res.data);
                fetchTypes();
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error eliminando propiedad' });
            }
        }
    };

    const handleAddOption = () => {
        if (newOption.trim()) {
            setPropForm({ ...propForm, opciones: [...propForm.opciones, newOption.trim()] });
            setNewOption('');
        }
    };

    const handleRemoveOption = (idx) => {
        setPropForm({ ...propForm, opciones: propForm.opciones.filter((_, i) => i !== idx) });
    };

    // ═══════════════ TEMPLATES ═══════════════

    const depreciableTemplate = (rowData) => (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            rowData.es_depreciable ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
            {rowData.es_depreciable ? 'Depreciable' : 'No depreciable'}
        </span>
    );

    const propsCountTemplate = (rowData) => (
        <span className="font-medium">{rowData.properties?.length || 0} propiedades</span>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-list"
                className="p-button-rounded p-button-info p-button-sm"
                onClick={() => handleOpenPropsDialog(rowData)}
                tooltip="Configurar propiedades"
                tooltipPosition="top"
            />
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-warning p-button-sm"
                onClick={() => handleOpenTypeDialog(rowData)}
                tooltip="Editar"
                tooltipPosition="top"
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-sm"
                onClick={() => handleDeleteType(rowData)}
                tooltip="Eliminar"
                tooltipPosition="top"
            />
        </div>
    );

    const propTypeTemplate = (rowData) => {
        const opt = dataTypeOptions.find(d => d.value === rowData.tipo_dato);
        return opt ? opt.label : rowData.tipo_dato;
    };

    const propActionTemplate = (rowData) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-warning p-button-sm"
                onClick={() => handleOpenPropForm(rowData)}
                tooltip="Editar"
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-sm"
                onClick={() => handleDeleteProp(rowData)}
                tooltip="Eliminar"
            />
        </div>
    );

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <Card className="bg-white shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="text-2xl font-bold">Tipos de Bien</h5>
                    <Button
                        label="Nuevo Tipo"
                        icon="pi pi-plus"
                        onClick={() => handleOpenTypeDialog()}
                        className="p-button-success"
                    />
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar tipos de bien..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={types}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    striped
                >
                    <Column field="codigo" header="Código" sortable style={{ width: '10%' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ width: '22%' }} />
                    <Column header="Depreciable" body={depreciableTemplate} style={{ width: '15%' }} />
                    <Column field="vida_util_default" header="Vida Útil (años)" style={{ width: '12%' }}
                        body={(r) => r.vida_util_default ?? '-'} />
                    <Column field="cuenta_contable" header="Cuenta Contable" style={{ width: '12%' }}
                        body={(r) => r.cuenta_contable || '-'} />
                    <Column header="Propiedades" body={propsCountTemplate} style={{ width: '12%' }} />
                    <Column body={actionBodyTemplate} header="Acciones" style={{ width: '15%' }} />
                </DataTable>
            </Card>

            {/* ═══════ Type Create/Edit Dialog ═══════ */}
            <Dialog
                visible={displayTypeDialog}
                style={{ width: '45vw' }}
                header={editingType ? 'Editar Tipo de Bien' : 'Crear Nuevo Tipo de Bien'}
                modal
                className="p-fluid"
                onHide={() => setDisplayTypeDialog(false)}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Código</label>
                        <InputText
                            value={typeForm.codigo}
                            onChange={(e) => setTypeForm({ ...typeForm, codigo: e.target.value })}
                            disabled={!!editingType}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: INM, VEH, COMP"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nombre</label>
                        <InputText
                            value={typeForm.nombre}
                            onChange={(e) => setTypeForm({ ...typeForm, nombre: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: Bienes Inmuebles"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Descripción</label>
                        <InputText
                            value={typeForm.descripcion}
                            onChange={(e) => setTypeForm({ ...typeForm, descripcion: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold">¿Es depreciable?</label>
                        <InputSwitch
                            checked={typeForm.es_depreciable}
                            onChange={(e) => setTypeForm({ ...typeForm, es_depreciable: e.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Vida Útil por Defecto (años)</label>
                        <InputNumber
                            value={typeForm.vida_util_default}
                            onValueChange={(e) => setTypeForm({ ...typeForm, vida_util_default: e.value })}
                            min={1}
                            max={100}
                            placeholder="Opcional"
                            className="w-full"
                            disabled={!typeForm.es_depreciable}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-2">Cuenta Contable</label>
                        <InputText
                            value={typeForm.cuenta_contable}
                            onChange={(e) => setTypeForm({ ...typeForm, cuenta_contable: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: 1540, 1520"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button label="Guardar" icon="pi pi-check" onClick={handleSaveType} className="p-button-success" />
                    <Button label="Cancelar" icon="pi pi-times" onClick={() => setDisplayTypeDialog(false)} className="p-button-secondary" />
                </div>
            </Dialog>

            {/* ═══════ Properties Management Dialog ═══════ */}
            <Dialog
                visible={displayPropsDialog}
                style={{ width: '65vw' }}
                header={`Propiedades: ${selectedType?.nombre || ''}`}
                modal
                onHide={() => setDisplayPropsDialog(false)}
            >
                <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Configura las propiedades personalizadas que tendrán los activos de tipo <strong>{selectedType?.nombre}</strong>.
                    </p>
                    <Button
                        label="Agregar Propiedad"
                        icon="pi pi-plus"
                        onClick={() => handleOpenPropForm()}
                        className="p-button-success p-button-sm"
                    />
                </div>

                <DataTable
                    value={selectedType?.properties || []}
                    className="w-full"
                    emptyMessage="No hay propiedades configuradas. Agrega la primera."
                >
                    <Column field="orden" header="#" sortable style={{ width: '8%' }} />
                    <Column field="etiqueta" header="Etiqueta" style={{ width: '22%' }} />
                    <Column field="nombre" header="Nombre Técnico" style={{ width: '18%' }}
                        body={(r) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{r.nombre}</code>} />
                    <Column header="Tipo de Dato" body={propTypeTemplate} style={{ width: '15%' }} />
                    <Column header="Requerido" style={{ width: '10%' }}
                        body={(r) => r.requerido ? <i className="pi pi-check text-green-600" /> : <i className="pi pi-minus text-gray-400" />} />
                    <Column header="Opciones" style={{ width: '15%' }}
                        body={(r) => r.opciones?.length > 0
                            ? r.opciones.map((o, i) => <Chip key={i} label={o} className="mr-1 mb-1 text-xs" />)
                            : '-'
                        } />
                    <Column body={propActionTemplate} header="Acciones" style={{ width: '12%' }} />
                </DataTable>
            </Dialog>

            {/* ═══════ Property Add/Edit Dialog ═══════ */}
            <Dialog
                visible={displayPropForm}
                style={{ width: '40vw' }}
                header={editingProp ? 'Editar Propiedad' : 'Agregar Propiedad'}
                modal
                className="p-fluid"
                onHide={() => setDisplayPropForm(false)}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nombre Técnico</label>
                        <InputText
                            value={propForm.nombre}
                            onChange={(e) => setPropForm({ ...propForm, nombre: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            disabled={!!editingProp}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: area_m2, placa"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Etiqueta (visible al usuario)</label>
                        <InputText
                            value={propForm.etiqueta}
                            onChange={(e) => setPropForm({ ...propForm, etiqueta: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: Área (m²), Placa"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo de Dato</label>
                        <Dropdown
                            value={propForm.tipo_dato}
                            onChange={(e) => setPropForm({ ...propForm, tipo_dato: e.value })}
                            options={dataTypeOptions}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Orden</label>
                        <InputNumber
                            value={propForm.orden}
                            onValueChange={(e) => setPropForm({ ...propForm, orden: e.value })}
                            min={0}
                            className="w-full"
                        />
                    </div>
                    <div className="col-span-2 flex items-center gap-3">
                        <label className="text-sm font-semibold">¿Es requerido?</label>
                        <InputSwitch
                            checked={propForm.requerido}
                            onChange={(e) => setPropForm({ ...propForm, requerido: e.value })}
                        />
                    </div>

                    {propForm.tipo_dato === 'seleccion' && (
                        <div className="col-span-2">
                            <Divider />
                            <label className="block text-sm font-semibold mb-2">Opciones de la lista</label>
                            <div className="flex gap-2 mb-3">
                                <InputText
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                    placeholder="Escribir opción y presionar Enter"
                                />
                                <Button icon="pi pi-plus" onClick={handleAddOption} className="p-button-sm" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {propForm.opciones.map((opt, idx) => (
                                    <Chip
                                        key={idx}
                                        label={opt}
                                        removable
                                        onRemove={() => handleRemoveOption(idx)}
                                    />
                                ))}
                                {propForm.opciones.length === 0 && (
                                    <p className="text-sm text-gray-400">Agrega al menos una opción</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-6">
                    <Button label="Guardar" icon="pi pi-check" onClick={handleSaveProp} className="p-button-success" />
                    <Button label="Cancelar" icon="pi pi-times" onClick={() => setDisplayPropForm(false)} className="p-button-secondary" />
                </div>
            </Dialog>
        </AppLayout>
    );
};

export default AssetTypes;
