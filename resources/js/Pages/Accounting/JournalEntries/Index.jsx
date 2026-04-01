import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function JournalEntriesIndex({ user }) {
    const toast = useRef(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [displayDetails, setDisplayDetails] = useState(false);

    // Cierre Mensual
    const [displayCloseForm, setDisplayCloseForm] = useState(false);
    const [closing, setClosing] = useState(false);
    const [closeForm, setCloseForm] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });

    // Historial
    const [displayHistory, setDisplayHistory] = useState(false);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [displayLogDetails, setDisplayLogDetails] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/accounting/journal-entries');
            setEntries(res.data.data);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los asientos contables' });
        } finally {
            setLoading(false);
        }
    };

    const typeTemplate = (rowData) => {
        if (rowData.tipo_origen === 'depreciacion') {
            return <Badge value="Automático (Depreciación)" severity="info" />;
        }
        return <Badge value="Manual" severity="warning" />;
    };

    const stateTemplate = (rowData) => {
        return <Badge value={rowData.estado.toUpperCase()} severity={rowData.estado === 'validado' ? 'success' : 'danger'} />;
    };

    const actionsTemplate = (rowData) => {
        return (
            <Button icon="pi pi-eye" className="p-button-rounded p-button-text" 
                onClick={() => { setSelectedEntry(rowData); setDisplayDetails(true); }} tooltip="Ver Detalles" />
        );
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/accounting/journal-entries/close-history');
            setHistoryLogs(res.data);
            setDisplayHistory(true);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' });
        }
    };

    const handleRunClose = async () => {
        setClosing(true);
        try {
            const res = await axios.post('/api/accounting/journal-entries/run-depreciation', closeForm);
            setDisplayCloseForm(false);
            fetchEntries();
            toast.current?.show({ 
                severity: 'success', 
                summary: 'Cierre Exitoso', 
                detail: `Se procesaron ${res.data.entradas_creadas} asientos.` 
            });
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Ocurrió un error al procesar el cierre. Revisa la consola o configuración de cuentas.' 
            });
        } finally {
            setClosing(false);
        }
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />
            <Card className="m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Asientos Contables</h2>
                    <div className="flex gap-2">
                        <Button 
                            label="Historial de Cierres" 
                            icon="pi pi-history" 
                            className="p-button-secondary p-button-outlined" 
                            onClick={fetchHistory} 
                        />
                        <Button 
                            label="Cierre de Depreciación" 
                            icon="pi pi-bolt" 
                            className="p-button-warning" 
                            onClick={() => setDisplayCloseForm(true)} 
                        />
                        <Link href="/accounting/journal-entries/create">
                            <Button label="Nuevo Asiento Manual" icon="pi pi-plus" className="p-button-primary" />
                        </Link>
                    </div>
                </div>

                <DataTable value={entries} loading={loading} paginator rows={15} stripedRows emptyMessage="No hay asientos registrados">
                    <Column field="id" header="Nº Asiento" style={{ width: '10%' }}></Column>
                    <Column field="fecha" header="Fecha" style={{ width: '15%' }}></Column>
                    <Column field="descripcion" header="Descripción"></Column>
                    <Column field="tipo_origen" header="Origen" body={typeTemplate} style={{ width: '20%' }}></Column>
                    <Column field="estado" header="Estado" body={stateTemplate} style={{ width: '15%' }}></Column>
                    <Column body={actionsTemplate} header="Acciones"></Column>
                </DataTable>
            </Card>

            <Dialog header={`Detalles Asiento #${selectedEntry?.id}`} visible={displayDetails} style={{ width: '60vw' }} onHide={() => setDisplayDetails(false)}>
                {selectedEntry && (
                    <div>
                        <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded">
                            <div><strong>Fecha:</strong> {selectedEntry.fecha}</div>
                            <div><strong>Origen:</strong> {selectedEntry.tipo_origen}</div>
                            <div className="col-span-2"><strong>Descripción:</strong> {selectedEntry.descripcion}</div>
                            {selectedEntry.asset && (
                                <div className="col-span-2"><strong>Activo Fijo Vinculado:</strong> {selectedEntry.asset.codigo} - {selectedEntry.asset.nombre}</div>
                            )}
                        </div>

                        <DataTable value={selectedEntry.lines} stripedRows>
                            <Column field="account.codigo" header="Código CTA"></Column>
                            <Column field="account.nombre" header="Nombre CTA"></Column>
                            <Column field="debe" header="Debe" align="right" body={r => `$${Number(r.debe).toFixed(2)}`}></Column>
                            <Column field="haber" header="Haber" align="right" body={r => `$${Number(r.haber).toFixed(2)}`}></Column>
                        </DataTable>

                        <div className="flex justify-end mt-4 p-4 bg-gray-100 rounded">
                            <h3 className="text-lg font-bold mr-8">
                                Total Debe: ${selectedEntry.lines.reduce((acc, line) => acc + Number(line.debe), 0).toFixed(2)}
                            </h3>
                            <h3 className="text-lg font-bold">
                                Total Haber: ${selectedEntry.lines.reduce((acc, line) => acc + Number(line.haber), 0).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                )}
            </Dialog>

            <Dialog header="Ejecutar Cierre de Depreciación Mensual" visible={displayCloseForm} style={{ width: '30vw' }} onHide={() => !closing && setDisplayCloseForm(false)}>
                <p className="mb-4 text-sm text-gray-600">
                    Este proceso revisará todas las proyecciones de depreciación del mes seleccionado y creará automáticamente los asientos contables para los activos que apliquen. Los asientos ya procesados previamente serán ignorados.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Año</label>
                        <InputNumber value={closeForm.year} onValueChange={(e) => setCloseForm({...closeForm, year: e.value})} useGrouping={false} min={2000} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mes (1-12)</label>
                        <InputNumber value={closeForm.month} onValueChange={(e) => setCloseForm({...closeForm, month: e.value})} min={1} max={12} className="w-full" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="Cancelar" icon="pi pi-times" onClick={() => setDisplayCloseForm(false)} className="p-button-text" disabled={closing} />
                    <Button label="Ejecutar Cierre" icon="pi pi-check" onClick={handleRunClose} loading={closing} className="p-button-warning" />
                </div>
            </Dialog>

            <Dialog header="Historial de Ejecuciones de Cierre" visible={displayHistory} style={{ width: '60vw' }} onHide={() => setDisplayHistory(false)}>
                <DataTable value={historyLogs} paginator rows={10} emptyMessage="No hay ejecuciones registradas">
                    <Column field="fecha_ejecucion" header="Fecha de Ejecución" sortable></Column>
                    <Column field="usuario" header="Usuario" sortable></Column>
                    <Column field="periodo" header="Período Cerrado" sortable></Column>
                    <Column field="asientos_creados" header="Asientos Creados" body={(rowData) => <Badge value={rowData.asientos_creados} severity={rowData.asientos_creados > 0 ? 'success' : 'warning'} />}></Column>
                    <Column body={(rowData) => (
                        <Button icon="pi pi-search" className="p-button-rounded p-button-text p-button-info" tooltip="Ver activos afectados" onClick={() => { setSelectedLog(rowData); setDisplayLogDetails(true); }} disabled={!rowData.activos_afectados || rowData.activos_afectados.length === 0} />
                    )}></Column>
                </DataTable>
            </Dialog>

            <Dialog header={`Activos Afectados - Período ${selectedLog?.periodo}`} visible={displayLogDetails} style={{ width: '50vw' }} onHide={() => setDisplayLogDetails(false)}>
                {selectedLog && (
                    <DataTable value={selectedLog.activos_afectados} paginator rows={10} emptyMessage="No se guardó el detalle de activos para esta ejecución.">
                        <Column field="codigo" header="Código" sortable></Column>
                        <Column field="nombre" header="Activo" sortable></Column>
                        <Column field="monto" header="Monto Devengado" body={(rowData) => `$${Number(rowData.monto).toFixed(2)}`} sortable></Column>
                    </DataTable>
                )}
            </Dialog>
        </AppLayout>
    );
}
