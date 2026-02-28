import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Movements = ({ user }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [assets, setAssets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [locations, setLocations] = useState([]);
    const toast = useRef(null);

    const movementTypes = [
        { label: 'Asignación', value: 'asignacion' },
        { label: 'Traslado', value: 'traslado' },
        { label: 'Préstamo', value: 'prestamo' },
        { label: 'Devolución', value: 'devolucion' },
        { label: 'Baja', value: 'baja' },
    ];

    const [formData, setFormData] = useState({
        asset_id: null,
        tipo: 'asignacion',
        ubicacion_nueva_id: null,
        responsable_nuevo_id: null,
        observaciones: '',
        fecha_devolucion_esperada: null,
    });

    useEffect(() => {
        fetchMovements();
        fetchOptions();
    }, []);

    const fetchMovements = async () => {
        try {
            const response = await axios.get('/api/movements');
            setMovements(response.data.data || []);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error cargando movimientos' });
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const response = await axios.get('/api/assets/options');
            const data = response.data;
            setAssets((data.activos || []).map(a => ({ label: `${a.codigo} - ${a.nombre}`, value: a.id })));
            setEmployees((data.empleados || []).map(e => ({ label: e.nombre, value: e.id })));
            setLocations((data.ubicaciones || []).map(l => ({ label: l.nombre, value: l.id })));
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleOpenDialog = () => {
        setFormData({
            asset_id: null,
            tipo: 'asignacion',
            ubicacion_nueva_id: null,
            responsable_nuevo_id: null,
            observaciones: '',
            fecha_devolucion_esperada: null,
        });
        setDisplayDialog(true);
    };

    const handleSaveMovement = async () => {
        try {
            const payload = { ...formData };
            if (payload.fecha_devolucion_esperada) {
                payload.fecha_devolucion_esperada = payload.fecha_devolucion_esperada.toISOString().split('T')[0];
            }
            await axios.post(`/api/assets/${formData.asset_id}/movements`, payload);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Movimiento registrado' });
            setDisplayDialog(false);
            fetchMovements();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error registrando movimiento';
            toast.current.show({ severity: 'error', summary: 'Error', detail: msg });
        }
    };

    const typeTemplate = (rowData) => {
        const colors = {
            asignacion: 'bg-blue-100 text-blue-800',
            traslado: 'bg-purple-100 text-purple-800',
            prestamo: 'bg-orange-100 text-orange-800',
            devolucion: 'bg-green-100 text-green-800',
            baja: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[rowData.tipo] || 'bg-gray-100 text-gray-800'}`}>
                {rowData.tipo}
            </span>
        );
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />

            <Card className="bg-white shadow mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <h5 className="text-xl md:text-2xl font-bold">Movimientos de Activos</h5>
                    <Button
                        label="Registrar Movimiento"
                        icon="pi pi-plus"
                        onClick={handleOpenDialog}
                        className="p-button-success w-full md:w-auto"
                    />
                </div>

                <div className="mb-4">
                    <InputText
                        type="search"
                        placeholder="Buscar movimientos..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                <DataTable
                    value={movements}
                    paginator
                    rows={10}
                    globalFilter={globalFilter}
                    loading={loading}
                    className="w-full"
                    stripedRows
                    scrollable
                    scrollHeight="flex"
                    responsiveLayout="scroll"
                >
                    <Column
                        field="asset.codigo"
                        header="Código"
                        sortable
                        style={{ minWidth: '100px' }}
                        body={(rowData) => rowData.asset?.codigo || '-'}
                    />
                    <Column
                        field="asset.nombre"
                        header="Activo"
                        style={{ minWidth: '150px' }}
                        body={(rowData) => rowData.asset?.nombre || '-'}
                    />
                    <Column
                        field="tipo"
                        header="Tipo"
                        body={typeTemplate}
                        style={{ minWidth: '100px' }}
                    />
                    <Column
                        field="ubicacion_anterior"
                        header="Ubic. Anterior"
                        style={{ minWidth: '120px' }}
                        className="hide-on-mobile"
                        body={(rowData) => rowData.ubicacion_anterior?.nombre || '-'}
                    />
                    <Column
                        field="ubicacion_nueva"
                        header="Ubic. Nueva"
                        style={{ minWidth: '120px' }}
                        className="hide-on-mobile"
                        body={(rowData) => rowData.ubicacion_nueva?.nombre || '-'}
                    />
                    <Column
                        field="responsable_nuevo"
                        header="Responsable"
                        style={{ minWidth: '120px' }}
                        className="hide-on-mobile"
                        body={(rowData) => rowData.responsable_nuevo?.nombre || '-'}
                    />
                    <Column
                        field="fecha_movimiento"
                        header="Fecha"
                        style={{ minWidth: '100px' }}
                        body={(rowData) => rowData.fecha_movimiento ? new Date(rowData.fecha_movimiento).toLocaleDateString('es-CO') : '-'}
                    />
                </DataTable>
            </Card>

            {/* Dialog for Register Movement */}
            <Dialog
                visible={displayDialog}
                style={{ width: '90vw', maxWidth: '650px' }}
                header="Registrar Movimiento"
                modal
                className="p-fluid"
                onHide={() => setDisplayDialog(false)}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Activo</label>
                        <Dropdown
                            value={formData.asset_id}
                            onChange={(e) => setFormData({ ...formData, asset_id: e.value })}
                            options={assets}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar activo"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo de Movimiento</label>
                        <Dropdown
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.value })}
                            options={movementTypes}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nueva Ubicación</label>
                        <Dropdown
                            value={formData.ubicacion_nueva_id}
                            onChange={(e) => setFormData({ ...formData, ubicacion_nueva_id: e.value })}
                            options={locations}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar ubicación"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Nuevo Responsable</label>
                        <Dropdown
                            value={formData.responsable_nuevo_id}
                            onChange={(e) => setFormData({ ...formData, responsable_nuevo_id: e.value })}
                            options={employees}
                            optionLabel="label"
                            optionValue="value"
                            filter
                            placeholder="Seleccionar responsable"
                            className="w-full"
                        />
                    </div>
                    {formData.tipo === 'prestamo' && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">Fecha Devolución Esperada</label>
                            <Calendar
                                value={formData.fecha_devolucion_esperada}
                                onChange={(e) => setFormData({ ...formData, fecha_devolucion_esperada: e.value })}
                                dateFormat="yy-mm-dd"
                                showIcon
                                className="w-full"
                            />
                        </div>
                    )}
                    <div className={formData.tipo === 'prestamo' ? '' : 'col-span-2'}>
                        <label className="block text-sm font-semibold mb-2">Observaciones</label>
                        <InputText
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        label="Registrar"
                        icon="pi pi-check"
                        onClick={handleSaveMovement}
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

export default Movements;
