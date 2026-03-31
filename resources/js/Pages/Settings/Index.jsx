import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function SettingsIndex({ user }) {
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assetTypes, setAssetTypes] = useState([]);

    const [settings, setSettings] = useState({
        metodo_calculo: 'depreciacion',
        valor_residual_porcentaje: 10,
        periodicidad_default: 'mensual',
        aplicar_regla_dia_15: true,
        tasas_por_tipo: {},
    });

    const metodosCalculo = [
        { label: 'Depreciación', value: 'depreciacion' },
        { label: 'Amortización', value: 'amortizacion' },
    ];

    const periodicidades = [
        { label: 'Diaria', value: 'diaria' },
        { label: 'Mensual', value: 'mensual' },
        { label: 'Anual', value: 'anual' },
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await axios.get('/api/settings');
            const data = response.data;
            setSettings({
                metodo_calculo: data.settings?.metodo_calculo || 'depreciacion',
                valor_residual_porcentaje: data.settings?.valor_residual_porcentaje || 10,
                periodicidad_default: data.settings?.periodicidad_default || 'mensual',
                aplicar_regla_dia_15: data.settings?.aplicar_regla_dia_15 ?? true,
                tasas_por_tipo: data.settings?.tasas_por_tipo || {},
            });
            setAssetTypes(data.asset_types || []);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error cargando configuración',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put('/api/settings', settings);
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Configuración guardada correctamente',
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error guardando configuración',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTasaChange = (codigo, value) => {
        setSettings(prev => ({
            ...prev,
            tasas_por_tipo: {
                ...prev.tasas_por_tipo,
                [codigo]: {
                    ...prev.tasas_por_tipo[codigo],
                    tasa: value,
                },
            },
        }));
    };

    // Derivar vida útil de la tasa
    const getVidaUtilFromTasa = (tasa) => {
        if (!tasa || tasa <= 0) return '—';
        return `${Math.round(100 / tasa)} años`;
    };

    // Preparar datos de tabla de tasas
    const tasasData = assetTypes
        .filter(t => t.es_depreciable)
        .map(type => ({
            codigo: type.codigo,
            nombre: type.nombre,
            tasa: settings.tasas_por_tipo[type.codigo]?.tasa ?? 0,
            vida_util_default: type.vida_util_default,
        }));

    if (loading) {
        return (
            <AppLayout user={user}>
                <div className="flex justify-center items-center" style={{ height: '400px' }}>
                    <ProgressSpinner />
                </div>
            </AppLayout>
        );
    }

    const tasaBodyTemplate = (rowData) => (
        <InputNumber
            value={rowData.tasa}
            onValueChange={(e) => handleTasaChange(rowData.codigo, e.value)}
            suffix="%"
            min={0}
            max={100}
            minFractionDigits={0}
            maxFractionDigits={2}
            className="w-full"
            inputClassName="w-24"
        />
    );

    const vidaUtilBodyTemplate = (rowData) => (
        <span className="text-gray-600">
            {getVidaUtilFromTasa(rowData.tasa)}
        </span>
    );

    const vidaUtilDefaultTemplate = (rowData) => (
        <span className="text-gray-400 text-sm">
            {rowData.vida_util_default ? `${rowData.vida_util_default} años` : '—'}
        </span>
    );

    return (
        <AppLayout user={user}>
            <Toast ref={toast} />
            <Card className="m-2 md:m-4">
                {/* Encabezado */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <i className="pi pi-sliders-h text-3xl text-primary"></i>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold m-0">Configuración del Sistema</h2>
                            <p className="text-gray-500 text-sm m-0">
                                Configure los parámetros globales de depreciación y amortización
                            </p>
                        </div>
                    </div>
                    <Button
                        label="Guardar Cambios"
                        icon="pi pi-save"
                        loading={saving}
                        onClick={handleSave}
                        className="p-button-success w-full md:w-auto"
                    />
                </div>

                {/* ═══════════════ MÉTODO DE CÁLCULO ═══════════════ */}
                <Divider align="left">
                    <span className="font-bold text-primary">
                        <i className="pi pi-calculator mr-2"></i>Método de Cálculo
                    </span>
                </Divider>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                    <div className="flex items-start gap-3">
                        <i className="pi pi-info-circle text-blue-500 text-xl mt-1"></i>
                        <div>
                            <p className="font-semibold text-blue-800 m-0 mb-1">¿Depreciación o Amortización?</p>
                            <ul className="text-sm text-blue-700 m-0 pl-4 space-y-1">
                                <li><strong>Depreciación:</strong> Aplica a bienes tangibles (muebles, equipos, vehículos)</li>
                                <li><strong>Amortización:</strong> Aplica a bienes intangibles (software, licencias, patentes)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Método Global</label>
                        <Dropdown
                            value={settings.metodo_calculo}
                            options={metodosCalculo}
                            onChange={(e) => setSettings({ ...settings, metodo_calculo: e.value })}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Periodicidad por Defecto</label>
                        <Dropdown
                            value={settings.periodicidad_default}
                            options={periodicidades}
                            onChange={(e) => setSettings({ ...settings, periodicidad_default: e.value })}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* ═══════════════ VALOR RESIDUAL ═══════════════ */}
                <Divider align="left">
                    <span className="font-bold text-primary">
                        <i className="pi pi-percentage mr-2"></i>Valor Residual
                    </span>
                </Divider>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Porcentaje de Valor Residual por Defecto
                        </label>
                        <InputNumber
                            value={settings.valor_residual_porcentaje}
                            onValueChange={(e) => setSettings({ ...settings, valor_residual_porcentaje: e.value })}
                            suffix="%"
                            min={0}
                            max={100}
                            minFractionDigits={0}
                            maxFractionDigits={2}
                            className="w-full"
                        />
                        <small className="text-gray-500 block mt-1">
                            Se aplicará automáticamente al crear un activo si no se especifica un valor residual manualmente
                        </small>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <InputSwitch
                            checked={settings.aplicar_regla_dia_15}
                            onChange={(e) => setSettings({ ...settings, aplicar_regla_dia_15: e.value })}
                        />
                        <label className="text-sm">
                            <span className="font-medium">Aplicar regla del día 15 por defecto</span>
                            <span className="block text-xs text-gray-500">
                                Si se adquiere después del día 15, la depreciación inicia el mes siguiente
                            </span>
                        </label>
                    </div>
                </div>

                {/* ═══════════════ TASAS POR TIPO DE BIEN ═══════════════ */}
                <Divider align="left">
                    <span className="font-bold text-primary">
                        <i className="pi pi-table mr-2"></i>Tasas de {settings.metodo_calculo === 'amortizacion' ? 'Amortización' : 'Depreciación'} por Tipo de Bien
                    </span>
                </Divider>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-4">
                    <p className="text-sm text-yellow-700 m-0">
                        <i className="pi pi-exclamation-triangle mr-2"></i>
                        Estas tasas se usan como valores por defecto al crear activos. La vida útil se calcula automáticamente a partir de la tasa (100 ÷ tasa = años).
                        Configure los porcentajes según la legislación fiscal aplicable en su país.
                    </p>
                </div>

                <DataTable
                    value={tasasData}
                    size="small"
                    stripedRows
                    className="mb-6"
                >
                    <Column field="codigo" header="Código" style={{ width: '100px' }} />
                    <Column field="nombre" header="Tipo de Bien" />
                    <Column header="Tasa Anual (%)" body={tasaBodyTemplate} style={{ width: '160px' }} />
                    <Column header="Vida Útil (derivada)" body={vidaUtilBodyTemplate} style={{ width: '150px' }} />
                    <Column header="Vida Útil (configurada)" body={vidaUtilDefaultTemplate} style={{ width: '160px' }} />
                </DataTable>

                {/* Bienes no depreciables */}
                {assetTypes.filter(t => !t.es_depreciable).length > 0 && (
                    <Message
                        severity="info"
                        className="w-full mb-4"
                        text={`Los siguientes tipos no son depreciables y no aparecen en la tabla: ${assetTypes.filter(t => !t.es_depreciable).map(t => t.nombre).join(', ')}`}
                    />
                )}

                {/* ═══════════════ BOTÓN GUARDAR (footer) ═══════════════ */}
                <Divider />
                <div className="flex justify-end">
                    <Button
                        label="Guardar Configuración"
                        icon="pi pi-save"
                        loading={saving}
                        onClick={handleSave}
                        className="p-button-success"
                    />
                </div>
            </Card>
        </AppLayout>
    );
}
