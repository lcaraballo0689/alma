<template>
    <div class="dashboard container my-4">

      <!-- Fila de tarjetas informativas -->
      <div class="row">
        <div class="col-md-4 mb-3" v-for="(card, index) in cards" :key="index">
          <div class="card text-white h-100" :class="card.bgClass">
            <div class="card-body d-flex align-items-center justify-content-between">
              <div>
                <h5 class="card-title">{{ card.title }}</h5>
                <p class="card-text display-6">{{ card.value }}</p>
              </div>
              <div>
                <i :class="card.icon" style="font-size: 2.5rem;"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Sección adicional: Gráfico de tendencias (Datos ficticios) -->
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h3>Gráfico de Tendencias</h3>
            </div>
            <div class="card-body">
              <p class="text-muted">[Gráfico de tendencias con datos ficticios]</p>
              <!-- Aquí se integraría el componente del gráfico, por ejemplo con Chart.js -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "Dashboard",
    data() {
      return {
        // Datos ficticios para las tarjetas del dashboard
        cards: [
          {
            title: "Total Clientes",
            value: 150,
            icon: "bx bx-user",
            bgClass: "bg-primary"
          },
          {
            title: "Total Usuarios",
            value: 75,
            icon: "bx bx-group",
            bgClass: "bg-success"
          },
          {
            title: "Total Bodegas",
            value: 20,
            icon: "bx bx-building",
            bgClass: "bg-info"
          },
          {
            title: "Total Flotas",
            value: 10,
            icon: "bx bx-truck",
            bgClass: "bg-warning"
          },
          {
            title: "Transferencias Pendientes",
            value: 5,
            icon: "bx bx-directions",
            bgClass: "bg-danger"
          }
        ]
      };
    },
    created() {
      // Si en el futuro se conecta a una API, se puede cargar la data aquí.
      // console.log('Data de tarjetas:', this.cards);
    }
  };
  </script>
  
  <style scoped>
  /* Asegúrate de tener bootstrap importado en tu proyecto, ya sea globalmente o mediante CDN */
  .dashboard {
    /* Espaciado extra para mejorar la visualización */
  }
  
  /* Efecto hover para las tarjetas */
  .card {
    transition: transform 0.2s ease-in-out;
    cursor: pointer;
  }
  
  .card:hover {
    transform: translateY(-5px);
  }
  
  /* Opcional: Estilo para el título y el contenido de las tarjetas */
  .card-title {
    font-size: 1.2rem;
  }
  
  .card-text {
    font-weight: bold;
  }
  </style>
  