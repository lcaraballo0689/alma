import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/', // Solo si tu aplicación se sirve desde un subdirectorio, ajusta este valor según corresponda.
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // Permite la actualización automática del Service Worker
      manifest: {
        name: 'BodegApp',
        short_name: 'BodegApp',
        start_url: '/login', // La URL de inicio al instalar la PWA
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#235ca4',
        icons: [
          {
            src: 'android-launchericon-192-192.png', // Asegúrate de tener estos archivos en la carpeta public.
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.siglo21.com.co',
        changeOrigin: true
      }
    }
  }
})
