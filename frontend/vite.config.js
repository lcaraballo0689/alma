import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs-extra'

// Plugin personalizado para copiar la APK
const copyApkPlugin = () => ({
  name: 'copy-apk',
  writeBundle: async () => {
    const srcPath = path.resolve(__dirname, 'src/assets/apps/bodegapp.apk')
    const destPath = path.resolve(__dirname, 'dist/assets/apps/bodegapp.apk')
    
    try {
      // Asegurarse de que el directorio destino existe
      await fs.ensureDir(path.dirname(destPath))
      // Copiar el archivo
      await fs.copy(srcPath, destPath)
      console.log('APK copiada exitosamente a dist/assets/apps/')
    } catch (err) {
      console.error('Error al copiar la APK:', err)
    }
  }
})

export default defineConfig({
  base: '/', // Solo si tu aplicación se sirve desde un subdirectorio, ajusta este valor según corresponda.
  plugins: [
    vue(),
    copyApkPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  assetsInclude: ['**/*.apk'],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.apk')) {
            return 'assets/apps/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
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
