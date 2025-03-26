<template>
    <div class="table-skeleton" :style="loaderStyles">
      <div v-for="n in rows" :key="n" class="table-row">
        <div v-for="c in columns" :key="c" class="table-cell skeleton-cell"></div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "TableSkeletonLoader",
    props: {
      rows: {
        type: Number,
        default: 30
      },
      columns: {
        type: Number,
        default: 8
      },
      width: {
        type: String,
        default: "100%"
      },
      height: {
        type: String,
        default: "100%"
      }
    },
    computed: {
      loaderStyles() {
        return {
          width: this.width,
          height: this.height
        };
      }
    }
  }
  </script>
  
  <style scoped>
  .table-skeleton {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  
  .table-row {
    display: flex;
    width: 100%;
    margin-bottom: 8px;
  }
  
  .table-row:last-child {
    margin-bottom: 0;
  }
  
  .table-cell {
    flex: 1;
    height: 20px; /* Altura de cada celda, puedes ajustarla */
    margin-right: 8px;
  }
  
  .table-row .table-cell:last-child {
    margin-right: 0;
  }
  
  .skeleton-cell {
    background-color: #c72828;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }
  
  /* Efecto shimmer */
  .skeleton-cell::after {
    content: "";
    position: absolute;
    top: 0;
    left: -200px;
    width: 200px;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.4), rgba(255,255,255,0));
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% {
      left: -200px;
    }
    100% {
      left: 100%;
    }
  }
  </style>
  