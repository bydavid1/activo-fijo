import { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

export default function Login() {
    const [email, setEmail] = useState('admin@sistema.com');
    const [password, setPassword] = useState('admin123');
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await window.axios.post('/login', { email, password });

            // Redirect to dashboard
            window.location.href = '/';
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al iniciar sesión',
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
                    <p className="text-gray-600">Sistema de Gestión de Activos Fijos</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Correo Electrónico
                        </label>
                        <InputText
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Contraseña
                        </label>
                        <InputText
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">
                            <strong>Demo:</strong> admin@sistema.com / admin123
                        </p>
                    </div>

                    <Button
                        label="Iniciar Sesión"
                        icon="pi pi-sign-in"
                        loading={loading}
                        className="w-full p-button-lg p-button-success"
                        type="submit"
                    />
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="text-blue-600 font-semibold hover:underline">
                            Registrarse
                        </a>
                    </p>
                </div>
            </Card>
        </div>
    );
}
