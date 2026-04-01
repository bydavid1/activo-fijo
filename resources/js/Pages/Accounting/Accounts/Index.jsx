import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function AccountingAccountsIndex({ user }) {
    const toast = useRef(null);
    const [accountsTree, setAccountsTree] = useState([]);
    const [flatAccounts, setFlatAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Dialog state
    const [displayDialog, setDisplayDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    
    const [form, setForm] = useState({
        parent_id: null,
        codigo: '',
        nombre: '',
        tipo: 'activo',
        estado: 'activo'
    });

    const accountTypes = [
        { label: 'Activo', value: 'activo' },
        { label: 'Pasivo', value: 'pasivo' },
        { label: 'Patrimonio', value: 'patrimonio' },
        { label: 'Ingreso', value: 'ingreso' },
        { label: 'Gasto', value: 'gasto' }
    ];

    const statusOptions = [
        { label: 'Activo', value: 'activo' },
        { label: 'Inactivo', value: 'inactivo' }
    ];

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const [treeRes, flatRes] = await Promise.all([
                axios.get('/api/accounting/accounts'),
                axios.get('/api/accounting/accounts?plano=1')
            ]);
            setAccountsTree(treeRes.data);
            setFlatAccounts(flatRes.data.map(acc => ({
                label: `${acc.codigo} - ${acc.nombre}`,
                value: acc.id,
                tipo: acc.tipo
            })));
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el catálogo de cuentas' });
        } finally {
            setLoading(false);
        }
    };

    const openDialog = (account = null, parentId = null) => {
        if (account) {
            setEditingAccount(account);
            setForm({
                parent_id: account.parent_id,
                codigo: account.codigo,
                nombre: account.nombre,
                tipo: account.tipo,
                estado: account.estado
            });
        } else {
            setEditingAccount(null);
            setForm({
                parent_id: parentId,
                codigo: '',
                nombre: '',
                tipo: parentId ? flatAccounts.find(a => a.value === parentId)?.tipo || 'activo' : 'activo',
                estado: 'activo'
            });
        }
        setDisplayDialog(true);
    };

    const saveAccount = async () => {
        setSaving(true);
        try {
            if (editingAccount) {
                await axios.put(`/api/accounting/accounts/${editingAccount.id}`, form);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta actualizada' });
            } else {
                await axios.post('/api/accounting/accounts', form);
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta creada' });
            }
            setDisplayDialog(false);
            fetchAccounts();
        } catch (error) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: error.response?.data?.message || 'Revisa los campos e intenta de nuevo' 
            });
        } finally {
            setSaving(false);
        }
    };

    const actionTemplate = (node) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success p-button-sm p-button-text" 
                    tooltip="Agregar Subcuenta" onClick={() => openDialog(null, node.data.id)} />
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-warning p-button-sm p-button-text" 
                    tooltip="Editar" onClick={() => openDialog(node.data)} />
            </div>
        );
    };

    const typeTemplate = (node) => {
        const colors = {
            'activo': 'success',
            'pasivo': 'danger',
            'patrimonio': 'warning',
            'ingreso': 'info',
            'gasto': 'danger'
        };
        return <Badge value={node.data.tipo.toUpperCase()} severity={colors[node.data.tipo] || 'info'} />;
    };

    const statusTemplate = (node) => {
        return <Badge value={node.data.estado} severity={node.data.estado === 'activo' ? 'success' : 'danger'} />;
    };

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />
            <Card className="m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Catálogo de Cuentas Contables</h2>
                    <Button label="Nueva Cuenta Raíz" icon="pi pi-plus" onClick={() => openDialog()} className="p-button-primary" />
                </div>

                <TreeTable value={accountsTree} loading={loading} stripedRows>
                    <Column field="codigo" header="Código" expander sortable></Column>
                    <Column field="nombre" header="Nombre"></Column>
                    <Column field="tipo" header="Tipo" body={typeTemplate}></Column>
                    <Column field="estado" header="Estado" body={statusTemplate}></Column>
                    <Column body={actionTemplate} header="Acciones"></Column>
                </TreeTable>
            </Card>

            <Dialog header={editingAccount ? "Editar Cuenta" : "Nueva Cuenta"} visible={displayDialog} style={{ width: '50vw' }} onHide={() => setDisplayDialog(false)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Cuenta Padre (Opcional)</label>
                        <Dropdown 
                            value={form.parent_id} 
                            options={flatAccounts} 
                            onChange={(e) => {
                                const acc = flatAccounts.find(a => a.value === e.value);
                                setForm({...form, parent_id: e.value, tipo: acc ? acc.tipo : form.tipo});
                            }} 
                            placeholder="Seleccionar cuenta padre" 
                            filter 
                            showClear 
                            className="w-full" 
                            disabled={!!editingAccount}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Código</label>
                        <InputText value={form.codigo} onChange={(e) => setForm({...form, codigo: e.target.value})} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre de Cuenta</label>
                        <InputText value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Cuenta</label>
                        <Dropdown value={form.tipo} options={accountTypes} onChange={(e) => setForm({...form, tipo: e.value})} className="w-full" disabled={!!form.parent_id} />
                        {form.parent_id && <small className="text-gray-500">Heredado de la cuenta padre</small>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Estado</label>
                        <Dropdown value={form.estado} options={statusOptions} onChange={(e) => setForm({...form, estado: e.value})} className="w-full" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="Cancelar" icon="pi pi-times" onClick={() => setDisplayDialog(false)} className="p-button-text" />
                    <Button label="Guardar" icon="pi pi-save" onClick={saveAccount} loading={saving} />
                </div>
            </Dialog>
        </AppLayout>
    );
}
