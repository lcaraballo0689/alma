<template>
    <div class="pad-wrapper">
        <canvas ref="canvas" class="pad-canvas"></canvas>
        <div class="pad-controls">
            <span v-if="isDrawing" class="drawing-indicator">✍️ Escribiendo...</span>
            <button class="clear-btn" @click="clearPad">
                🗑️ Limpiar
            </button>

        </div>
    </div>
</template>

<script>
import SignaturePad from 'signature_pad';
export default {
    name: 'Pad',
    props: { modelValue: { type: String, default: '' } },
    emits: ['update:modelValue', 'input', 'save'],
    data() {
        return {
            sigPad: null,
            isDrawing: false
        };
    },
    methods: {
        clearPad() {
            this.sigPad.clear();
            this.emitValue();
        },
        emitValue() {
            const data = this.sigPad.isEmpty() ? '' : this.sigPad.toDataURL();
            this.$emit('update:modelValue', data);
            this.$emit('input', data);
        },
        savePad() {
            this.emitValue();
            this.$emit('save', this.modelValue);
        },
        resizeCanvas() {
            const canvas = this.$refs.canvas;
            const parent = canvas.parentNode;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            if (this.sigPad) this.sigPad.clear();
        }
    },
    watch: {
        modelValue(val) {
            if (this.sigPad) {
                val ? this.sigPad.fromDataURL(val) : this.sigPad.clear();
            }
        }
    },
    mounted() {
        this.$nextTick(() => {
            
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas);
            this.sigPad = new SignaturePad(this.$refs.canvas, {
                backgroundColor: 'rgba(255,255,255,1)',
                penColor: '#000'
            });
            this.sigPad.onBegin = () => (this.isDrawing = true);
            this.sigPad.onEnd = () => {
                this.isDrawing = false;
                this.emitValue();
            };
            // siempre limpio al montar
            this.sigPad.clear();
            if (this.modelValue) this.sigPad.fromDataURL(this.modelValue);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.resizeCanvas);
    }
};
</script>

<style scoped>
.pad-wrapper {
    width: 100%;
    max-width: 800px;
    margin: auto;
    border: 2px solid #333;
    border-radius: 16px;
    position: relative;
    background-color: #e0e0e0;
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

.pad-canvas {
    width: 100%;
    height: 400px;
    border: 1px solid #ccc;
    background: linear-gradient(135deg, #f9f9f9 25%, #eaeaea 25%, #eaeaea 50%, #f9f9f9 50%, #f9f9f9 75%, #eaeaea 75%, #eaeaea 100%);
    background-size: 20px 20px;
    cursor: url('https://cdn-icons-png.flaticon.com/512/1250/1250615.png') 4 12, crosshair;
}

.pad-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.clear-btn, .save-btn {
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    border: none;
    padding: 10px 16px;
    border-radius: 50px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.clear-btn:hover {
    background: rgba(255, 0, 0, 0.8);
    transform: scale(1.1);
}

.save-btn:hover {
    background: rgba(0, 128, 0, 0.8);
    transform: scale(1.1);
}

.drawing-indicator {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 16px;
    color: #333;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.8);
    padding: 6px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>