import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function EditAsset({ user, asset: assetId }) {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingAsset, setLoadingAsset] = useState(true);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [assetTypes, setAssetTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);

    const estados = [
        { label: 'Activo', value: 'activo' },
        { label: 'Mantenimiento', value: 'mantenimiento' },
        { label: 'Inactivo', value: 'inactivo' },
        { label: 'Descartado', value: 'descartado' },
        { label: 'Retirado', value: 'retirado' },
    ];

    const tiposAdquisicion = [
        { label: 'Compra', value: 'compra' },
        { label: 'Donación', value: 'donacion' },
        { label: 'Transferencia', value: 'transferencia' },
        { label: 'Comodato', value: 'comodato' },
        { label: 'Leasing', value: 'leasing' },
    ];

    const metodosDepreciacion = [
        { label: 'Línea Recta', value: 'lineal' },
        { label: 'Acelerada', value: 'acelerada' },
        { label: 'Unidades Producidas', value: 'unidades_producidas' },
    ];

    const periodicidades = [
        { label: 'Mensual', value: 'mensual' },
        { label: 'Anual', value: 'anual' },
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
        asset_type_id: null,
        valor_compra: 0,
        valor_residual: 0,
        vida_util_anos: 5,
        fecha_adquisicion: new Date(),
        metodo_depreciacion: 'lineal',
        periodicidad_depreciacion: 'mensual',
        aplicar_regla_dia_15: true,
        estado: 'activo',
        tipo_adquisicion: 'compra',
        orden_compra: '',
        numero_factura: '',
        donante_nombre: '',
        donacion_documento: '',
        custom_values: [],
    });

    useEffect(() => {
        loadOptions();
        loadAsset();
    }, [assetId]);

    const loadOptions = async () => {
        try {
            const [catRes, locRes, supRes, empRes, typesRes] = await Promise.all([
                axios.get('/api/categories'),
                axios.get('/api/locations'),
                axios.get('/api/suppliers'),
                axios.get('/api/employees'),
                axios.get('/api/asset-types'),
            ]);
            setCategories(catRes.data.data || catRes.data);
            setLocations(locRes.data.data || locRes.data);
            setSuppliers(supRes.data.data || supRes.data);
            setEmployees(empRes.data.data || empRes.data);
            setAssetTypes(typesRes.data.data || typesRes.data);
        } catch (error) {
            console.error('Error loading options:', error);
        }
    };

    const loadAsset = async () => {
        try {
            const response = await axios.get(`/api/assets/${assetId}`);
            const asset = response.data;

            setFormData({
                codigo: asset.codigo || '',
                nombre: asset.nombre || '',
                descripcion: asset.descripcion || '',
                marca: asset.marca || '',
                modelo: asset.modelo || '',
                serie: asset.serie || '',
                categoria_id: asset.categoria_id || null,
                ubicacion_id: asset.ubicacion_id || null,
                proveedor_id: asset.proveedor_id || null,
                responsable_id: asset.responsable_id || null,
                asset_type_id: asset.asset_type_id || null,
                valor_compra: asset.valor_compra || 0,
                valor_residual: asset.valor_residual || 0,
                vida_util_anos: asset.vida_util_anos || 5,
                fecha_adquisicion: asset.fecha_adquisicion ? new Date(asset.fecha_adquisicion) : new Date(),
                metodo_depreciacion: asset.metodo_depreciacion || 'lineal',
                periodicidad_depreciacion: asset.periodicidad_depreciacion || 'mensual',
                aplicar_regla_dia_15: asset.aplicar_regla_dia_15 ?? true,
                estado: asset.estado || 'activo',
                tipo_adquisicion: asset.tipo_adquisicion || 'compra',
                orden_compra: asset.orden_compra || '',
                numero_factura: asset.numero_factura || '',
                donante_nombre: asset.donante_nombre || '',
                donacion_documento: asset.donacion_documento || '',
                custom_values: asset.custom_values?.map(cv => ({
                    property_id: cv.asset_type_property_id || cv.property_id,
                    valor: cv.valor || '',
                })) || [],
            });

            // Set selected type for custom properties
            if (asset.asset_type_id) {
                // Will be resolved after assetTypes loads
                setSelectedType(asset.tipo_bien || null);
            }
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar el activo',
            });
        } finally {
            setLoadingAsset(false);
        }
    };

    // Resolve selectedType once assetTypes are loaded
    useEffect(() => {
        if (formData.asset_type_id && assetTypes.length > 0) {
            const type = assetTypes.find(t => t.id === formData.asset_type_id);
            if (type) {
                setSelectedType(type);
            }
        }
    }, [assetTypes, formData.asset_type_id]);

    const handleTypeChange = (typeId) => {
        const type = assetTypes.find(t => t.id === typeId);
        setSelectedType(type);
        setFormData(prev => ({
            ...prev,
            asset_type_id: typeId,
            vida_util_anos: type?.vida_util_default || prev.vida_util_anos,
            custom_values: type?.properties?.map(p => {
                // Preserve existing values when switching types
                const existing = prev.custom_values.find(cv => cv.property_id === p.id);
                return { property_id: p.id, valor: existing?.valor || '' };
            }) || [],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = { ...formData };

            // Format date
            if (data.fecha_adquisicion instanceof Date) {
                data.fecha_adquisicion = data.fecha_adquisicion.toISOString().split('T')[0];
            }

            // Remove empty/null values
            Object.keys(data).forEach(key => {
                if (data[key] === '' || data[key] === null) {
                    delete data[key];
                }
            });

            await axios.put(`/api/assets/${assetId}`, data);

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Activo actualizado correctamente',
            });
            setTimeout(() => router.visit(`/assets/${assetId}`), 1500);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || error.response?.data?.error || 'Error al actualizar el activo',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCustomValueChange = (propertyId, valor) => {
        setFormData(prev => ({
            ...prev,
            custom_values: prev.custom_values.map(cv =>
                cv.property_id === propertyId ? { ...cv, valor } : cv
            ),
        }));
    };

    const esDonacion = formData.tipo_adquisicion === 'donacion';

    if (loadingAsset) {
        return (
            <AppLayout user={user}>
                <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <ProgressSpinner />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />
            <Card className="m-2 md:m-4">
                {/* Encabezado */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <i className="pi pi-pencil text-3xl text-primary"></i>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold m-0">Editar Activo</h2>
                            <p className="text-gray-500 text-sm m-0">
                                {formData.codigo} — {formData.nombre}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="Ver Detalle"
                            icon="pi pi-eye"
                            severity="info"
                            outlined
                            onClick={() => router.visit(`/assets/${assetId}`)}
                        />
                        <Button
                            label="Volver"
                            icon="pi pi-arrow-left"
                            severity="secondary"
                            outlined
                            onClick={() => router.visit('/assets')}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ═══════════════ INFORMACIÓN BÁSICA ═══════════════ */}
                    <Divider align="left">
                        <span className="font-bold text-primary">
                            <i className="pi pi-id-card mr-2"></i>Información Básica
                        </span>
                    </Divider>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Código <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                name="codigo"
                                value={formData.codigo}
                                onChange={handleInputChange}
                                className="w-full"
                                required
                                disabled
                            />
                            <small className="text-gray-400">El código no se puede modificar</small>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className="w-full"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Descripción</label>
                            <InputTextarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                className="w-full"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Bien</label>
                            <Dropdown
                                value={formData.asset_type_id}
                                options={assetTypes}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => handleTypeChange(e.value)}
                                placeholder="Seleccionar tipo"
                                className="w-full"
                                showClear
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Categoría <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={formData.categoria_id}
                                options={categories}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => setFormData({ ...formData, categoria_id: e.value })}
                                placeholder="Seleccionar categoría"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Marca</label>
                            <InputText
                                name="marca"
                                value={formData.marca}
                                onChange={handleInputChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Modelo</label>
                            <InputText
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleInputChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Número de Serie</label>
                            <InputText
                                name="serie"
                                value={formData.serie}
                                onChange={handleInputChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ubicación <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={formData.ubicacion_id}
                                options={locations}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => setFormData({ ...formData, ubicacion_id: e.value })}
                                placeholder="Seleccionar ubicación"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Responsable</label>
                            <Dropdown
                                value={formData.responsable_id}
                                options={employees}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => setFormData({ ...formData, responsable_id: e.value })}
                                placeholder="Empleado a cargo"
                                className="w-full"
                                showClear
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Estado</label>
                            <Dropdown
                                value={formData.estado}
                                options={estados}
                                onChange={(e) => setFormData({ ...formData, estado: e.value })}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* ═══════════════ PROPIEDADES PERSONALIZADAS ═══════════════ */}
                    {selectedType?.properties?.length > 0 && (
                        <>
                            <Divider align="left">
                                <span className="font-bold text-primary">
                                    <i className="pi pi-list mr-2"></i>Propiedades de {selectedType.nombre}
                                </span>
                            </Divider>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedType.properties.map(prop => (
                                    <div key={prop.id}>
                                        <label className="block text-sm font-medium mb-2">
                                            {prop.etiqueta} {prop.es_requerido && <span className="text-red-500">*</span>}
                                        </label>
                                        {prop.tipo_dato === 'select' ? (
                                            <Dropdown
                                                value={formData.custom_values.find(cv => cv.property_id === prop.id)?.valor || ''}
                                                options={prop.opciones?.map(o => ({ label: o, value: o })) || []}
                                                onChange={(e) => handleCustomValueChange(prop.id, e.value)}
                                                className="w-full"
                                                required={prop.es_requerido}
                                            />
                                        ) : prop.tipo_dato === 'number' ? (
                                            <InputNumber
                                                value={formData.custom_values.find(cv => cv.property_id === prop.id)?.valor || null}
                                                onChange={(e) => handleCustomValueChange(prop.id, e.value?.toString() || '')}
                                                className="w-full"
                                                required={prop.es_requerido}
                                            />
                                        ) : prop.tipo_dato === 'date' ? (
                                            <Calendar
                                                value={formData.custom_values.find(cv => cv.property_id === prop.id)?.valor ? new Date(formData.custom_values.find(cv => cv.property_id === prop.id)?.valor) : null}
                                                onChange={(e) => handleCustomValueChange(prop.id, e.value?.toISOString().split('T')[0] || '')}
                                                className="w-full"
                                                dateFormat="yy-mm-dd"
                                                required={prop.es_requerido}
                                            />
                                        ) : (
                                            <InputText
                                                value={formData.custom_values.find(cv => cv.property_id === prop.id)?.valor || ''}
                                                onChange={(e) => handleCustomValueChange(prop.id, e.target.value)}
                                                className="w-full"
                                                required={prop.es_requerido}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ═══════════════ ADQUISICIÓN ═══════════════ */}
                    <Divider align="left">
                        <span className="font-bold text-primary">
                            <i className="pi pi-shopping-cart mr-2"></i>Información de Adquisición
                        </span>
                    </Divider>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Adquisición</label>
                            <Dropdown
                                value={formData.tipo_adquisicion}
                                options={tiposAdquisicion}
                                onChange={(e) => setFormData({ ...formData, tipo_adquisicion: e.value })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Fecha de Adquisición</label>
                            <Calendar
                                value={formData.fecha_adquisicion}
                                onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.value })}
                                className="w-full"
                                dateFormat="yy-mm-dd"
                            />
                        </div>

                        {!esDonacion && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Proveedor</label>
                                    <Dropdown
                                        value={formData.proveedor_id}
                                        options={suppliers}
                                        optionLabel="nombre"
                                        optionValue="id"
                                        onChange={(e) => setFormData({ ...formData, proveedor_id: e.value })}
                                        placeholder="Seleccionar proveedor"
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Orden de Compra</label>
                                    <InputText
                                        name="orden_compra"
                                        value={formData.orden_compra}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Número de Factura</label>
                                    <InputText
                                        name="numero_factura"
                                        value={formData.numero_factura}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}

                        {esDonacion && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nombre del Donante</label>
                                    <InputText
                                        name="donante_nombre"
                                        value={formData.donante_nombre}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Documento de Donación</label>
                                    <InputText
                                        name="donacion_documento"
                                        value={formData.donacion_documento}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* ═══════════════ VALORES Y DEPRECIACIÓN ═══════════════ */}
                    <Divider align="left">
                        <span className="font-bold text-primary">
                            <i className="pi pi-dollar mr-2"></i>Valores y Depreciación
                        </span>
                    </Divider>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-4">
                        <p className="text-sm text-yellow-700 m-0">
                            <i className="pi pi-exclamation-triangle mr-2"></i>
                            Modificar el valor de compra no afectará las depreciaciones ya calculadas.
                            Los cambios aplicarán a partir del próximo cálculo.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor de Compra</label>
                            <InputNumber
                                value={formData.valor_compra}
                                onChange={(e) => setFormData({ ...formData, valor_compra: e.value })}
                                className="w-full"
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                disabled
                            />
                            <small className="text-gray-400">El valor de compra no se puede modificar</small>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor Residual</label>
                            <InputNumber
                                value={formData.valor_residual}
                                onChange={(e) => setFormData({ ...formData, valor_residual: e.value })}
                                className="w-full"
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Vida Útil (años)</label>
                            <InputNumber
                                value={formData.vida_util_anos}
                                onChange={(e) => setFormData({ ...formData, vida_util_anos: e.value })}
                                className="w-full"
                                min={1}
                                max={100}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Método de Depreciación</label>
                            <Dropdown
                                value={formData.metodo_depreciacion}
                                options={metodosDepreciacion}
                                onChange={(e) => setFormData({ ...formData, metodo_depreciacion: e.value })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Periodicidad</label>
                            <Dropdown
                                value={formData.periodicidad_depreciacion}
                                options={periodicidades}
                                onChange={(e) => setFormData({ ...formData, periodicidad_depreciacion: e.value })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <InputSwitch
                                checked={formData.aplicar_regla_dia_15}
                                onChange={(e) => setFormData({ ...formData, aplicar_regla_dia_15: e.value })}
                            />
                            <label className="text-sm">
                                Aplicar regla del día 15
                                <span className="block text-xs text-gray-500">
                                    Si se adquiere después del 15, deprecia desde el mes siguiente
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* ═══════════════ BOTONES ═══════════════ */}
                    <Divider />
                    <div className="flex flex-col md:flex-row gap-2 mt-6">
                        <Button
                            type="submit"
                            label="Guardar Cambios"
                            icon="pi pi-check"
                            loading={loading}
                            className="p-button-success flex-1 md:flex-none"
                        />
                        <Button
                            type="button"
                            label="Cancelar"
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={() => router.visit(`/assets/${assetId}`)}
                            className="flex-1 md:flex-none"
                        />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
