<template>
  <div style="width: 100%; max-width: 500px; margin: auto;">
    <qrcode-stream
      @decode="onDecode"
      @init="onInit"
      style="width: 100%; aspect-ratio: 1/1; border: 2px solid #000; border-radius: 10%; overflow: hidden;"
    />
    <p v-if="decodedContent" class="mt-3" style="color: black;">
      Contenido Escaneado: <strong>{{ decodedContent }}</strong>
    </p>
  </div>
</template>

<script>
import { QrcodeStream } from 'vue3-qrcode-reader'

export default {
  name: 'QrScanner',
  components: { QrcodeStream },
  data() {
    return {
      decodedContent: ''
    }
  },
  methods: {
    onDecode(decodedString) {
      this.decodedContent = decodedString
      // Emitimos el texto ya decodificado, no una Promise
      this.$emit('qr-detected', decodedString)
      console.log('Código QR decodificado:', decodedString)
    },
    onInit(promise) {
      promise.catch(err => {
        console.error('Error al inicializar QrcodeStream:', err)
      })
    }
  }
}
</script>