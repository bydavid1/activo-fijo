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
    const [employees, setEmployees] = useState([]);
    const [depreciationMethods, setDepreciationMethods] = useState([]);
    const toast = useRef(null);

    // Dispose dialog state
    const [displayDisposeDialog, setDisplayDisposeDialog] = useState(false);
    const [disposeAsset, setDisposeAsset] = useState(null);
    const [disposeData, setDisposeData] = useState({
        motivo: '',
        valor_venta: 0,
        fecha_baja: new Date(),
    });

    // Revalue dialog state
    const [displayRevalueDialog, setDisplayRevalueDialog] = useState(false);
    const [revalueAsset, setRevalueAsset] = useState(null);
    const [revalueData, setRevalueData] = useState({
        valor_nuevo: 0,
        fecha_efectiva: new Date(),
        metodo: 'tasacion',
        observaciones: '',
    });

    // QR dialog state
    const [displayQrDialog, setDisplayQrDialog] = useState(false);
    const [qrAsset, setQrAsset] = useState(null);
    const [qrUrl, setQrUrl] = useState('');

    const revalueMethods = [
        { label: 'Tasación', value: 'tasacion' },
        { label: 'Mercado', value: 'mercado' },
        { label: 'Reposición', value: 'reposicion' },
    ];

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
        responsable_id: null,
        metodo_depreciacion: null,
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
            const data = response.data;
            setCategories((data.categorias || []).map(c => ({ label: c.nombre, value: c.id })));
            setLocations((data.ubicaciones || []).map(l => ({ label: l.nombre, value: l.id })));
            setSuppliers((data.proveedores || []).map(s => ({ label: s.nombre, value: s.id })));
            setEmployees((data.empleados || []).map(e => ({ label: e.nombre, value: e.id })));
            setDepreciationMethods((data.metodos_depreciacion || []).map(m => ({ label: m.label, value: m.value })));
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleOpenDialog = (asset = null) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                ...asset,
                fecha_adquisicion: asset.fecha_adquisicion ? new Date(asset.fecha_adquisicion) : new Date(),
            });
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
                responsable_id: null,
                metodo_depreciacion: null,
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
            const payload = {
                ...formData,
                fecha_adquisicion: formData.fecha_adquisicion instanceof Date
                    ? formData.fecha_adquisicion.toISOString().split('T')[0]
                    : formData.fecha_adquisicion,
            };
            if (editingAsset) {
                await axios.put(`/api/assets/${editingAsset.id}`, payload);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo actualizado' });
            } else {
                await axios.post('/api/assets', payload);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo creado' });
            }
            setDisplayDialog(false);
            fetchAssets();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error guardando activo';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
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

    // Dispose
    const handleOpenDispose = (asset) => {
        setDisposeAsset(asset);
        setDisposeData({ motivo: '', valor_venta: 0, fecha_baja: new Date() });
        setDisplayDisposeDialog(true);
    };

    const handleDispose = async () => {
        try {
            const payload = {
                ...disposeData,
                fecha_baja: disposeData.fecha_baja instanceof Date
                    ? disposeData.fecha_baja.toISOString().split('T')[0]
                    : disposeData.fecha_baja,
            };
            await axios.post(`/api/assets/${disposeAsset.id}/dispose`, payload);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo dado de baja correctamente' });
            setDisplayDisposeDialog(false);
            fetchAssets();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error dando de baja';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    // Revalue
    const handleOpenRevalue = (asset) => {
        setRevalueAsset(asset);
        setRevalueData({ valor_nuevo: asset.valor_compra || 0, fecha_efectiva: new Date(), metodo: 'tasacion', observaciones: '' });
        setDisplayRevalueDialog(true);
    };

    const handleRevalue = async () => {
        try {
            const payload = {
                ...revalueData,
                fecha_efectiva: revalueData.fecha_efectiva instanceof Date
                    ? revalueData.fecha_efectiva.toISOString().split('T')[0]
                    : revalueData.fecha_efectiva,
            };
            await axios.post(`/api/assets/${revalueAsset.id}/revalue`, payload);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo revalorizado correctamente' });
            setDisplayRevalueDialog(false);
            fetchAssets();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error revalorizando';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    // QR
    const handleShowQr = async (asset) => {
        setQrAsset(asset);
        try {
            const response = await axios.get(`/api/assets/${asset.id}/qr`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setQrUrl(url);
            setDisplayQrDialog(true);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error generando QR' });
        }
    };

    const handleDownloadQr = () => {
        if (qrUrl && qrAsset) {
            const link = document.createElement('a');
            link.href = qrUrl;
            link.setAttribute('download', `qr_${qrAsset.codigo}.png`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-1">
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
                    onClick={() => handleShowQr(rowData)}
                    tooltip="Ver QR"
                    tooltipPosition="top"
                />
                {rowData.estado === 'activo' && (
                    <>
                        <Button
                            icon="pi pi-ban"
                            className="p-button-rounded p-button-secondary p-button-sm"
                            onClick={() => handleOpenDispose(rowData)}
                            tooltip="Dar de Baja"
                            tooltipPosition="top"
                        />
                        <Button
                            icon="pi pi-dollar"
                            className="p-button-rounded p-button-help p-button-sm"
                            onClick={() => handleOpenRevalue(rowData)}
                            tooltip="Revalorizar"
                            tooltipPosition="top"
                        />
                    </>
                )}
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
                    <Column field="codigo" header="Código" sortable style={{ width: '10%' }} />
                    <Column field="nombre" header="Nombre" sortable style={{ width: '18%' }} />
                    <Column field="marca" header="Marca" style={{ width: '10%' }} />
                    <Column
                        header="Categoría"
                        style={{ width: '12%' }}
                        body={(rowData) => rowData.categoria?.nombre || '-'}
                    />
                    <Column
                        field="valor_compra"
                        header="Valor"
                        style={{ width: '12%' }}
                        body={(rowData) => `$${rowData.valor_compra?.toLocaleString('es-CO') || 0}`}
                    />
                    <Column
                        field="estado"
                        header="Estado"
                        style={{ width: '10%' }}
                        body={(rowData) => (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                rowData.estado === 'activo' ? 'bg-green-100 text-green-800' :
                                rowData.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                                rowData.estado === 'baja' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {rowData.estado}
                            </span>
                        )}
                    />
                    <Column
                        body={actionBodyTemplate}
                        header="Acciones"
                        style={{ width: '18%' }}
                        frozen
                        alignFrozen="right"
                    />
                </DataTable>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog
                visible={displayDialog}
                style={{ width: '60vw' }}
                header={editingAsset ? 'Editar Activo' : 'Crear Nuevo Activo'}
                modal
                className="p-fluid"
                onHide={() => setDisplayDialog(false)}
            >
                <div className="grid grid-cols-3 gap-4">
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
                        <label className="block text-sm font-semibold mb-2">Serie</label>
                        <InputText
                            value={formData.serie}
                            onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
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
                    <div>
                        <label className="block text-sm font-semibold mb-2">Fecha Adquisición</label>
                        <Calendar
                            value={formData.fecha_adquisicion}
                            onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className="w-full"
                        />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-sm font-semibold mb-2">Descripción</label>
                        <InputText
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Categoría</label>
                        <Dropdown
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.value })}
                            options={categories}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Ubicación</label>
                        <Dropdown
                            value={formData.ubicacion_id}
                            onChange={(e) => setFormData({ ...formData, ubicacion_id: e.value })}
                            options={locations}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Proveedor</label>
                        <Dropdown
                            value={formData.proveedor_id}
                            onChange={(e) => setFormData({ ...formData, proveedor_id: e.value })}
                            options={suppliers}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Responsable</label>
                        <Dropdown
                            value={formData.responsable_id}
                            onChange={(e) => setFormData({ ...formData, responsable_id: e.value })}
                            options={employees}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Método Depreciación</label>
                        <Dropdown
                            value={formData.metodo_depreciacion}
                            onChange={(e) => setFormData({ ...formData, metodo_depreciacion: e.value })}
                            options={depreciationMethods}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Usar el de categoría"
                            showClear
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Estado</label>
                        <Dropdown
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.value })}
                            options={[
                                { label: 'Activo', value: 'activo' },
                                { label: 'Mantenimiento', value: 'mantenimiento' },
                                { label: 'Baja', value: 'baja' },
                            ]}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Valor Compra</label>
                        <InputNumber
                            value={formData.valor_compra}
                            onValueChange={(e) => setFormData({ ...formData, valor_compra: e.value })}
                            mode="currency"
                            currency="COP"
                            locale="es-CO"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Valor Residual</label>
                        <InputNumber
                            value={formData.valor_residual}
                            onValueChange={(e) => setFormData({ ...formData, valor_residual: e.value })}
                            mode="currency"
                            currency="COP"
                            locale="es-CO"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Vida Útil (años)</label>
                        <InputNumber
                            value={formData.vida_util_anos}
                            onValueChange={(e) => setFormData({ ...formData, vida_util_anos: e.value })}
                            min={1}
                            max={100}
                            className="w-full"
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

            {/* Dispose Dialog */}
            <Dialog
                visible={displayDisposeDialog}
                style={{ width: '35vw' }}
                header={`Dar de Baja: ${disposeAsset?.nombre || ''}`}
                modal
                className="p-fluid"
                onHide={() => setDisplayDisposeDialog(false)}
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Motivo de Baja</label>
                        <InputText
                            value={disposeData.motivo}
                            onChange={(e) => setDisposeData({ ...disposeData, motivo: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: Obsolescencia, daño irreparable..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Valor de Venta / Rescate</label>
                        <InputNumber
                            value={disposeData.valor_venta}
                            onValueChange={(e) => setDisposeData({ ...disposeData, valor_venta: e.value })}
                            mode="currency"
                            currency="COP"
                            locale="es-CO"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Fecha de Baja</label>
                        <Calendar
                            value={disposeData.fecha_baja}
                            onChange={(e) => setDisposeData({ ...disposeData, fecha_baja: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <Button
                        label="Confirmar Baja"
                        icon="pi pi-ban"
                        onClick={handleDispose}
                        className="p-button-danger"
                    />
                    <Button
                        label="Cancelar"
                        icon="pi pi-times"
                        onClick={() => setDisplayDisposeDialog(false)}
                        className="p-button-secondary"
                    />
                </div>
            </Dialog>

            {/* Revalue Dialog */}
            <Dialog
                visible={displayRevalueDialog}
                style={{ width: '35vw' }}
                header={`Revalorizar: ${revalueAsset?.nombre || ''}`}
                modal
                className="p-fluid"
                onHide={() => setDisplayRevalueDialog(false)}
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Valor actual: ${revalueAsset?.valor_compra?.toLocaleString('es-CO') || 0}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nuevo Valor</label>
                        <InputNumber
                            value={revalueData.valor_nuevo}
                            onValueChange={(e) => setRevalueData({ ...revalueData, valor_nuevo: e.value })}
                            mode="currency"
                            currency="COP"
                            locale="es-CO"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Método de Valoración</label>
                        <Dropdown
                            value={revalueData.metodo}
                            onChange={(e) => setRevalueData({ ...revalueData, metodo: e.value })}
                            options={revalueMethods}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Fecha Efectiva</label>
                        <Calendar
                            value={revalueData.fecha_efectiva}
                            onChange={(e) => setRevalueData({ ...revalueData, fecha_efectiva: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Observaciones</label>
                        <InputText
                            value={revalueData.observaciones}
                            onChange={(e) => setRevalueData({ ...revalueData, observaciones: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <Button
                        label="Confirmar Revalorización"
                        icon="pi pi-dollar"
                        onClick={handleRevalue}
                        className="p-button-help"
                    />
                    <Button
                        label="Cancelar"
                        icon="pi pi-times"
                        onClick={() => setDisplayRevalueDialog(false)}
                        className="p-button-secondary"
                    />
                </div>
            </Dialog>

            {/* QR Dialog */}
            <Dialog
                visible={displayQrDialog}
                style={{ width: '25vw' }}
                header={`QR: ${qrAsset?.codigo || ''}`}
                modal
                onHide={() => { setDisplayQrDialog(false); setQrUrl(''); }}
            >
                <div className="flex flex-col items-center">
                    {qrUrl && <img src={qrUrl} alt="QR Code" className="mb-4" style={{ width: 250, height: 250 }} />}
                    <Button
                        label="Descargar QR"
                        icon="pi pi-download"
                        onClick={handleDownloadQr}
                        className="p-button-info"
                    />
                </div>
            </Dialog>
        </AppLayout>
    );
};

export default Assets;
