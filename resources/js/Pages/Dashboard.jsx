import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/Layouts/AppLayout';
import axios from 'axios';

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState({
        totalAssets: 0,
        totalValue: 0,
        activeEmployees: 0,
        pendingMaintenance: 0,
        depreciationChart: [],
        valueByCategory: [],
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Obtener actividad reciente real
            const activityRes = await Promise.all([
                axios.get('/api/assets?per_page=5&sort=created_at&direction=desc'),
                axios.get('/api/movements?per_page=5').catch(() => ({ data: { data: [] } })),
                axios.get('/api/maintenance-orders?per_page=3').catch(() => ({ data: { data: [] } })),
            ]);

            const [latestAssets, latestMovements, latestMaintenance] = activityRes;
            const activity = [];

            // Agregar últimos activos creados
            if (latestAssets.data?.data) {
                latestAssets.data.data.forEach(asset => {
                    activity.push({
                        id: `asset-${asset.id}`,
                        type: 'asset_created',
                        icon: 'pi pi-box',
                        color: 'text-blue-600',
                        title: `Activo creado: ${asset.nombre}`,
                        description: `Código: ${asset.codigo}`,
                        timestamp: asset.created_at,
                        link: `/assets/${asset.id}`
                    });
                });
            }

            // Agregar últimos movimientos
            if (latestMovements.data?.data) {
                latestMovements.data.data.forEach(movement => {
                    activity.push({
                        id: `movement-${movement.id}`,
                        type: 'asset_moved',
                        icon: 'pi pi-arrow-right',
                        color: 'text-green-600',
                        title: `Movimiento: ${movement.tipo}`,
                        description: `${movement.asset?.nombre || 'Activo'} - ${movement.motivo || 'Sin motivo'}`,
                        timestamp: movement.created_at,
                        link: movement.asset ? `/assets/${movement.asset.id}` : null
                    });
                });
            }

            // Agregar órdenes de mantenimiento
            if (latestMaintenance.data?.data) {
                latestMaintenance.data.data.forEach(maintenance => {
                    activity.push({
                        id: `maintenance-${maintenance.id}`,
                        type: 'maintenance',
                        icon: 'pi pi-wrench',
                        color: 'text-orange-600',
                        title: `Mantenimiento: ${maintenance.tipo}`,
                        description: `${maintenance.asset?.nombre || 'Activo'} - ${maintenance.estado}`,
                        timestamp: maintenance.created_at,
                        link: maintenance.asset ? `/assets/${maintenance.asset.id}` : null
                    });
                });
            }

            // Ordenar por timestamp y tomar los primeros 8
            const sortedActivity = activity
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 8);

            setRecentActivity(sortedActivity);

            // Simular datos para el dashboard
            const mockData = {
                totalAssets: 8,
                totalValue: 123450000,
                activeEmployees: 6,
                pendingMaintenance: 2,
                depreciationChart: [
                    { name: 'Ene', value: 450000 },
                    { name: 'Feb', value: 520000 },
                    { name: 'Mar', value: 480000 },
                    { name: 'Abr', value: 610000 },
                    { name: 'May', value: 550000 },
                    { name: 'Jun', value: 690000 },
                ],
                valueByCategory: [
                    { name: 'Computadoras', value: 32100000 },
                    { name: 'Vehículos', value: 85000000 },
                    { name: 'Equipos', value: 4350000 },
                    { name: 'Mobiliario', value: 1300000 },
                    { name: 'Otros', value: 700000 },
                ],
            };

            setStats(mockData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));

        if (diffInMinutes < 1) return 'Hace unos momentos';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

        return time.toLocaleDateString('es-ES');
    };

    return (
        <AppLayout user={user}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                {/* KPI Cards */}
                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-xl md:text-3xl font-bold text-blue-600">{stats.totalAssets}</div>
                        <div className="text-xs md:text-base text-gray-600 mt-1 md:mt-2">Activos Totales</div>
                    </div>
                </Card>

                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-xl md:text-3xl font-bold text-green-600">
                            ${(stats.totalValue / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs md:text-base text-gray-600 mt-1 md:mt-2">Valor Total</div>
                    </div>
                </Card>

                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-xl md:text-3xl font-bold text-orange-600">{stats.activeEmployees}</div>
                        <div className="text-xs md:text-base text-gray-600 mt-1 md:mt-2">Empleados Activos</div>
                    </div>
                </Card>

                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-xl md:text-3xl font-bold text-red-600">{stats.pendingMaintenance}</div>
                        <div className="text-xs md:text-base text-gray-600 mt-1 md:mt-2">Manten. Pendiente</div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Depreciation Chart */}
                <Card className="bg-white shadow">
                    <h5 className="text-base md:text-lg font-bold mb-4">Depreciación Mensual</h5>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.depreciationChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Value by Category */}
                <Card className="bg-white shadow">
                    <h5 className="text-lg font-bold mb-4">Valor por Categoría</h5>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.valueByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {stats.valueByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white shadow mt-6">
                <h5 className="text-lg font-bold mb-4">Actividad Reciente</h5>
                {loading ? (
                    <div className="text-center py-8">
                        <i className="pi pi-spin pi-spinner text-3xl text-gray-400"></i>
                    </div>
                ) : recentActivity.length > 0 ? (
                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                                    <i className={`${activity.icon} text-sm`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {activity.description}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {formatRelativeTime(activity.timestamp)}
                                        </span>
                                    </div>
                                    {activity.link && (
                                        <button
                                            onClick={() => window.location.href = activity.link}
                                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        >
                                            Ver detalle →
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <i className="pi pi-clock text-3xl text-gray-300 mb-2"></i>
                        <p className="text-gray-500">No hay actividad reciente</p>
                    </div>
                )}
            </Card>
        </AppLayout>
    );
};

export default Dashboard;
