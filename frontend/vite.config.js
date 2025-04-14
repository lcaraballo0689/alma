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
  server: {
    proxy: {
      '/api': {
        target: 'https://api.siglo21.com.co',
        changeOrigin: true
      }
    }
  }
})
