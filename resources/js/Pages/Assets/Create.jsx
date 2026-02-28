import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function CreateAsset({ user }) {
    const toast = useRef(null);
    const fileUploadRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [assetTypes, setAssetTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [foto, setFoto] = useState(null);
    const [documentos, setDocumentos] = useState([]);

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
        // Nuevos campos
        tipo_adquisicion: 'compra',
        orden_compra: '',
        numero_factura: '',
        donante_nombre: '',
        donacion_documento: '',
        custom_values: [],
    });

    useEffect(() => {
        loadOptions();
    }, []);

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

    const handleTypeChange = (typeId) => {
        const type = assetTypes.find(t => t.id === typeId);
        setSelectedType(type);
        setFormData(prev => ({
            ...prev,
            asset_type_id: typeId,
            vida_util_anos: type?.vida_util_default || prev.vida_util_anos,
            custom_values: type?.properties?.map(p => ({ property_id: p.id, valor: '' })) || [],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Usar FormData para enviar archivos
            const data = new FormData();

            // Agregar campos del formulario
            Object.keys(formData).forEach(key => {
                if (key === 'custom_values') {
                    data.append(key, JSON.stringify(formData[key]));
                } else if (key === 'fecha_adquisicion') {
                    data.append(key, formData[key].toISOString().split('T')[0]);
                } else if (formData[key] !== null && formData[key] !== '') {
                    data.append(key, formData[key]);
                }
            });

            // Agregar foto si existe
            if (foto) {
                data.append('foto', foto);
            }

            // Agregar documentos
            documentos.forEach((doc, index) => {
                data.append(`documentos[${index}]`, doc);
            });

            await axios.post('/api/assets', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Activo creado correctamente',
            });
            setTimeout(() => router.visit('/assets'), 1500);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al crear el activo',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCustomValueChange = (propertyId, valor) => {
        setFormData(prev => ({
            ...prev,
            custom_values: prev.custom_values.map(cv =>
                cv.property_id === propertyId ? { ...cv, valor } : cv
            )
        }));
    };

    const esDonacion = formData.tipo_adquisicion === 'donacion';

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />
            <Card className="m-4">
                <h2 className="text-2xl font-bold mb-4">Crear Nuevo Activo</h2>
                <form onSubmit={handleSubmit}>
                    {/* ═══════════════ INFORMACIÓN BÁSICA ═══════════════ */}
                    <Divider align="left"><span className="font-bold text-primary">Información Básica</span></Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Código *</label>
                            <InputText
                                name="codigo"
                                value={formData.codigo}
                                onChange={handleInputChange}
                                className="w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Nombre *</label>
                            <InputText
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                className="w-full"
                                required
                            />
                        </div>
                        <div className="col-span-2">
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
                            <label className="block text-sm font-medium mb-2">Categoría *</label>
                            <Dropdown
                                value={formData.categoria_id}
                                options={categories}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => setFormData({...formData, categoria_id: e.value})}
                                placeholder="Seleccionar categoría"
                                className="w-full"
                                required
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
                            <label className="block text-sm font-medium mb-2">Serie</label>
                            <InputText
                                name="serie"
                                value={formData.serie}
                                onChange={handleInputChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Ubicación *</label>
                            <Dropdown
                                value={formData.ubicacion_id}
                                options={locations}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => setFormData({...formData, ubicacion_id: e.value})}
                                placeholder="Seleccionar ubicación"
                                className="w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Responsable</label>
                            <Dropdown
                                value={formData.responsable_id}
                                options={employees}
                                optionLabel="nombre"
                                optionValue="id"
                                onChange={(e) => setFormData({...formData, responsable_id: e.value})}
                                placeholder="Seleccionar responsable"
                                className="w-full"
                                showClear
                            />
                        </div>
                    </div>

                    {/* ═══════════════ PROPIEDADES PERSONALIZADAS ═══════════════ */}
                    {selectedType?.properties?.length > 0 && (
                        <>
                            <Divider align="left"><span className="font-bold text-primary">Propiedades de {selectedType.nombre}</span></Divider>
                            <div className="grid grid-cols-2 gap-4">
                                {selectedType.properties.map(prop => (
                                    <div key={prop.id}>
                                        <label className="block text-sm font-medium mb-2">
                                            {prop.etiqueta} {prop.es_requerido && '*'}
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
                    <Divider align="left"><span className="font-bold text-primary">Información de Adquisición</span></Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Adquisición *</label>
                            <Dropdown
                                value={formData.tipo_adquisicion}
                                options={tiposAdquisicion}
                                onChange={(e) => setFormData({...formData, tipo_adquisicion: e.value})}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Fecha de Adquisición *</label>
                            <Calendar
                                value={formData.fecha_adquisicion}
                                onChange={(e) => setFormData({...formData, fecha_adquisicion: e.value})}
                                className="w-full"
                                dateFormat="yy-mm-dd"
                                required
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
                                        onChange={(e) => setFormData({...formData, proveedor_id: e.value})}
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
                                    <label className="block text-sm font-medium mb-2">Nombre del Donante *</label>
                                    <InputText
                                        name="donante_nombre"
                                        value={formData.donante_nombre}
                                        onChange={handleInputChange}
                                        className="w-full"
                                        required={esDonacion}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Documento de Donación</label>
                                    <InputText
                                        name="donacion_documento"
                                        value={formData.donacion_documento}
                                        onChange={handleInputChange}
                                        className="w-full"
                                        placeholder="Número de acta, convenio, etc."
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* ═══════════════ VALORES Y DEPRECIACIÓN ═══════════════ */}
                    <Divider align="left"><span className="font-bold text-primary">Valores y Depreciación</span></Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor de Compra *</label>
                            <InputNumber
                                value={formData.valor_compra}
                                onChange={(e) => setFormData({...formData, valor_compra: e.value})}
                                className="w-full"
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor Residual</label>
                            <InputNumber
                                value={formData.valor_residual}
                                onChange={(e) => setFormData({...formData, valor_residual: e.value})}
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
                                onChange={(e) => setFormData({...formData, vida_util_anos: e.value})}
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
                                onChange={(e) => setFormData({...formData, metodo_depreciacion: e.value})}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Periodicidad</label>
                            <Dropdown
                                value={formData.periodicidad_depreciacion}
                                options={periodicidades}
                                onChange={(e) => setFormData({...formData, periodicidad_depreciacion: e.value})}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <InputSwitch
                                checked={formData.aplicar_regla_dia_15}
                                onChange={(e) => setFormData({...formData, aplicar_regla_dia_15: e.value})}
                            />
                            <label className="text-sm">
                                Aplicar regla del día 15
                                <span className="block text-xs text-gray-500">
                                    Si se adquiere después del 15, deprecia desde el mes siguiente
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* ═══════════════ ARCHIVOS ADJUNTOS ═══════════════ */}
                    <Divider align="left"><span className="font-bold text-primary">Archivos Adjuntos</span></Divider>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Foto del Activo</label>
                            <FileUpload
                                ref={fileUploadRef}
                                mode="basic"
                                accept="image/*"
                                maxFileSize={5000000}
                                chooseLabel="Seleccionar foto"
                                onSelect={(e) => setFoto(e.files[0])}
                                onClear={() => setFoto(null)}
                            />
                            {foto && <p className="text-sm text-green-600 mt-1">✓ {foto.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Documentos (factura, garantía, etc.)</label>
                            <FileUpload
                                mode="basic"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                maxFileSize={10000000}
                                chooseLabel="Seleccionar documentos"
                                onSelect={(e) => setDocumentos(e.files)}
                                onClear={() => setDocumentos([])}
                            />
                            {documentos.length > 0 && (
                                <p className="text-sm text-green-600 mt-1">✓ {documentos.length} archivo(s) seleccionado(s)</p>
                            )}
                        </div>
                    </div>

                    {/* ═══════════════ BOTONES ═══════════════ */}
                    <div className="flex gap-2 mt-6">
                        <Button
                            type="submit"
                            label="Guardar Activo"
                            icon="pi pi-check"
                            loading={loading}
                        />
                        <Button
                            type="button"
                            label="Cancelar"
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={() => router.visit('/assets')}
                        />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
