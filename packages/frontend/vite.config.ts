import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const NODE_ENV = process.env.NODE_ENV || 'development';
const VITE_PORT = parseInt(process.env.VITE_PORT || '5173', 10);
const BACKEND_PORT = process.env.PORT || '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: VITE_PORT,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    // Explicitly prefer ESM exports
    conditions: ['import', 'module', 'browser', 'default'],
  },
  define: {
    'import.meta.env.MODE': JSON.stringify(NODE_ENV),
  },
});
