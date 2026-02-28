import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Image } from 'primereact/image';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function ShowAsset({ user, assetId }) {
    const toast = useRef(null);
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadDialog, setUploadDialog] = useState(false);
    const [uploadData, setUploadData] = useState({
        archivo: null,
        tipo: 'otro',
        descripcion: '',
        es_principal: false,
    });

    const tiposArchivo = [
        { label: 'Foto', value: 'foto' },
        { label: 'Factura', value: 'factura' },
        { label: 'Orden de Compra', value: 'orden_compra' },
        { label: 'Garantía', value: 'garantia' },
        { label: 'Manual', value: 'manual' },
        { label: 'Otro', value: 'otro' },
    ];

    useEffect(() => {
        loadAsset();
    }, [assetId]);

    const loadAsset = async () => {
        try {
            const response = await axios.get(`/api/assets/${assetId}`);
            setAsset(response.data);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar el activo',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES');
    };

    const getEstadoSeverity = (estado) => {
        const severities = {
            activo: 'success',
            mantenimiento: 'warning',
            inactivo: 'secondary',
            descartado: 'danger',
            retirado: 'danger',
            vendido: 'info',
        };
        return severities[estado] || 'secondary';
    };

    const handleUploadAttachment = async () => {
        if (!uploadData.archivo) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un archivo' });
            return;
        }

        const formData = new FormData();
        formData.append('archivo', uploadData.archivo);
        formData.append('tipo', uploadData.tipo);
        formData.append('descripcion', uploadData.descripcion);
        formData.append('es_principal', uploadData.es_principal ? '1' : '0');

        try {
            await axios.post(`/api/assets/${asset.id}/attachments`, formData);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Archivo subido' });
            setUploadDialog(false);
            setUploadData({ archivo: null, tipo: 'otro', descripcion: '', es_principal: false });
            loadAsset();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al subir archivo' });
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm('¿Eliminar este archivo?')) return;

        try {
            await axios.delete(`/api/assets/${asset.id}/attachments/${attachmentId}`);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Archivo eliminado' });
            loadAsset();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar' });
        }
    };

    if (loading) {
        return (
            <AppLayout user={user}>
                <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }} />
                </div>
            </AppLayout>
        );
    }

    if (!asset) {
        return (
            <AppLayout user={user}>
                <Card className="m-4">
                    <p>Activo no encontrado</p>
                    <Button label="Volver" icon="pi pi-arrow-left" onClick={() => router.visit('/assets')} />
                </Card>
            </AppLayout>
        );
    }

    const depInfo = asset.info_depreciacion || {};

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            {/* Encabezado */}
            <Card className="m-2 md:m-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Foto principal */}
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                            {asset.foto_principal?.url ? (
                                <Image
                                    src={asset.foto_principal.url}
                                    alt={asset.nombre}
                                    width="150"
                                    preview
                                    className="border-round"
                                />
                            ) : (
                                <div
                                    className="flex align-items-center justify-content-center bg-gray-200 border-round"
                                    style={{ width: 150, height: 150 }}
                                >
                                    <i className="pi pi-image text-gray-400" style={{ fontSize: '3rem' }} />
                                </div>
                            )}
                        </div>

                        {/* Info básica */}
                        <div className="text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
                                <h1 className="text-xl md:text-2xl font-bold m-0">{asset.nombre}</h1>
                                <Tag value={asset.estado} severity={getEstadoSeverity(asset.estado)} />
                            </div>
                            <p className="text-lg text-gray-600 m-0">{asset.codigo}</p>
                            {asset.descripcion && <p className="mt-2">{asset.descripcion}</p>}
                            <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-3 text-sm">
                                <span><strong>Marca:</strong> {asset.marca || '-'}</span>
                                <span><strong>Modelo:</strong> {asset.modelo || '-'}</span>
                                <span><strong>Serie:</strong> {asset.serie || '-'}</span>
                            </div>
                            {asset.tipo_bien && (
                                <Tag value={asset.tipo_bien.nombre} severity="info" className="mt-2" />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-2">
                        <Button
                            label="Editar"
                            icon="pi pi-pencil"
                            severity="warning"
                            className="flex-1 md:flex-none"
                            onClick={() => router.visit(`/assets/${asset.id}/edit`)}
                        />
                        <Button
                            label="QR"
                            icon="pi pi-qrcode"
                            severity="secondary"
                            className="flex-1 md:flex-none"
                            onClick={() => window.open(`/api/assets/${asset.id}/qr`, '_blank')}
                        />
                        <Button
                            label="Volver"
                            icon="pi pi-arrow-left"
                            outlined
                            className="flex-1 md:flex-none"
                            onClick={() => router.visit('/assets')}
                        />
                    </div>
                </div>
            </Card>

            {/* Pestañas */}
            <Card className="m-2 md:m-4">
                <TabView>
                    {/* ═══════════════ INFORMACIÓN GENERAL ═══════════════ */}
                    <TabPanel header="Info" leftIcon="pi pi-info-circle mr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="p-3 surface-100 border-round">
                                <p className="text-sm text-gray-500 m-0">Categoría</p>
                                <p className="font-semibold m-0">{asset.categoria?.nombre || '-'}</p>
                            </div>
                            <div className="p-3 surface-100 border-round">
                                <p className="text-sm text-gray-500 m-0">Ubicación</p>
                                <p className="font-semibold m-0">{asset.ubicacion?.nombre || '-'}</p>
                            </div>
                            <div className="p-3 surface-100 border-round">
                                <p className="text-sm text-gray-500 m-0">Responsable</p>
                                <p className="font-semibold m-0">{asset.responsable?.nombre || 'Sin asignar'}</p>
                            </div>
                            <div className="p-3 surface-100 border-round">
                                <p className="text-sm text-gray-500 m-0">Proveedor</p>
                                <p className="font-semibold m-0">{asset.proveedor?.nombre || '-'}</p>
                            </div>
                            <div className="p-3 surface-100 border-round">
                                <p className="text-sm text-gray-500 m-0">Tipo de Adquisición</p>
                                <p className="font-semibold m-0 capitalize">{asset.tipo_adquisicion || 'Compra'}</p>
                            </div>
                            <div className="p-3 surface-100 border-round">
                                <p className="text-sm text-gray-500 m-0">Fecha Adquisición</p>
                                <p className="font-semibold m-0">{formatDate(asset.fecha_adquisicion)}</p>
                            </div>
                            {asset.orden_compra && (
                                <div className="p-3 surface-100 border-round">
                                    <p className="text-sm text-gray-500 m-0">Orden de Compra</p>
                                    <p className="font-semibold m-0">{asset.orden_compra}</p>
                                </div>
                            )}
                            {asset.numero_factura && (
                                <div className="p-3 surface-100 border-round">
                                    <p className="text-sm text-gray-500 m-0">Número de Factura</p>
                                    <p className="font-semibold m-0">{asset.numero_factura}</p>
                                </div>
                            )}
                            {asset.donante_nombre && (
                                <div className="p-3 surface-100 border-round">
                                    <p className="text-sm text-gray-500 m-0">Donante</p>
                                    <p className="font-semibold m-0">{asset.donante_nombre}</p>
                                </div>
                            )}
                        </div>

                        {/* Propiedades personalizadas */}
                        {asset.custom_values?.length > 0 && (
                            <>
                                <Divider />
                                <h3 className="mb-3">Propiedades Adicionales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {asset.custom_values.map(cv => (
                                        <div key={cv.id} className="p-3 surface-100 border-round">
                                            <p className="text-sm text-gray-500 m-0">{cv.property?.etiqueta}</p>
                                            <p className="font-semibold m-0">{cv.valor || '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </TabPanel>

                    {/* ═══════════════ DEPRECIACIÓN ═══════════════ */}
                    <TabPanel header="Depreciación" leftIcon="pi pi-chart-line mr-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Panel izquierdo: valores */}
                            <div>
                                <h3 className="mb-3 text-lg">Valores</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Valor de Compra</p>
                                        <p className="text-lg md:text-xl font-bold m-0 text-primary">{formatCurrency(asset.valor_compra)}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Valor Residual</p>
                                        <p className="text-lg md:text-xl font-bold m-0">{formatCurrency(asset.valor_residual)}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Depreciación Acumulada</p>
                                        <p className="text-lg md:text-xl font-bold m-0 text-orange-500">{formatCurrency(depInfo.depreciacion_acumulada)}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Valor en Libros</p>
                                        <p className="text-lg md:text-xl font-bold m-0 text-green-500">{formatCurrency(depInfo.valor_en_libros)}</p>
                                    </div>
                                </div>

                                <h3 className="mt-4 mb-3 text-lg">Configuración</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Método</p>
                                        <p className="font-semibold m-0 capitalize">{asset.metodo_depreciacion || 'Lineal'}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Periodicidad</p>
                                        <p className="font-semibold m-0 capitalize">{asset.periodicidad_depreciacion || 'Mensual'}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Vida Útil</p>
                                        <p className="font-semibold m-0">{asset.vida_util_anos || 0} años</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Inicio Depreciación</p>
                                        <p className="font-semibold m-0">{formatDate(depInfo.fecha_inicio)}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Depreciación Mensual</p>
                                        <p className="font-semibold m-0">{formatCurrency(depInfo.depreciacion_mensual)}</p>
                                    </div>
                                    <div className="p-3 surface-100 border-round">
                                        <p className="text-sm text-gray-500 m-0">Depreciación Anual</p>
                                        <p className="font-semibold m-0">{formatCurrency(depInfo.depreciacion_anual)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Panel derecho: progreso y gráfico */}
                            <div>
                                <h3 className="mb-3">Vida Útil Transcurrida</h3>
                                <div className="p-4 surface-100 border-round">
                                    <div className="flex justify-content-between mb-2">
                                        <span>{depInfo.meses_depreciados || 0} meses transcurridos</span>
                                        <span>{(asset.vida_util_anos || 0) * 12} meses totales</span>
                                    </div>
                                    <ProgressBar
                                        value={depInfo.porcentaje_vida_util || 0}
                                        showValue
                                        className="mb-3"
                                        color={depInfo.porcentaje_vida_util > 80 ? '#ef4444' : depInfo.porcentaje_vida_util > 50 ? '#f97316' : '#22c55e'}
                                    />
                                    <p className="text-center text-sm text-gray-500">
                                        {depInfo.porcentaje_vida_util?.toFixed(1)}% de vida útil consumida
                                    </p>
                                </div>

                                {/* Historial de depreciaciones */}
                                {asset.depreciaciones?.length > 0 && (
                                    <>
                                        <h3 className="mt-4 mb-3">Historial de Depreciación</h3>
                                        <DataTable value={asset.depreciaciones} size="small" scrollable scrollHeight="200px">
                                            <Column field="ano" header="Año" />
                                            <Column field="mes" header="Mes" />
                                            <Column field="depreciacion_valor" header="Monto" body={(row) => formatCurrency(row.depreciacion_valor)} />
                                            <Column field="depreciacion_acumulada" header="Acumulado" body={(row) => formatCurrency(row.depreciacion_acumulada)} />
                                            <Column field="valor_en_libros" header="Valor Libros" body={(row) => formatCurrency(row.valor_en_libros)} />
                                        </DataTable>
                                    </>
                                )}
                            </div>
                        </div>
                    </TabPanel>

                    {/* ═══════════════ MOVIMIENTOS ═══════════════ */}
                    <TabPanel header="Movimientos" leftIcon="pi pi-history mr-2">
                        <DataTable value={asset.movimientos || []} emptyMessage="Sin movimientos registrados">
                            <Column field="created_at" header="Fecha" body={(row) => formatDate(row.created_at)} />
                            <Column field="tipo" header="Tipo" body={(row) => <Tag value={row.tipo} />} />
                            <Column field="ubicacion_anterior.nombre" header="Origen" />
                            <Column field="ubicacion_nueva.nombre" header="Destino" />
                            <Column field="motivo" header="Motivo" />
                            <Column field="usuario.name" header="Usuario" />
                        </DataTable>
                    </TabPanel>

                    {/* ═══════════════ REVALÚOS ═══════════════ */}
                    <TabPanel header="Revalúos" leftIcon="pi pi-dollar mr-2">
                        <DataTable value={asset.valuaciones || []} emptyMessage="Sin revalúos registrados">
                            <Column field="fecha_efectiva" header="Fecha" body={(row) => formatDate(row.fecha_efectiva)} />
                            <Column field="valor_anterior" header="Valor Anterior" body={(row) => formatCurrency(row.valor_anterior)} />
                            <Column field="valor_nuevo" header="Valor Nuevo" body={(row) => formatCurrency(row.valor_nuevo)} />
                            <Column field="metodo" header="Método" />
                            <Column field="tipo_revaluo" header="Tipo" />
                            <Column field="notas" header="Notas" />
                        </DataTable>
                    </TabPanel>

                    {/* ═══════════════ ARCHIVOS ═══════════════ */}
                    <TabPanel header="Archivos" leftIcon="pi pi-folder mr-2">
                        <div className="flex justify-content-end mb-3">
                            <Button
                                label="Subir Archivo"
                                icon="pi pi-upload"
                                onClick={() => setUploadDialog(true)}
                            />
                        </div>

                        <DataTable value={asset.attachments || []} emptyMessage="Sin archivos adjuntos">
                            <Column field="nombre_original" header="Nombre" />
                            <Column field="tipo" header="Tipo" body={(row) => <Tag value={row.tipo} />} />
                            <Column field="tamano_formateado" header="Tamaño" />
                            <Column field="descripcion" header="Descripción" />
                            <Column
                                header="Acciones"
                                body={(row) => (
                                    <div className="flex gap-2">
                                        <Button
                                            icon="pi pi-download"
                                            rounded
                                            text
                                            onClick={() => window.open(row.url, '_blank')}
                                        />
                                        <Button
                                            icon="pi pi-trash"
                                            rounded
                                            text
                                            severity="danger"
                                            onClick={() => handleDeleteAttachment(row.id)}
                                        />
                                    </div>
                                )}
                            />
                        </DataTable>
                    </TabPanel>
                </TabView>
            </Card>

            {/* Dialog subir archivo */}
            <Dialog
                header="Subir Archivo"
                visible={uploadDialog}
                onHide={() => setUploadDialog(false)}
                style={{ width: '500px' }}
            >
                <div className="flex flex-column gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-2">Archivo *</label>
                        <FileUpload
                            mode="basic"
                            accept="image/*,.pdf,.doc,.docx"
                            maxFileSize={10000000}
                            chooseLabel="Seleccionar"
                            onSelect={(e) => setUploadData({ ...uploadData, archivo: e.files[0] })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Tipo</label>
                        <Dropdown
                            value={uploadData.tipo}
                            options={tiposArchivo}
                            onChange={(e) => setUploadData({ ...uploadData, tipo: e.value })}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Descripción</label>
                        <InputTextarea
                            value={uploadData.descripcion}
                            onChange={(e) => setUploadData({ ...uploadData, descripcion: e.target.value })}
                            className="w-full"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" severity="secondary" onClick={() => setUploadDialog(false)} />
                        <Button label="Subir" icon="pi pi-upload" onClick={handleUploadAttachment} />
                    </div>
                </div>
            </Dialog>
        </AppLayout>
    );
}
