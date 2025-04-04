<template>
    <div class="empty-state">
      <!-- <video width="300" autoplay loop muted playsinline>
      <source :src="lostVideo" type="video/mp4" >
      Tu navegador no soporta el elemento video.
    </video> -->
    <img :src="lost" alt="">
      <h4 class="text-muted"  >{{ message }}</h4>
    </div>
  </template>
  
  <script>
  import lost from "@/assets/img/lost.gif";
  import lostVideo from "@/assets/img/lost.gif"; // Importa el video MP4
  
  export default {
    name: "EmptyState",
    props: {
      message: {
        type: String,
        default: "No se han cargado registros del archivo."
      }
    },
    data() {
      return {
        lost: lost,
        lostVideo: lostVideo
      };
    }
  }
  </script>
  
  <style scoped>
  .empty-state {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction:row;
    align-items: center;
    justify-content: center;
  }
  
  .empty-state img {
    max-width: 200px;
    margin-bottom: 16px;
  }
  </style>
  