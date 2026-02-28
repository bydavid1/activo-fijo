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
import { InputSwitch } from 'primereact/inputswitch';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
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
    const [tiposBien, setTiposBien] = useState([]);
    const [selectedTypeProps, setSelectedTypeProps] = useState([]);
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
    const [barcodeUrl, setBarcodeUrl] = useState('');
    const [labelUrl, setLabelUrl] = useState('');
    const [loadingCode, setLoadingCode] = useState(false);
    const [activeCodeTab, setActiveCodeTab] = useState(0);

    // Sell dialog state
    const [displaySellDialog, setDisplaySellDialog] = useState(false);
    const [sellAsset, setSellAsset] = useState(null);
    const [sellData, setSellData] = useState({
        tipo_venta: 'directa',
        tipo_pago: 'efectivo',
        condicion_pago: 'contado',
        precio_venta: 0,
        comprador_nombre: '',
        comprador_documento: '',
        comprador_telefono: '',
        motivo: '',
    });

    const tiposVenta = [
        { label: 'Venta Directa', value: 'directa' },
        { label: 'Subasta', value: 'subasta' },
        { label: 'Licitación', value: 'licitacion' },
    ];

    const tiposPago = [
        { label: 'Efectivo', value: 'efectivo' },
        { label: 'Transferencia', value: 'transferencia' },
        { label: 'Cheque', value: 'cheque' },
        { label: 'Tarjeta', value: 'tarjeta' },
        { label: 'Otro', value: 'otro' },
    ];

    const condicionesPago = [
        { label: 'Al Contado', value: 'contado' },
        { label: 'Crédito 30 días', value: 'credito_30' },
        { label: 'Crédito 60 días', value: 'credito_60' },
        { label: 'Crédito 90 días', value: 'credito_90' },
    ];

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
        asset_type_id: null,
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
        custom_values: {},
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
            setTiposBien(data.tipos_bien || []);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleTypeChange = (typeId) => {
        const tipo = tiposBien.find(t => t.id === typeId);
        const props = tipo?.properties || [];
        setSelectedTypeProps(props);

        const updates = { asset_type_id: typeId, custom_values: {} };
        // Pre-fill custom_values keys
        props.forEach(p => { updates.custom_values[p.id] = ''; });

        if (tipo) {
            if (!tipo.es_depreciable) {
                updates.vida_util_anos = null;
                updates.valor_residual = 0;
                updates.metodo_depreciacion = null;
            } else if (tipo.vida_util_default) {
                updates.vida_util_anos = tipo.vida_util_default;
            }
        }
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const getSelectedTypeIsDepreciable = () => {
        if (!formData.asset_type_id) return true; // default: show depreciation fields
        const tipo = tiposBien.find(t => t.id === formData.asset_type_id);
        return tipo ? tipo.es_depreciable : true;
    };

    const handleOpenDialog = (asset = null) => {
        if (asset) {
            setEditingAsset(asset);
            // Build custom_values map from existing asset
            const cv = {};
            (asset.custom_values || []).forEach(v => {
                cv[v.asset_type_property_id] = v.valor || '';
            });
            // Load type properties
            const tipo = tiposBien.find(t => t.id === asset.asset_type_id);
            setSelectedTypeProps(tipo?.properties || []);
            // Fill any missing property keys
            (tipo?.properties || []).forEach(p => {
                if (!(p.id in cv)) cv[p.id] = '';
            });
            setFormData({
                ...asset,
                fecha_adquisicion: asset.fecha_adquisicion ? new Date(asset.fecha_adquisicion) : new Date(),
                custom_values: cv,
            });
        } else {
            setEditingAsset(null);
            setSelectedTypeProps([]);
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                marca: '',
                modelo: '',
                serie: '',
                asset_type_id: null,
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
                custom_values: {},
            });
        }
        setDisplayDialog(true);
    };

    const handleSaveAsset = async () => {
        try {
            // Convert custom_values map to array format
            const customValuesArray = Object.entries(formData.custom_values || {}).map(([propId, valor]) => ({
                property_id: parseInt(propId),
                valor: valor?.toString() || '',
            }));
            const payload = {
                ...formData,
                custom_values: customValuesArray,
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
        setActiveCodeTab(0);
        setDisplayQrDialog(true);
        await loadQrCode(asset.id);
    };

    const loadQrCode = async (assetId) => {
        setLoadingCode(true);
        try {
            const response = await axios.get(`/api/assets/${assetId}/qr`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setQrUrl(url);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error generando QR' });
        }
        setLoadingCode(false);
    };

    const loadBarcode = async (assetId) => {
        if (barcodeUrl) return; // Already loaded
        setLoadingCode(true);
        try {
            const response = await axios.get(`/api/assets/${assetId}/barcode`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setBarcodeUrl(url);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error generando código de barras' });
        }
        setLoadingCode(false);
    };

    const loadLabel = async (assetId) => {
        if (labelUrl) return; // Already loaded
        setLoadingCode(true);
        try {
            const response = await axios.get(`/api/assets/${assetId}/label`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setLabelUrl(url);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error generando etiqueta' });
        }
        setLoadingCode(false);
    };

    const handleCodeTabChange = (e) => {
        setActiveCodeTab(e.index);
        if (qrAsset) {
            if (e.index === 1) {
                loadBarcode(qrAsset.id);
            } else if (e.index === 2) {
                loadLabel(qrAsset.id);
            }
        }
    };

    const closeCodeDialog = () => {
        setDisplayQrDialog(false);
        setQrUrl('');
        setBarcodeUrl('');
        setLabelUrl('');
        setActiveCodeTab(0);
    };

    const handlePrint = async (imageUrl, title) => {
        try {
            // Convert blob URL to data URL for cross-window compatibility
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = () => {
                const dataUrl = reader.result;
                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'El navegador bloqueó la ventana emergente. Permita ventanas emergentes para imprimir.' });
                    return;
                }
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            @page { margin: 10mm; }
                            body {
                                margin: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                            }
                            img { max-width: 100%; height: auto; }
                            @media print {
                                body { margin: 0; }
                                img { max-width: 100%; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataUrl}" onload="setTimeout(() => { window.print(); window.close(); }, 100);" />
                    </body>
                    </html>
                `);
                printWindow.document.close();
            };

            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Print error:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error al preparar la impresión' });
        }
    };

    // Sell
    const handleOpenSell = (asset) => {
        setSellAsset(asset);
        setSellData({
            tipo_venta: 'directa',
            tipo_pago: 'efectivo',
            condicion_pago: 'contado',
            precio_venta: asset.valor_compra || 0,
            comprador_nombre: '',
            comprador_documento: '',
            comprador_telefono: '',
            motivo: '',
        });
        setDisplaySellDialog(true);
    };

    const handleSell = async () => {
        if (!sellData.comprador_nombre) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese el nombre del comprador' });
            return;
        }
        try {
            await axios.post(`/api/assets/${sellAsset.id}/sell`, sellData);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Activo vendido correctamente' });
            setDisplaySellDialog(false);
            fetchAssets();
        } catch (error) {
            const msg = error.response?.data?.error || 'Error al vender activo';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
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

    const handleDownloadBarcode = () => {
        if (barcodeUrl && qrAsset) {
            const link = document.createElement('a');
            link.href = barcodeUrl;
            link.setAttribute('download', `barcode_${qrAsset.codigo}.png`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        }
    };

    const handleDownloadLabel = () => {
        if (labelUrl && qrAsset) {
            const link = document.createElement('a');
            link.href = labelUrl;
            link.setAttribute('download', `label_${qrAsset.codigo}.png`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        }
    };

    const updateCustomValue = (propId, value) => {
        setFormData(prev => ({
            ...prev,
            custom_values: { ...prev.custom_values, [propId]: value },
        }));
    };

    const renderCustomField = (prop) => {
        const value = formData.custom_values?.[prop.id] ?? '';
        switch (prop.tipo_dato) {
            case 'texto':
                return (
                    <InputText
                        value={value}
                        onChange={(e) => updateCustomValue(prop.id, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                );
            case 'numero':
                return (
                    <InputNumber
                        value={value ? parseInt(value) : null}
                        onValueChange={(e) => updateCustomValue(prop.id, e.value)}
                        className="w-full"
                    />
                );
            case 'decimal':
                return (
                    <InputNumber
                        value={value ? parseFloat(value) : null}
                        onValueChange={(e) => updateCustomValue(prop.id, e.value)}
                        minFractionDigits={2}
                        maxFractionDigits={4}
                        className="w-full"
                    />
                );
            case 'fecha':
                return (
                    <Calendar
                        value={value ? new Date(value) : null}
                        onChange={(e) => updateCustomValue(prop.id, e.value instanceof Date ? e.value.toISOString().split('T')[0] : e.value)}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className="w-full"
                    />
                );
            case 'booleano':
                return (
                    <InputSwitch
                        checked={value === '1' || value === 'true' || value === true}
                        onChange={(e) => updateCustomValue(prop.id, e.value ? '1' : '0')}
                    />
                );
            case 'seleccion':
                return (
                    <Dropdown
                        value={value}
                        onChange={(e) => updateCustomValue(prop.id, e.value)}
                        options={(prop.opciones || []).map(o => ({ label: o, value: o }))}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar"
                        showClear
                        className="w-full"
                    />
                );
            case 'textarea':
                return (
                    <InputTextarea
                        value={value}
                        onChange={(e) => updateCustomValue(prop.id, e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                );
            default:
                return (
                    <InputText
                        value={value}
                        onChange={(e) => updateCustomValue(prop.id, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                );
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-info p-button-sm"
                    onClick={() => window.location.href = `/assets/${rowData.id}`}
                    tooltip="Ver Detalle"
                    tooltipPosition="top"
                />
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-warning p-button-sm"
                    onClick={() => handleOpenDialog(rowData)}
                    tooltip="Editar"
                    tooltipPosition="top"
                />
                <Button
                    icon="pi pi-qrcode"
                    className="p-button-rounded p-button-secondary p-button-sm"
                    onClick={() => handleShowQr(rowData)}
                    tooltip="Ver QR"
                    tooltipPosition="top"
                />
                {rowData.estado === 'activo' && (
                    <>
                        <Button
                            icon="pi pi-shopping-cart"
                            className="p-button-rounded p-button-success p-button-sm"
                            onClick={() => handleOpenSell(rowData)}
                            tooltip="Vender"
                            tooltipPosition="top"
                        />
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
                    <Column field="nombre" header="Nombre" sortable style={{ width: '16%' }} />
                    <Column field="marca" header="Marca" style={{ width: '8%' }} />
                    <Column
                        header="Tipo"
                        style={{ width: '10%' }}
                        body={(rowData) => rowData.tipo_bien?.nombre || '-'}
                    />
                    <Column
                        header="Categoría"
                        style={{ width: '10%' }}
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
                        <label className="block text-sm font-semibold mb-2">Tipo de Bien</label>
                        <Dropdown
                            value={formData.asset_type_id}
                            onChange={(e) => handleTypeChange(e.value)}
                            options={tiposBien.map(t => ({ label: t.nombre, value: t.id }))}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            showClear
                            placeholder="Seleccionar tipo"
                            className="w-full"
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
                            disabled={!getSelectedTypeIsDepreciable()}
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
                    {getSelectedTypeIsDepreciable() && (
                        <>
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
                        </>
                    )}

                    {/* Dynamic Custom Fields */}
                    {selectedTypeProps.length > 0 && (
                        <>
                            <div className="col-span-3">
                                <Divider />
                                <h6 className="text-lg font-semibold mb-2 text-blue-700">
                                    Propiedades de {tiposBien.find(t => t.id === formData.asset_type_id)?.nombre || 'Tipo'}
                                </h6>
                            </div>
                            {selectedTypeProps.map((prop) => (
                                <div key={prop.id}>
                                    <label className="block text-sm font-semibold mb-2">
                                        {prop.etiqueta}
                                        {prop.requerido && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {renderCustomField(prop)}
                                </div>
                            ))}
                        </>
                    )}
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

            {/* QR / Barcode / Label Dialog */}
            <Dialog
                visible={displayQrDialog}
                style={{ width: '500px', maxWidth: '95vw' }}
                header={`Códigos: ${qrAsset?.codigo || ''} - ${qrAsset?.nombre || ''}`}
                modal
                onHide={closeCodeDialog}
            >
                <TabView activeIndex={activeCodeTab} onTabChange={handleCodeTabChange}>
                    <TabPanel header="Código QR" leftIcon="pi pi-qrcode mr-2">
                        <div className="flex flex-col items-center p-4">
                            {loadingCode && activeCodeTab === 0 ? (
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            ) : qrUrl ? (
                                <>
                                    <img src={qrUrl} alt="QR Code" className="mb-4" style={{ width: 250, height: 250 }} />
                                    <div className="flex gap-2">
                                        <Button
                                            label="Descargar"
                                            icon="pi pi-download"
                                            onClick={handleDownloadQr}
                                            className="p-button-info"
                                        />
                                        <Button
                                            label="Imprimir"
                                            icon="pi pi-print"
                                            onClick={() => handlePrint(qrUrl, `QR_${qrAsset?.codigo}`)}
                                            className="p-button-secondary"
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500">Error cargando QR</p>
                            )}
                        </div>
                    </TabPanel>
                    <TabPanel header="Código de Barras" leftIcon="pi pi-bars mr-2">
                        <div className="flex flex-col items-center p-4">
                            {loadingCode && activeCodeTab === 1 ? (
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            ) : barcodeUrl ? (
                                <>
                                    <img src={barcodeUrl} alt="Barcode" className="mb-4" style={{ maxWidth: '100%', height: 'auto' }} />
                                    <p className="text-sm text-gray-600 mb-4">{qrAsset?.codigo}</p>
                                    <div className="flex gap-2">
                                        <Button
                                            label="Descargar"
                                            icon="pi pi-download"
                                            onClick={handleDownloadBarcode}
                                            className="p-button-info"
                                        />
                                        <Button
                                            label="Imprimir"
                                            icon="pi pi-print"
                                            onClick={() => handlePrint(barcodeUrl, `Barcode_${qrAsset?.codigo}`)}
                                            className="p-button-secondary"
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500">Cargando código de barras...</p>
                            )}
                        </div>
                    </TabPanel>
                    <TabPanel header="Etiqueta" leftIcon="pi pi-tag mr-2">
                        <div className="flex flex-col items-center p-4">
                            {loadingCode && activeCodeTab === 2 ? (
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                            ) : labelUrl ? (
                                <>
                                    <div className="border rounded p-2 mb-4 bg-white">
                                        <img src={labelUrl} alt="Label" style={{ maxWidth: '100%', height: 'auto' }} />
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 text-center">
                                        Etiqueta optimizada para impresoras térmicas de viñetas (400x200px)
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            label="Descargar"
                                            icon="pi pi-download"
                                            onClick={handleDownloadLabel}
                                            className="p-button-info"
                                        />
                                        <Button
                                            label="Imprimir Etiqueta"
                                            icon="pi pi-print"
                                            onClick={() => handlePrint(labelUrl, `Label_${qrAsset?.codigo}`)}
                                            className="p-button-success"
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500">Cargando etiqueta...</p>
                            )}
                        </div>
                    </TabPanel>
                </TabView>
            </Dialog>

            {/* Sell Dialog */}
            <Dialog
                visible={displaySellDialog}
                style={{ width: '50vw' }}
                header={`Vender Activo: ${sellAsset?.codigo || ''} - ${sellAsset?.nombre || ''}`}
                modal
                onHide={() => setDisplaySellDialog(false)}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo de Venta *</label>
                        <Dropdown
                            value={sellData.tipo_venta}
                            onChange={(e) => setSellData({ ...sellData, tipo_venta: e.value })}
                            options={tiposVenta}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo de Pago *</label>
                        <Dropdown
                            value={sellData.tipo_pago}
                            onChange={(e) => setSellData({ ...sellData, tipo_pago: e.value })}
                            options={tiposPago}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Condición de Pago *</label>
                        <Dropdown
                            value={sellData.condicion_pago}
                            onChange={(e) => setSellData({ ...sellData, condicion_pago: e.value })}
                            options={condicionesPago}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Precio de Venta *</label>
                        <InputNumber
                            value={sellData.precio_venta}
                            onChange={(e) => setSellData({ ...sellData, precio_venta: e.value })}
                            mode="currency"
                            currency="USD"
                            locale="en-US"
                            className="w-full"
                        />
                    </div>
                    <Divider className="col-span-2" />
                    <div className="col-span-2">
                        <p className="font-semibold mb-2">Datos del Comprador</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nombre del Comprador *</label>
                        <InputText
                            value={sellData.comprador_nombre}
                            onChange={(e) => setSellData({ ...sellData, comprador_nombre: e.target.value })}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Documento/NIT</label>
                        <InputText
                            value={sellData.comprador_documento}
                            onChange={(e) => setSellData({ ...sellData, comprador_documento: e.target.value })}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Teléfono</label>
                        <InputText
                            value={sellData.comprador_telefono}
                            onChange={(e) => setSellData({ ...sellData, comprador_telefono: e.target.value })}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Motivo / Observaciones</label>
                        <InputText
                            value={sellData.motivo}
                            onChange={(e) => setSellData({ ...sellData, motivo: e.target.value })}
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <Button
                        label="Confirmar Venta"
                        icon="pi pi-shopping-cart"
                        onClick={handleSell}
                        className="p-button-success"
                    />
                    <Button
                        label="Cancelar"
                        icon="pi pi-times"
                        onClick={() => setDisplaySellDialog(false)}
                        className="p-button-secondary"
                    />
                </div>
            </Dialog>
        </AppLayout>
    );
};

export default Assets;
