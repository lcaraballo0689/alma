<template>
    <div style="width: 100%; max-width: 500px; margin: auto;">
      <!-- Componente de escaneo de QR -->
      <qrcode-stream
        @decode="onDecode"
        @init="onInit"
        style="width: 100%; height: auto;"
      />
      <p v-if="decodedContent" class="mt-3">
        Contenido Escaneado: <strong>{{ decodedContent }}</strong>
      </p>
    </div>
  </template>
  
  <script>
  import { QrcodeStream } from 'vue3-qrcode-reader';
  
  export default {
    name: 'QrScanner',
    components: {
      QrcodeStream
    },
    data() {
      return {
        decodedContent: ''
      };
    },
    methods: {
      onDecode(decodedString) {
        this.decodedContent = decodedString;
        console.log("Código QR decodificado:", decodedString);
      },
      onInit(promise) {
        promise.catch(error => {
          console.error("Error al inicializar QrcodeStream:", error);
        });
      }
    }
  };
  </script>
  
  <style scoped>
  /* Puedes agregar estilos adicionales si es necesario */
  </style>
  