<template>
    <div class="table-skeleton">
      <!-- Encabezado de la tabla -->
      <div class="table-header-skeleton">
        <div
          v-for="col in columns"
          :key="'header-' + col"
          class="header-cell skeleton-cell"
        ></div>
      </div>
  
      <!-- Filas de la tabla -->
      <div
        v-for="row in rows"
        :key="'row-' + row"
        class="table-row-skeleton"
      >
        <div
          v-for="col in columns"
          :key="'cell-' + row + '-' + col"
          class="row-cell skeleton-cell"
        ></div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "ProfessionalTableSkeleton",
    props: {
      columns: {
        type: Number,
        default: 5
      },
      rows: {
        type: Number,
        default: 5
      }
    }
  };
  </script>
  
  <style scoped>
  /* Contenedor principal del skeleton */
  .table-skeleton {
    width: 100%;
    height: 100%;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  /* Encabezado de la tabla */
  .table-header-skeleton {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
  
  /* Celdas del encabezado */
  .header-cell {
    flex: 1;
    height: 16px;
    margin-right: 12px;
    background-color: #e0e0e0;
    border-radius: 2px;
  }
  .header-cell:last-child {
    margin-right: 0;
  }
  
  /* Filas de la tabla */
  .table-row-skeleton {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    border-bottom: 1px solid #eee;
  }
  .table-row-skeleton:last-child {
    border-bottom: none;
  }
  
  /* Celdas de cada fila */
  .row-cell {
    flex: 1;
    height: 16px;
    margin-right: 12px;
    background-color: #e0e0e0;
    border-radius: 2px;
  }
  .row-cell:last-child {
    margin-right: 0;
  }
  
  /* Efecto shimmer */
  .skeleton-cell {
    position: relative;
    overflow: hidden;
  }
  .skeleton-cell::after {
    content: "";
    position: absolute;
    top: 0;
    left: -150px;
    width: 150px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: shimmer 1.6s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(300%);
    }
  }
  </style>
  