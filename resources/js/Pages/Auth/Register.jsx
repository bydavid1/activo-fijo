import { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const toast = useRef(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post('/register', formData, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Cuenta creada exitosamente',
            });

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al registrarse',
            });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
            <Toast ref={toast} />

            <Card className="w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">Activo Fijo</h1>
                    <p className="text-gray-600">Crear Nueva Cuenta</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Nombre Completo
                        </label>
                        <InputText
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Tu nombre"
                            className={`w-full p-3 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                            required
                        />
                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Correo Electrónico
                        </label>
                        <InputText
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="correo@ejemplo.com"
                            className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                            required
                        />
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Contraseña
                        </label>
                        <InputText
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Mínimo 8 caracteres"
                            className={`w-full p-3 border rounded-lg ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                            required
                        />
                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Confirmar Contraseña
                        </label>
                        <InputText
                            type="password"
                            value={formData.password_confirmation}
                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            placeholder="Repite tu contraseña"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>

                    <Button
                        label="Registrarse"
                        icon="pi pi-user-plus"
                        loading={loading}
                        className="w-full p-button-lg p-button-success"
                        type="submit"
                    />
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <a href="/login" className="text-blue-600 font-semibold hover:underline">
                            Iniciar Sesión
                        </a>
                    </p>
                </div>
            </Card>
        </div>
    );
}
