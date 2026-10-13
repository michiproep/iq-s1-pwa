import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

declare const process: { env: Record<string, string | undefined> };

// Für GitHub Pages setzt der Workflow BASE_PATH=/iq-s1-pwa/
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'apple-touch-icon.png'],
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    manifest: {
      name: 'IQ-S1 – Wissenschaftlicher Rechner', short_name: 'IQ-S1',
      description: 'Unabhängige, inoffizielle IQ-S1-Nachbildung als PWA',
      theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone', orientation: 'portrait',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    },
  })],
  test: { include: ['src/**/*.test.ts'] },
} as never);
