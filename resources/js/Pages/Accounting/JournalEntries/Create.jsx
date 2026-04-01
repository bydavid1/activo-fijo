import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { Badge } from 'primereact/badge';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function JournalEntriesCreate({ user }) {
    const toast = useRef(null);
    const [accounts, setAccounts] = useState([]);
    const [saving, setSaving] = useState(false);
    
    // Header data
    const [header, setHeader] = useState({
        fecha: new Date(),
        descripcion: ''
    });

    // Lines data
    const [lines, setLines] = useState([
        { id: 1, accounting_account_id: null, debe: 0, haber: 0 },
        { id: 2, accounting_account_id: null, debe: 0, haber: 0 }
    ]);

    useEffect(() => {
        // Load operational flat accounts
        axios.get('/api/accounting/accounts?plano=1').then(res => {
            setAccounts(res.data.map(acc => ({
                label: `${acc.codigo} - ${acc.nombre}`,
                value: acc.id
            })));
        });
    }, []);

    const addLine = () => {
        setLines([...lines, { id: Date.now(), accounting_account_id: null, debe: 0, haber: 0 }]);
    };

    const removeLine = (id) => {
        if (lines.length <= 2) {
            toast.current.show({ severity: 'warn', summary: 'Aviso', detail: 'Un asiento debe tener al menos dos líneas' });
            return;
        }
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id, field, value) => {
        setLines(lines.map(l => {
            if (l.id === id) {
                const updated = { ...l, [field]: value };
                // Mutual exclusion for debe/haber
                if (field === 'debe' && value > 0) updated.haber = 0;
                if (field === 'haber' && value > 0) updated.debe = 0;
                return updated;
            }
            return l;
        }));
    };

    const sumDebe = lines.reduce((sum, l) => sum + (l.debe || 0), 0);
    const sumHaber = lines.reduce((sum, l) => sum + (l.haber || 0), 0);
    const diff = Math.abs(sumDebe - sumHaber);
    const isBalanced = sumDebe > 0 && diff < 0.01;

    const handleSubmit = async () => {
        if (!header.fecha || !header.descripcion.trim()) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Complete fecha y descripción' });
            return;
        }

        if (!isBalanced) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'El asiento no cuadra. Debe y Haber deben ser iguales.' });
            return;
        }

        const emptyLines = lines.some(l => !l.accounting_account_id || (l.debe === 0 && l.haber === 0));
        if (emptyLines) {
            toast.current.show({ severity: 'warn', summary: 'Aviso', detail: 'Asegúrese de seleccionar cuentas y colocar importes en todas las líneas' });
            return;
        }

        setSaving(true);
        try {
            await axios.post('/api/accounting/journal-entries', {
                fecha: header.fecha.toISOString().split('T')[0],
                descripcion: header.descripcion,
                lines: lines.map(l => ({
                    accounting_account_id: l.accounting_account_id,
                    debe: l.debe,
                    haber: l.haber
                }))
            });
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Asiento guardado correctamente' });
            setTimeout(() => {
                router.visit('/accounting/journal-entries');
            }, 1000);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al guardar asiento' });
            setSaving(false);
        }
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />
            <Card className="m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Crear Asiento Manual</h2>
                    <Link href="/accounting/journal-entries">
                        <Button label="Volver" icon="pi pi-arrow-left" className="p-button-secondary p-button-text" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <Calendar value={header.fecha} onChange={(e) => setHeader({...header, fecha: e.value})} dateFormat="yy-mm-dd" className="w-full" showIcon />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Descripción del Asiento</label>
                        <InputText value={header.descripcion} onChange={(e) => setHeader({...header, descripcion: e.target.value})} className="w-full" placeholder="Ej: Ajuste manual de inventario, reclasificación..." />
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 border-b pb-2">Líneas / Detalle</h3>
                    
                    {lines.map((line, index) => (
                        <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4 bg-gray-50 p-4 md:p-2 rounded border border-gray-100 md:border-0">
                            <div className="hidden md:block md:col-span-1 text-center font-bold text-gray-500 pb-2">{index + 1}</div>
                            <div className="md:col-span-5 lg:col-span-4">
                                <label className="block text-xs text-gray-500 mb-1">Cuenta</label>
                                <Dropdown 
                                    value={line.accounting_account_id} 
                                    options={accounts} 
                                    onChange={(e) => updateLine(line.id, 'accounting_account_id', e.value)} 
                                    filter 
                                    className="w-full" 
                                    placeholder="Seleccione cuenta" 
                                />
                            </div>
                            <div className="md:col-span-3 lg:col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">Débito (Debe)</label>
                                <InputNumber value={line.debe} onValueChange={(e) => updateLine(line.id, 'debe', e.value || 0)} mode="currency" currency="USD" locale="en-US" className="w-full" inputClassName="w-full" min={0} />
                            </div>
                            <div className="md:col-span-3 lg:col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">Crédito (Haber)</label>
                                <InputNumber value={line.haber} onValueChange={(e) => updateLine(line.id, 'haber', e.value || 0)} mode="currency" currency="USD" locale="en-US" className="w-full" inputClassName="w-full" min={0} />
                            </div>
                            <div className="md:col-span-1 flex justify-end md:justify-center pb-1">
                                <Button icon="pi pi-trash" className="p-button-danger p-button-text p-button-rounded" onClick={() => removeLine(line.id)} tooltip="Eliminar Línea" disabled={lines.length <= 2} />
                            </div>
                        </div>
                    ))}

                    <Button label="Agregar Línea" icon="pi pi-plus" className="p-button-info p-button-text mt-2" onClick={addLine} />
                </div>

                <div className="border-t pt-4 mt-6">
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-4 md:gap-8">
                        <div className="font-bold text-lg text-gray-700">TOTALES:</div>
                        <div className={`text-lg font-bold min-w-[120px] text-right ${!isBalanced && sumDebe>0 ? 'text-red-600' : 'text-green-600'}`}>
                            Debe: ${sumDebe.toFixed(2)}
                        </div>
                        <div className={`text-lg font-bold min-w-[120px] text-right ${!isBalanced && sumHaber>0 ? 'text-red-600' : 'text-green-600'}`}>
                            Haber: ${sumHaber.toFixed(2)}
                        </div>
                        <div className="min-w-[150px] flex justify-end">
                            {isBalanced && sumDebe > 0 ? (
                                <Badge value="CUADRADO" severity="success" size="large" />
                            ) : (
                                <Badge value={`DESCUADRE: $${diff.toFixed(2)}`} severity="danger" size="large" />
                            )}
                        </div>
                    </div>
                </div>

                {!isBalanced && sumDebe > 0 && (
                    <Message severity="error" text="El asiento está descuadrado y no puede ser guardado porque Debe es diferente al Haber." className="w-full mt-4" />
                )}

                <div className="flex justify-end mt-6">
                    <Button label="Guardar Asiento" icon="pi pi-save" onClick={handleSubmit} disabled={!isBalanced || saving} loading={saving} className="p-button-success p-button-lg" />
                </div>
            </Card>
        </AppLayout>
    );
}
