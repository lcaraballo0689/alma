<template>
  <transition name="fade">
    <div v-if="visible" class="overlay">
      <div class="overlay-content">
        <span class="loader"></span>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: "LoadingOverlay",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
/* 🔹 Fondo con desenfoque y transición suave */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(1px); /* Suaviza el fondo */
  background: rgba(255, 255, 255, 0.938);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
 
}

.loader {
    position: fixed;
    width:  48px;
    height: 48px;
    background: #de3500;
    transform: rotateX(65deg) rotate(45deg);
   
    transform: perspective(200px) rotateX(65deg) rotate(45deg); 
    color: #000000;
    animation: layers1 1s linear infinite alternate;
  }
  .loader:after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    animation: layerTr 1s linear infinite alternate;
  }

  @keyframes layers1 {
    0% { box-shadow: 0px 0px 0 0px  }
   90% , 100% { box-shadow: 20px 20px 0 -4px  }
  }
  @keyframes layerTr {
    0% { transform:  translate(0, 0) scale(1) }
    100% {  transform: translate(-25px, -25px) scale(1) }
  }
      
</style>
