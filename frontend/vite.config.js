import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/', // Solo si tu aplicación se sirve desde un subdirectorio, ajusta este valor según corresponda.
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  assetsInclude: ['**/*.apk'],
  server: {
    host: true, // Expone a todas las interfaces de red
    port: 5173, // Puerto por defecto de Vite
    proxy: {
      '/api': {
        target: 'https://api.siglo21.com.co',
        changeOrigin: true
      }
    }
  }
})
