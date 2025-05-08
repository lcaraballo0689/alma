<template>
    <div class="camera-wrapper">
        <div class="camera-video-container" ref="container">
            <video ref="video" autoplay playsinline class="video-camera"></video>
            <div v-if="showFocus" class="focus-ring" :style="focusStyle"></div>
        </div>
        <div v-if="flashCapture" class="capture-flash"></div>
        <div class="viewfinder"></div>
        <div class="camera-ui">
            <div class="top-bar">
                <button class="icon-btn" @click="toggleFlash">
                    <Icon :icon="flashMode==='on' ? 'mdi:flash' : 'mdi:flash-off'" />
                </button>
                <button class="icon-btn" @click="switchCamera">
                    <Icon icon="mdi:camera-flip-outline" />
                </button>
            </div>
           
            <div class="bottom-bar">
                <button :disabled="photosData.length === 0" class="icon-btn thumb-button"
                    @click="openGalleryCam(photosData.length - 1)">
                    <img :src="photosData[photosData.length - 1]" class="thumb-img" />
                </button>
                <button class="shutter-button" @click="capturePhoto">
                    <Icon icon="material-symbols:camera" color="white" width="70" height="70" class="mt-0" />
                </button>
                <button class="icon-btn close-button" @click="$emit('close'); closeCam()">
                    <Icon icon="mdi:arrow-back" />
                </button>
            </div>
        </div>
        <!-- galería modal -->
        <v-dialog v-model="showGalleryCam" v-if="photosData.length !== 0"  max-width="360">
            <v-card>
                <v-card-title>
                    <v-btn icon @click="closeGalleryCam">
                        <Icon icon="mdi-close" />
                    </v-btn>
                    <v-spacer />
                    
                </v-card-title>
                <v-card-text>
                    <v-img :src="photosData[selectedPhotoIndex]" aspect-ratio="9/16" contain />
                </v-card-text>
                <v-card-actions>
                    <v-btn text @click="prevPhotoCam" :disabled="selectedPhotoIndex === 0">Anterior</v-btn>
                    <v-spacer />
                    <v-btn text @click="nextPhotoCam"
                        :disabled="selectedPhotoIndex >= photosData.length - 1">Siguiente</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
export default {
    name: 'Camara',
    props: { photosData: { type: Array, default: () => [] } },
    data() {
        return {
            currentFacing: 'environment',
            flashMode: 'off',
            photoThumb: null,
            showGalleryCam: false,
            selectedPhotoIndex: 0,
            videoTrack: null,
            showFocus: false,
            focusPos: { x: '50%', y: '50%' },
            flashCapture: false,
            zoom: 1,
            minZoom: 1,
            maxZoom: 1,
            supportsZoom: false,
            pinchStartDist: null,
            pinchStartZoom: null,
            lastTap: 0
        };
    },
    computed: {
        focusStyle() {
            return { left: this.focusPos.x, top: this.focusPos.y };
        }
    },
    methods: {
        closeCam() {
            if (this.videoTrack) {
                this.videoTrack.stop();
                this.videoTrack = null;
            }
            const video = this.$refs.video;
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
        },
        startCamera() {
            const video = this.$refs.video;
            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia({ video: { facingMode: this.currentFacing } })
                    .then(stream => { 
                        video.srcObject = stream; 
                        video.play(); 
                        this.videoTrack = stream.getVideoTracks()[0];
                        const cap = this.videoTrack.getCapabilities();
                        if (cap.zoom) { this.minZoom = cap.zoom.min; this.maxZoom = cap.zoom.max; this.supportsZoom = true; }
                    })
                    .catch(err => console.error(err));
            }
        },
        capturePhoto() {
            this.flashCapture = true;
            setTimeout(() => { this.flashCapture = false; }, 100);
            const video = this.$refs.video;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            this.$emit('capture', canvas.toDataURL('image/png'));
        },
        toggleFlash() {
            if (!this.videoTrack) return;
            const cap = this.videoTrack.getCapabilities();
            if (!cap.torch) { console.warn('Flash no disponible'); return; }
            const enable = this.flashMode === 'off';
            this.videoTrack.applyConstraints({ advanced: [{ torch: enable }] })
                .then(() => { this.flashMode = enable ? 'on' : 'off'; })
                .catch(e => console.error('Error al cambiar flash:', e));
        },
        switchCamera() { this.currentFacing = this.currentFacing === 'environment' ? 'user' : 'environment'; this.startCamera(); },
        openGalleryCam(idx) { this.selectedPhotoIndex = idx; this.showGalleryCam = true; },
        closeGalleryCam() { this.showGalleryCam = false; },
        prevPhotoCam() { if (this.selectedPhotoIndex > 0) this.selectedPhotoIndex--; },
        nextPhotoCam() { if (this.selectedPhotoIndex < this.photosData.length - 1) this.selectedPhotoIndex++; },
        removePhotoCam(idx) { this.$emit('remove-photo', idx); this.selectedPhotoIndex = Math.min(this.selectedPhotoIndex, this.photosData.length - 2); },
        handleFocus(event) {
            const rect = this.$refs.video.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.focusPos = { x: x + 'px', y: y + 'px' };
            this.showFocus = true;
            clearTimeout(this._focusTimeout);
            this._focusTimeout = setTimeout(() => { this.showFocus = false; }, 600);
        },
        handleZoomChange() {
            if (!this.videoTrack) return;
            this.videoTrack.applyConstraints({ advanced: [{ zoom: this.zoom }] }).catch(()=>{});
        },
        onTouchStart(e) {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this.pinchStartDist = Math.hypot(dx, dy);
                this.pinchStartZoom = this.zoom;
            }
        },
        onTouchMove(e) {
            if (e.touches.length === 2 && this.pinchStartDist) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const scale = dist / this.pinchStartDist;
                let newZoom = this.pinchStartZoom * scale;
                newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
                this.zoom = newZoom;
                this.handleZoomChange();
            }
        },
        onTouchEnd(e) {
            if (e.touches.length < 2) {
                this.pinchStartDist = null;
                this.pinchStartZoom = null;
            }
        },
        onTap(event) {
            this.handleFocus(event);
            const now = Date.now();
            if (this.lastTap && (now - this.lastTap) < 300) {
                this.autoFocus();
                this.lastTap = 0;
            } else {
                this.lastTap = now;
            }
        },
        autoFocus() {
            const video = this.$refs.video;
            const rect = video.getBoundingClientRect();
            this.handleFocus({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 });
            // puede agregar foco real si disponible
        }
    },
    mounted() {
        this.startCamera();
        const c = this.$refs.container;
        c.addEventListener('touchstart', this.onTouchStart);
        c.addEventListener('touchmove', this.onTouchMove);
        c.addEventListener('touchend', this.onTouchEnd);
        c.removeEventListener('click', this.handleFocus);
        c.addEventListener('click', this.onTap);
    },

};
</script>
<style scoped>
.camera-wrapper {
    width: 100vw;
    height: calc(100vh - 10vh);
    aspect-ratio: 9 / 16;
    position: fixed;
    top: 56px;
    left: 0;
    z-index: 1000;
    margin: none;
}

.camera-video-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.video-camera {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.viewfinder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background-image:
        linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px);
    background-size: 33.33% 33.33%, 33.33% 33.33%;
}

.focus-ring {
    position: absolute;
    width: 80px;
    height: 80px;
    border: 2px solid #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(1);
    animation: focusAnim 0.6s ease-out;
}

@keyframes focusAnim {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

.capture-flash {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    opacity: 0.8;
    animation: flashAnim 0.1s ease-out forwards;
}

@keyframes flashAnim {
    to { opacity: 0; }
}

.camera-ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.top-bar,
.bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.3);
    padding: 8px 16px;
    backdrop-filter: blur(8px);
}

.icon-btn {
    background: rgba(255, 255, 255, 0.4);
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.2s ease;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.6);
}

.icon-btn:active {
    background: rgba(255, 255, 255, 0.7);
    transform: scale(0.9);
}

.bottom-bar .shutter-button {
    width: 75px;
    height: 75px;
    border: 4px solid #fff;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    margin: 0 16px;
    transition: transform 0.15s ease, background 0.2s ease;
}

.bottom-bar .shutter-button:hover {
    background: rgba(255, 255, 255, 0.6);
}

.bottom-bar .shutter-button:active {
    transform: scale(0.9);
}

.bottom-bar .thumb-button .thumb-img {
    border-radius: 50%;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.zoom-slider {
    width: 100px;
    accent-color: #fff;
}
.zoom-bar {
    position: absolute;
    bottom: 80px; /* Adjust this value to position it above the bottom menu */
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  
    padding: 8px 16px;
   
}
</style>