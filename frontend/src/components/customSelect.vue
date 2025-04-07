<template>
    <div class="custom-select">
      <select v-model="selectedEstado">
        <option value="">--Selecciona--</option>
        <option
          v-for="estado in estadosDisponibles"
          :key="estado"
          :value="estado"
        >
          {{ estado }}
        </option>
      </select>
    </div>
  </template>
  
  <script>
  import apiClient from "@/services/api";
  
  /**
   * Componente que muestra un <select> con la lista de estados
   * basada en el endpoint /api/estados/listar. 
   *
   * Props:
   *   - tipo: String (ej. "Desarchivo", "Prestamo", etc.)
   *   - clienteId: Number (ID del cliente)
   *   - autoFetch: Boolean (indica si se llama a fetchEstados() al montar el componente)
   *   - defaultEstado: String (valor inicial de selectedEstado)
   *
   * Emit:
   *   - "estados-cargados": Emite el array de estados una vez que se obtienen del endpoint
   *
   * Ejemplo de uso:
   * <EstadosSelectExample
   *   tipo="Desarchivo"
   *   :clienteId="2"
   *   :autoFetch="true"
   *   defaultEstado=""
   *   @estados-cargados="handleEstadosEnPadre"
   * />
   */
  export default {
    name: "customSelects",
    props: {
      tipo: {
        type: String,
        required: true,
      },
      clienteId: {
        type: Number,
        required: true,
      },
      autoFetch: {
        type: Boolean,
        default: true,
      },
      defaultEstado: {
        type: String,
        default: "",
      },
    },
    data() {
      return {
        selectedEstado: this.defaultEstado,
        estadosDisponibles: [],
      };
    },
    async mounted() {
      // Si autoFetch = true, llamamos a fetchEstados() al montar
      if (this.autoFetch) {
        await this.fetchEstados();
      }
    },
    methods: {
      /**
       * Llama al endpoint /api/estados/listar enviando:
       *   { tipo: this.tipo, clienteId: this.clienteId }
       * y asigna el resultado a estadosDisponibles.
       *
       * Luego emite "estados-cargados" para notificar al componente padre.
       */
      async fetchEstados() {
        try {
          if (!this.tipo || !this.clienteId) {
            console.error("No se puede obtener estados: faltan 'tipo' o 'clienteId'.");
            return;
          }
  
          const requestBody = {
            tipo: this.tipo,
            clienteId: this.clienteId,
          };
  
          const response = await apiClient.post("/api/estados/listar", requestBody);
          // Se asume que la respuesta es { data: [ 'CANCELADO','EN CAMINO','ENTREGADO','SOLICITADO'] }
          this.estadosDisponibles = response.data.data || [];
  
          // Emitimos el array de estados al padre
          this.$emit("estados-cargados", this.estadosDisponibles);
  
        } catch (error) {
          console.error("Error al obtener estados:", error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .custom-select select {
    padding: 4px 8px;
    font-size: 0.875rem;
  }
  </style>
  