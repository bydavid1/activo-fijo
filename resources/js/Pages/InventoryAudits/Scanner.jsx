import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import QRScanner from '@/Components/QRScanner';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Sidebar } from 'primereact/sidebar';
import { Divider } from 'primereact/divider';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';

export default function Scanner({ user, auditId }) {
    const [auditoria, setAuditoria] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [items, setItems] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showItemDetails, setShowItemDetails] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useRef(null);

    // Cargar datos de la auditoría
    useEffect(() => {
        loadAuditoria();
    }, [auditId]);

    // Actualizar datos cada 30 segundos si está en progreso
    useEffect(() => {
        let interval;
        if (auditoria?.estado === 'in_progress') {
            interval = setInterval(loadAuditoria, 30000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [auditoria?.estado]);

    const loadAuditoria = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/inventory-audits/${auditId}`);

            if (response.data.success) {
                const audit = response.data.auditoria;
                setAuditoria(audit);
                setItems(audit.items || []);
            }
        } catch (error) {
            console.error('Error cargando auditoría:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar la auditoría',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (codigo) => {
        if (scanning) return;

        try {
            setScanning(true);

            const response = await axios.post(`/api/inventory-audits/${auditId}/escanear`, {
                codigo: codigo.trim(),
                observaciones: ''
            });

            if (response.data.success) {
                const { tipo, activo, progreso, message } = response.data;

                // Mostrar mensaje según el tipo de resultado
                const severity = tipo === 'encontrado' ? 'success' :
                               tipo === 'extra' ? 'info' :
                               tipo === 'fuera_alcance' ? 'warn' : 'info';

                toast.current?.show({
                    severity,
                    summary: tipo === 'encontrado' ? '✅ Encontrado' :
                            tipo === 'extra' ? '➕ Extra' :
                            tipo === 'fuera_alcance' ? '🔍 Fuera de alcance' : 'Info',
                    detail: activo ? `${activo.codigo} - ${activo.nombre}` : message,
                    life: tipo === 'encontrado' ? 2000 : 4000
                });

                // Recargar datos
                await loadAuditoria();

                // Si es encontrado, mostrar brevemente los detalles
                if (tipo === 'encontrado' && activo) {
                    setSelectedItem(activo);
                    setShowItemDetails(true);
                    setTimeout(() => setShowItemDetails(false), 3000);
                }
            }
        } catch (error) {
            console.error('Error al escanear:', error);
            const errorMsg = error.response?.data?.message || 'Error al procesar el escaneo';

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMsg,
                life: 5000
            });
        } finally {
            setScanning(false);
        }
    };

    const finalizarLevantamiento = () => {
        confirmDialog({
            message: '¿Está seguro de finalizar el levantamiento? Esta acción no se puede deshacer.',
            header: 'Confirmar Finalización',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-success',
            acceptLabel: 'Sí, finalizar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    const response = await axios.post(`/api/inventory-audits/${auditId}/finalizar`);

                    if (response.data.success) {
                        toast.current?.show({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Levantamiento finalizado exitosamente',
                            life: 3000
                        });

                        // Navegar al reporte
                        setTimeout(() => {
                            router.visit(`/inventory-audits/${auditId}/report`);
                        }, 1500);
                    }
                } catch (error) {
                    console.error('Error al finalizar:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.response?.data?.message || 'Error al finalizar el levantamiento',
                        life: 5000
                    });
                }
            }
        });
    };

    const verDetalleItem = (item) => {
        setSelectedItem(item);
        setShowItemDetails(true);
    };

    // Filtrar items según búsqueda
    const filteredItems = (estado) => {
        return items.filter(item => {
            const matchesSearch = !searchTerm ||
                item.asset?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.asset?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.asset?.categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesEstado = estado === 'todos' || item.estado === estado;

            return matchesSearch && matchesEstado;
        });
    };

    // Template para mostrar items
    const itemTemplate = (item) => (
        <div
            key={item.id}
            className={`p-3 mb-2 border-1 border-round cursor-pointer transition-colors ${
                item.estado === 'found' ? 'bg-green-50 border-green-200' :
                item.estado === 'pending' ? 'bg-gray-50 border-gray-200' :
                item.estado === 'discrepant' ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'
            }`}
            onClick={() => verDetalleItem(item)}
        >
            <div className="flex justify-content-between align-items-center mb-2">
                <div className="flex align-items-center gap-2">
                    <Badge
                        value={item.asset?.codigo || 'N/A'}
                        className="p-badge-lg"
                    />
                    <span className="font-semibold">{item.asset?.nombre || 'Sin nombre'}</span>
                </div>

                {item.estado === 'found' && (
                    <i className="pi pi-check-circle text-green-500 text-xl"></i>
                )}
                {item.estado === 'discrepant' && (
                    <i className="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
                )}
                {item.estado === 'missing' && (
                    <i className="pi pi-times-circle text-red-500 text-xl"></i>
                )}
            </div>

            <div className="text-sm text-600">
                <div className="grid grid-cols-2 gap-2">
                    <div>Categoría: {item.asset?.categoria?.nombre || 'N/A'}</div>
                    <div>Ubicación: {item.asset?.ubicacion?.nombre || 'N/A'}</div>
                    <div>Responsable: {item.asset?.responsable?.nombre || 'N/A'}</div>
                    {item.fecha_escaneado && (
                        <div>Escaneado: {new Date(item.fecha_escaneado).toLocaleString()}</div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading || !auditoria) {
        return (
            <AppLayout user={user}>
                <Head title="Cargando..." />
                <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
                </div>
            </AppLayout>
        );
    }

    // Calcular estadísticas
    const stats = {
        total: items.length,
        encontrados: items.filter(i => i.estado === 'found').length,
        pendientes: items.filter(i => i.estado === 'pending').length,
        faltantes: items.filter(i => i.estado === 'missing').length,
        discrepantes: items.filter(i => i.estado === 'discrepant').length,
        progreso: auditoria.progreso || 0
    };

    return (
        <AppLayout user={user}>
            <Head title={`Scanner - ${auditoria.nombre}`} />

            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Header con información de la auditoría */}
            <Card className="mb-4">
                <div className="flex justify-content-between align-items-center mb-3">
                    <div>
                        <h2 className="m-0 mb-2">{auditoria.nombre}</h2>
                        <div className="flex gap-3 text-sm text-600">
                            <span>Código: {auditoria.codigo}</span>
                            <span>•</span>
                            <span>Estado: <Badge value="En Progreso" severity="warning" /></span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            label="Escanear"
                            icon="pi pi-camera"
                            className="p-button-lg"
                            onClick={() => setShowScanner(true)}
                            loading={scanning}
                        />

                        <Button
                            label="Finalizar"
                            icon="pi pi-check"
                            severity="success"
                            outlined
                            onClick={finalizarLevantamiento}
                        />
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="mb-3">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <span className="font-semibold">Progreso del Levantamiento</span>
                        <span className="text-600">{stats.encontrados}/{stats.total} activos</span>
                    </div>
                    <ProgressBar
                        value={stats.progreso}
                        style={{ height: '12px' }}
                        displayValueTemplate={() => `${stats.progreso.toFixed(1)}%`}
                    />
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-2 bg-green-50 border-round">
                        <div className="text-2xl font-bold text-green-600">{stats.encontrados}</div>
                        <div className="text-sm text-600">Encontrados</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 border-round">
                        <div className="text-2xl font-bold text-blue-600">{stats.pendientes}</div>
                        <div className="text-sm text-600">Pendientes</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 border-round">
                        <div className="text-2xl font-bold text-orange-600">{stats.discrepantes}</div>
                        <div className="text-sm text-600">Discrepantes</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 border-round">
                        <div className="text-2xl font-bold text-red-600">{stats.faltantes}</div>
                        <div className="text-sm text-600">Faltantes</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 border-round">
                        <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                        <div className="text-sm text-600">Total</div>
                    </div>
                </div>
            </Card>

            {/* Lista de activos */}
            <Card>
                <div className="mb-3">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0">Lista de Activos</h3>
                        <InputText
                            placeholder="Buscar por código, nombre o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-300px"
                        />
                    </div>
                </div>

                <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                    <TabPanel header={`Todos (${stats.total})`} leftIcon="pi pi-list mr-2">
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {filteredItems('todos').map(itemTemplate)}
                            {filteredItems('todos').length === 0 && (
                                <div className="text-center text-600 py-4">
                                    No se encontraron activos
                                </div>
                            )}
                        </div>
                    </TabPanel>

                    <TabPanel header={`Encontrados (${stats.encontrados})`} leftIcon="pi pi-check mr-2">
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {filteredItems('found').map(itemTemplate)}
                            {filteredItems('found').length === 0 && (
                                <div className="text-center text-600 py-4">
                                    Aún no se han encontrado activos
                                </div>
                            )}
                        </div>
                    </TabPanel>

                    <TabPanel header={`Pendientes (${stats.pendientes})`} leftIcon="pi pi-clock mr-2">
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {filteredItems('pending').map(itemTemplate)}
                            {filteredItems('pending').length === 0 && (
                                <div className="text-center text-600 py-4">
                                    Todos los activos han sido procesados
                                </div>
                            )}
                        </div>
                    </TabPanel>

                    {stats.discrepantes > 0 && (
                        <TabPanel header={`Discrepantes (${stats.discrepantes})`} leftIcon="pi pi-exclamation-triangle mr-2">
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {filteredItems('discrepant').map(itemTemplate)}
                            </div>
                        </TabPanel>
                    )}
                </TabView>
            </Card>

            {/* Scanner de cámara */}
            <QRScanner
                visible={showScanner}
                onHide={() => setShowScanner(false)}
                onScan={handleScan}
                loading={scanning}
            />

            {/* Sidebar con detalles del item */}
            <Sidebar
                visible={showItemDetails}
                onHide={() => setShowItemDetails(false)}
                position="right"
                style={{ width: '400px' }}
                header="Detalles del Activo"
            >
                {selectedItem && (
                    <div>
                        <div className="mb-4">
                            <div className="flex align-items-center gap-3 mb-3">
                                <Badge value={selectedItem.codigo} className="p-badge-lg" />
                                <span className="text-lg font-semibold">{selectedItem.nombre}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 text-sm">
                                <div>
                                    <span className="font-semibold text-600">Descripción:</span>
                                    <div>{selectedItem.descripcion || 'No especificada'}</div>
                                </div>

                                <div>
                                    <span className="font-semibold text-600">Marca/Modelo:</span>
                                    <div>{selectedItem.marca} {selectedItem.modelo}</div>
                                </div>

                                <div>
                                    <span className="font-semibold text-600">Serie:</span>
                                    <div>{selectedItem.serie || 'N/A'}</div>
                                </div>

                                <Divider />

                                <div>
                                    <span className="font-semibold text-600">Categoría:</span>
                                    <div>{selectedItem.categoria?.nombre || 'N/A'}</div>
                                </div>

                                <div>
                                    <span className="font-semibold text-600">Ubicación:</span>
                                    <div>{selectedItem.ubicacion?.nombre || 'N/A'}</div>
                                </div>

                                <div>
                                    <span className="font-semibold text-600">Responsable:</span>
                                    <div>{selectedItem.responsable?.nombre || 'N/A'}</div>
                                </div>

                                <Divider />

                                <div>
                                    <span className="font-semibold text-600">Valor:</span>
                                    <div>${selectedItem.valor_compra?.toLocaleString('es-CO') || '0'}</div>
                                </div>

                                <div>
                                    <span className="font-semibold text-600">Estado:</span>
                                    <div>
                                        <Badge
                                            value={selectedItem.estado}
                                            severity={selectedItem.estado === 'activo' ? 'success' : 'warning'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Sidebar>
        </AppLayout>
    );
}
