import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

export default function CreateAsset() {
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

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
        valor_compra: 0,
        valor_residual: 0,
        vida_util_anos: 5,
        fecha_adquisicion: new Date(),
        estado: 'activo',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/assets', formData);
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

    return (
        <AppLayout>
            <Toast ref={toast} />
            <Card className="m-4">
                <h2 className="text-2xl font-bold mb-4">Crear Nuevo Activo</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Código</label>
                            <InputText
                                name="codigo"
                                value={formData.codigo}
                                onChange={handleInputChange}
                                className="w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Nombre</label>
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
                            <InputText
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
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
                            <label className="block text-sm font-medium mb-2">Serie</label>
                            <InputText
                                name="serie"
                                value={formData.serie}
                                onChange={handleInputChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor Compra</label>
                            <InputNumber
                                name="valor_compra"
                                value={formData.valor_compra}
                                onChange={(e) => setFormData({...formData, valor_compra: e.value})}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor Residual</label>
                            <InputNumber
                                name="valor_residual"
                                value={formData.valor_residual}
                                onChange={(e) => setFormData({...formData, valor_residual: e.value})}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button
                            type="submit"
                            label="Guardar"
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
