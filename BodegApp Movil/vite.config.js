import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      filename: 'sw.js',
      includeAssets: ['android-launchericon-192-192.png', 'android-launchericon-512-512.png'],
      manifest: {
        name: 'BodegApp Movil',
        short_name: 'BodegApp',
        description: 'Aplicación móvil para gestión de bodegas',
        theme_color: '#6200ea',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache'
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache'
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
});
