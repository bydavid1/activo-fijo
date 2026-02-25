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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [assetsRes, reportsRes] = await Promise.all([
                axios.get('/api/assets?per_page=1'),
                axios.get('/api/reports/asset-list'),
            ]);

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

    return (
        <AppLayout user={user}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* KPI Cards */}
                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{stats.totalAssets}</div>
                        <div className="text-gray-600 mt-2">Activos Totales</div>
                    </div>
                </Card>

                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            ${(stats.totalValue / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-gray-600 mt-2">Valor Total</div>
                    </div>
                </Card>

                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{stats.activeEmployees}</div>
                        <div className="text-gray-600 mt-2">Empleados Activos</div>
                    </div>
                </Card>

                <Card className="bg-white shadow">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.pendingMaintenance}</div>
                        <div className="text-gray-600 mt-2">Mantenimiento Pendiente</div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Depreciation Chart */}
                <Card className="bg-white shadow">
                    <h5 className="text-lg font-bold mb-4">Depreciación Mensual</h5>
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
                <p className="text-gray-600">Las últimas operaciones aparecerán aquí</p>
            </Card>
        </AppLayout>
    );
};

export default Dashboard;
