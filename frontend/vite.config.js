import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/', // Sólo si tu aplicación se sirve desde un subdirectorio
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.siglo21.com.co', // Aquí se redirigen las peticiones al backend
        changeOrigin: true
      }
    }
  }
})
