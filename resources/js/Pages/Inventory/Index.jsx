import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Inventory = ({ user }) => {
    const [cycles, setCycles] = useState([]);
    const [discrepancies, setDiscrepancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayCycleDialog, setDisplayCycleDialog] = useState(false);
    const [displayDiscrepancies, setDisplayDiscrepancies] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState(null);
    const toast = useRef(null);

    const [cycleForm, setCycleForm] = useState({
        titulo: '',
        descripcion: '',
    });

    const statuses = [
        { label: 'Planeado', value: 'planeado' },
        { label: 'En Ejecución', value: 'en_ejecucion' },
        { label: 'Captura Completa', value: 'captura_completa' },
        { label: 'En Reconciliación', value: 'en_reconciliacion' },
        { label: 'Completado', value: 'completado' },
    ];

    useEffect(() => {
        fetchCycles();
    }, []);

    const fetchCycles = async () => {
        try {
            const response = await axios.get('/api/inventory/cycles');
            setCycles(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando ciclos' });
            setLoading(false);
        }
    };

    const handleCreateCycle = async () => {
        try {
            await axios.post('/api/inventory/cycles', cycleForm);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Ciclo creado' });
            setDisplayCycleDialog(false);
            setCycleForm({ titulo: '', descripcion: '' });
            fetchCycles();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error creando ciclo' });
        }
    };

    const handleViewDiscrepancies = async (cycle) => {
        try {
            setSelectedCycle(cycle);
            const response = await axios.get(`/api/inventory/cycles/${cycle.id}/discrepancies`);
            setDiscrepancies(response.data.data || []);
            setDisplayDiscrepancies(true);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando discrepancias' });
        }
    };

    const handleApproveDiscrepancy = async (discrepancy) => {
        try {
            await axios.put(`/api/inventory/discrepancies/${discrepancy.id}/approve`, {
                notas: '',
            });
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Discrepancia aprobada' });
            handleViewDiscrepancies(selectedCycle);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error aprobando discrepancia' });
        }
    };

    const handleRejectDiscrepancy = async (discrepancy) => {
        try {
            await axios.put(`/api/inventory/discrepancies/${discrepancy.id}/reject`, {
                razon: 'Rechazado por el usuario',
            });
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Discrepancia rechazada' });
            handleViewDiscrepancies(selectedCycle);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error rechazando discrepancia' });
        }
    };

    const statusBodyTemplate = (rowData) => {
        const status = statuses.find(s => s.value === rowData.estado);
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                rowData.estado === 'planeado' ? 'bg-blue-100 text-blue-800' :
                rowData.estado === 'en_ejecucion' ? 'bg-yellow-100 text-yellow-800' :
                rowData.estado === 'completado' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
            }`}>
                {status?.label}
            </span>
        );
    };

    const cycleActionsBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-check-square"
                    className="p-button-rounded p-button-info p-button-sm"
                    onClick={() => handleViewDiscrepancies(rowData)}
                    tooltip="Ver Discrepancias"
                    tooltipPosition="top"
                />
            </div>
        );
    };

    const discrepancyActionsBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-check"
                    className="p-button-rounded p-button-success p-button-sm"
                    onClick={() => handleApproveDiscrepancy(rowData)}
                    disabled={rowData.estado !== 'pendiente_aprobacion'}
                    tooltip="Aprobar"
                    tooltipPosition="top"
                />
                <Button
                    icon="pi pi-times"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={() => handleRejectDiscrepancy(rowData)}
                    disabled={rowData.estado !== 'pendiente_aprobacion'}
                    tooltip="Rechazar"
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
                    <h5 className="text-2xl font-bold">Ciclos de Inventario</h5>
                    <Button
                        label="Nuevo Ciclo"
                        icon="pi pi-plus"
                        onClick={() => setDisplayCycleDialog(true)}
                        className="p-button-success"
                    />
                </div>

                <DataTable
                    value={cycles}
                    paginator
                    rows={10}
                    loading={loading}
                    className="w-full"
                    striped
                >
                    <Column field="id" header="ID" style={{ width: '8%' }} />
                    <Column field="titulo" header="Título" style={{ width: '25%' }} />
                    <Column field="descripcion" header="Descripción" style={{ width: '30%' }} />
                    <Column
                        field="estado"
                        header="Estado"
                        body={statusBodyTemplate}
                        style={{ width: '18%' }}
                    />
                    <Column
                        body={cycleActionsBodyTemplate}
                        header="Acciones"
                        style={{ width: '12%' }}
                    />
                </DataTable>
            </Card>

            {/* Cycle Dialog */}
            <Dialog
                visible={displayCycleDialog}
                style={{ width: '40vw' }}
                header="Crear Nuevo Ciclo"
                modal
                onHide={() => setDisplayCycleDialog(false)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Título</label>
                        <InputText
                            value={cycleForm.titulo}
                            onChange={(e) => setCycleForm({ ...cycleForm, titulo: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Ej: Inventario Q1 2026"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Descripción</label>
                        <InputText
                            value={cycleForm.descripcion}
                            onChange={(e) => setCycleForm({ ...cycleForm, descripcion: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Descripción del ciclo"
                        />
                    </div>
                    <div className="flex gap-2 mt-6">
                        <Button
                            label="Crear"
                            icon="pi pi-check"
                            onClick={handleCreateCycle}
                            className="p-button-success"
                        />
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            onClick={() => setDisplayCycleDialog(false)}
                            className="p-button-secondary"
                        />
                    </div>
                </div>
            </Dialog>

            {/* Discrepancies Dialog */}
            <Dialog
                visible={displayDiscrepancies}
                style={{ width: '80vw' }}
                header={`Discrepancias - Ciclo ${selectedCycle?.titulo}`}
                modal
                onHide={() => setDisplayDiscrepancies(false)}
            >
                <DataTable value={discrepancies} className="w-full">
                    <Column field="id" header="ID" style={{ width: '8%' }} />
                    <Column field="asset_id" header="Asset ID" style={{ width: '12%' }} />
                    <Column field="cantidad_esperada" header="Esperado" style={{ width: '15%' }} />
                    <Column field="cantidad_encontrada" header="Encontrado" style={{ width: '15%' }} />
                    <Column
                        field="estado"
                        header="Estado"
                        body={statusBodyTemplate}
                        style={{ width: '18%' }}
                    />
                    <Column
                        body={discrepancyActionsBodyTemplate}
                        header="Acciones"
                        style={{ width: '12%' }}
                    />
                </DataTable>
            </Dialog>
        </AppLayout>
    );
};

export default Inventory;
