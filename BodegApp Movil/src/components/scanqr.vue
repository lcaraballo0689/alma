<template>
  <div class="qr-scanner-container">
    <div class="qr-scanner-overlay">
      <!-- Frame elements -->
      <div class="qr-frame">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <!-- Optional: Add a scanning line animation -->
        <!-- <div class="scan-line"></div> -->
      </div>
      <p class="scan-prompt">Centre el código QR en el marco</p>
    </div>
    <qrcode-stream :track="trackFunction" @decode="onDecode" @init="onInit" class="qr-stream" />
    <p v-if="decodedContent" class="mt-3 decoded-text">
      Contenido Escaneado: <strong>{{ decodedContent }}</strong>
    </p>
    <p v-if="initError" class="error-text">{{ initError }}</p>
    <!-- Optional: Manual torch toggle button if automatic is unreliable -->
    <button @click="toggleTorchManually" v-if="hasTorchSupport">
      {{ torchActive ? 'Apagar Flash' : 'Encender Flash' }}
    </button> 
  </div>
</template>

<script>
import { QrcodeStream } from 'vue3-qrcode-reader'
import beepSound from '@/assets/sounds/beep.mp3'

const SCAN_TIMEOUT_MS = 5000; // Time in ms before trying to turn on torch

export default {
  name: 'QrScanner',
  components: { QrcodeStream },
  data() {
    return {
      decodedContent: '',
      audio: new Audio(beepSound),
      initError: null,
      videoTrack: null,
      hasTorchSupport: false,
      torchActive: false,
      scanTimeoutId: null,
    }
  },
  mounted() {
    this.audio.preload = 'auto'
  },
  beforeUnmount() {
    // Ensure torch is off and timeout is cleared when component is destroyed
    this.setTorch(false);
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
    }
  },
  methods: {
    onDecode(decodedString) {
      if (this.decodedContent) return; // Avoid multiple decodes/sounds/vibrations

      this.decodedContent = decodedString;
      console.log('Código QR decodificado:', decodedString);

      // Clear the timeout if it exists
      if (this.scanTimeoutId) {
        clearTimeout(this.scanTimeoutId);
        this.scanTimeoutId = null;
      }

      // Turn off torch if it was activated
      if (this.torchActive) {
        this.setTorch(false);
      }

      // Play sound
      this.audio.currentTime = 0; // Rewind to start
      this.audio.play().catch(e => console.error("Error playing sound:", e));

      // Vibrate
      if (navigator.vibrate) {
        navigator.vibrate([200]); // Vibrate for 200ms
      }

      this.$emit('qr-detected', decodedString);
    },

    async onInit(promise) {
      this.initError = null;
      this.decodedContent = ''; // Reset content on init
      try {
        const capabilities = await promise;
        // Successfully initialized
        console.log('QrcodeStream initialized.');
        // Start timeout to potentially turn on torch
        this.resetScanTimeout();
      } catch (error) {
        console.error('Error al inicializar QrcodeStream:', error);
        if (error.name === 'NotAllowedError') {
          this.initError = 'Permiso de cámara denegado. Por favor, habilítelo en la configuración de su navegador.';
        } else if (error.name === 'NotFoundError') {
          this.initError = 'No se encontró ninguna cámara compatible.';
        } else if (error.name === 'NotReadableError') {
          this.initError = 'La cámara ya está en uso por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
          this.initError = 'Las cámaras instaladas no cumplen los requisitos.';
        } else if (error.name === 'StreamApiNotSupportedError') {
          this.initError = 'La API Stream no es compatible con este navegador.';
        } else {
          this.initError = `Error inesperado de la cámara: ${error.message}`;
        }
      }
    },

    // Called by qrcode-stream with track capabilities
    trackFunction(capabilities) {
      // Check if torch/flash is supported
      const torchSupported = !!capabilities.torch;
      this.hasTorchSupport = torchSupported;
      console.log(`Torch supported: ${torchSupported}`);
      return capabilities; // Return capabilities unchanged for now
    },

    // Method to control the torch
    async setTorch(on) {
      if (!this.hasTorchSupport || !this.videoTrack) {
        console.warn("Torch control not available or track not ready.");
        return;
      }
      try {
        await this.videoTrack.applyConstraints({
          advanced: [{ torch: on }]
        });
        this.torchActive = on;
        console.log(`Torch turned ${on ? 'ON' : 'OFF'}`);
      } catch (err) {
        console.error("Error applying torch constraints:", err);
        // Handle potential errors, e.g., torch becomes unavailable
        this.hasTorchSupport = false; // Assume torch is no longer controllable
      }
    },

    // Gets the video track reference (needed for applyConstraints)
    // This is a bit of a workaround as vue3-qrcode-reader doesn't directly expose the track easily
    // We rely on the stream being available shortly after init
    async captureTrackReference() {
      if (this.videoTrack) return; // Already have it

      const stream = this.$refs.qrStream?.stream; // Access internal stream if possible (check component's API/internals)
      // Fallback: Try accessing via navigator.mediaDevices if component doesn't expose stream
      if (!stream && navigator.mediaDevices?.getUserMedia) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); // Request stream again - might cause flicker
          const tracks = mediaStream.getVideoTracks();
          if (tracks.length > 0) {
            this.videoTrack = tracks[0];
            const capabilities = this.videoTrack.getCapabilities();
            this.hasTorchSupport = !!capabilities.torch;
            console.log("Track reference captured via getUserMedia fallback.");
            // Important: Stop this manually requested stream if not needed by the component
            // tracks.forEach(track => track.stop()); // Be careful not to stop the component's stream
          }
        } catch (err) {
          console.error("Error getting track reference via fallback:", err);
        }
      } else if (stream) {
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          this.videoTrack = tracks[0];
          const capabilities = this.videoTrack.getCapabilities();
          this.hasTorchSupport = !!capabilities.torch;
          console.log("Track reference captured from component stream.");
        }
      }

      if (!this.videoTrack) {
        console.warn("Could not obtain video track reference for torch control.");
        this.hasTorchSupport = false;
      }
    },


    resetScanTimeout() {
      if (this.scanTimeoutId) {
        clearTimeout(this.scanTimeoutId);
      }
      // Capture track reference before setting timeout
      this.captureTrackReference().then(() => {
        if (!this.hasTorchSupport) return; // Don't set timeout if no torch

        this.scanTimeoutId = setTimeout(() => {
          if (!this.decodedContent && this.hasTorchSupport && !this.torchActive) {
            console.log(`No scan detected after ${SCAN_TIMEOUT_MS}ms, attempting to turn on torch.`);
            this.setTorch(true);
          }
        }, SCAN_TIMEOUT_MS);
      });
    },

    // Optional: Manual toggle if needed
     toggleTorchManually() {
      if (!this.videoTrack) {
          this.captureTrackReference().then(() => {
              if(this.hasTorchSupport) this.setTorch(!this.torchActive);
          });
       } else if (this.hasTorchSupport) {
           this.setTorch(!this.torchActive);
      }
     }
  }
}
</script>

<style scoped>
.qr-scanner-container {
  position: relative;
  /* Needed for absolute positioning of overlay */
  width: 100%;
  max-width: 500px;
  margin: auto;
  overflow: hidden;
  /* Hide parts of the stream outside the container */
  border-radius: 10px;
  /* Match stream border-radius */
}

.qr-stream {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: block;
  /* Remove potential extra space below */
  border: 2px solid #555;
  /* Keep a subtle border for the stream itself */
  border-radius: 10px;
}

.qr-scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  /* Allow clicks/touches to go through to the stream */
  z-index: 1;
  /* Ensure overlay is above the stream */
}

.qr-frame {
  width: 70%;
  /* Adjust size of the scanning area */
  height: 70%;
  /* Adjust size of the scanning area */
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.6);
  /* Semi-transparent white border */
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.5);
  /* Darken area outside the frame */
}

.corner {
  position: absolute;
  width: 25px;
  /* Size of the corner lines */
  height: 25px;
  /* Size of the corner lines */
  border: 5px solid #4CAF50;
  /* Green corners */
}

.corner.top-left {
  top: -5px;
  left: -5px;
  border-right: none;
  border-bottom: none;
}

.corner.top-right {
  top: -5px;
  right: -5px;
  border-left: none;
  border-bottom: none;
}

.corner.bottom-left {
  bottom: -5px;
  left: -5px;
  border-right: none;
  border-top: none;
}

.corner.bottom-right {
  bottom: -5px;
  right: -5px;
  border-left: none;
  border-top: none;
}


.scan-line {
  position: absolute;
  top: 0;
  left: 5%;
  width: 90%;
  height: 3px;
  background: linear-gradient(to right, transparent, #4CAF50, transparent);
  animation: scan 2.5s linear infinite;
}

@keyframes scan {
  0% {
    top: 5%;
  }

  50% {
    top: 95%;
  }

  100% {
    top: 5%;
  }
}


.scan-prompt {
  color: white;
  margin-top: 15px;
  /* Space between frame and text */
  font-size: 0.9em;
  background-color: rgba(0, 0, 0, 0.5);
  /* Semi-transparent background */
  padding: 5px 10px;
  border-radius: 5px;
}


.decoded-text {
  color: black;
  text-align: center;
  word-break: break-all;
  /* Prevent long strings from overflowing */
}

.error-text {
  color: red;
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
}


button {
  margin-top: 15px;
  padding: 10px 15px;
  cursor: pointer;
}
</style>