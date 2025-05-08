<template>
  <div class="signature-wrapper">
    <canvas ref="canvas" class="signature-canvas"></canvas>
    <button type="button" @click="clear">Limpiar</button>
  </div>
</template>

<script>
import SignaturePad from 'signature_pad';
export default {
  name: 'SignatureCapture',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  mounted() {
    const canvas = this.$refs.canvas;
    this.signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgba(0,0,0,0)', penColor: '#000', minWidth: 1, maxWidth: 3 });
    this.signaturePad.onEnd = () => this.emitSignature();
  },
  methods: {
    emitSignature() {
      this.$emit('update:modelValue', this.signaturePad.toDataURL());
    },
    clear() {
      this.signaturePad.clear();
      this.$emit('update:modelValue', '');
    }
  }
};
</script>

<style scoped>
.signature-wrapper { border:1px solid #ccc; width:300px; height:200px; position:relative; }
.signature-canvas { width:100%; height:100%; }
button { position:absolute; top:5px; right:5px; }
</style>