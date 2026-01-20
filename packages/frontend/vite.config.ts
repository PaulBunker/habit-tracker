/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

const NODE_ENV = process.env.NODE_ENV || 'development';

function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function versionMetaPlugin(): Plugin {
  const version = getGitHash();
  const buildTime = new Date().toISOString();

  return {
    name: 'version-meta',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `    <meta name="app-version" content="${version}">\n    <meta name="build-time" content="${buildTime}">\n  </head>`
      );
    },
  };
}

function faviconPlugin(): Plugin {
  const favicon = NODE_ENV === 'production' ? '/favicon-prod.svg' : '/favicon-dev.svg';
  return {
    name: 'favicon-env',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="icon" type="image\/svg\+xml" href="[^"]*" \/>/,
        `<link rel="icon" type="image/svg+xml" href="${favicon}" />`
      );
    },
  };
}

const VITE_PORT = parseInt(process.env.VITE_PORT || '5173', 10);
const BACKEND_PORT = process.env.PORT || '3000';

// Build allowed hosts list from environment variable
const ALLOWED_HOSTS = ['localhost'];
if (process.env.VITE_ALLOWED_HOSTS) {
  ALLOWED_HOSTS.push(
    ...process.env.VITE_ALLOWED_HOSTS.split(',')
      .map((h) => h.trim())
      .filter(Boolean)
  );
}

export default defineConfig({
  plugins: [react(), versionMetaPlugin(), faviconPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
  server: {
    port: VITE_PORT,
    allowedHosts: ALLOWED_HOSTS,
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
