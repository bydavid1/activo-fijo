import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Extraer host de APP_URL (ej: http://192.168.0.11:8000 -> 192.168.0.11)
    const appUrl = env.APP_URL || 'http://localhost:8000';
    const hmrHost = new URL(appUrl).hostname;

    return {
        plugins: [
            react(),
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.jsx'],
                refresh: true,
            }),
            tailwindcss(),
        ],
        server: {
            host: '0.0.0.0',
            port: 5173,
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
            hmr: {
                host: hmrHost,
            },
        },
    };
});
