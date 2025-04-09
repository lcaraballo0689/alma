<template>
  <div>
    <!-- Encabezado y botón para nueva bodega -->
    <div class="container-fluid p-0">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>Bodegas</h3>
        <button class="btn btn-primary" @click="openBodegaModal()">Nueva Bodega</button>
      </div>
      
      <!-- Tabla de bodegas -->
      <div class="table-responsive">
        <table class="table table-striped align-middle shadow-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Código Ubicación</th>
              <th>Cant. Módulos</th>
              <th>Cant. Entrepaños</th>
              <th>Cant. Caras</th>
              <th>Cant. Pisos</th>
              <th>Dimensiones (X, Y, Z)</th>
              <th>Fecha Creación</th>
              <th>Espacios</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="bodegas.length === 0">
              <td colspan="11" class="text-center text-muted py-4">No hay bodegas</td>
            </tr>
            <tr v-else v-for="bodega in bodegas" :key="bodega.id">
              <td>{{ bodega.id }}</td>
              <td>{{ bodega.nombre }}</td>
              <td>{{ bodega.codigoUbicacion }}</td>
              <td>{{ bodega.cantidadModulos }}</td>
              <td>{{ bodega.cantidadEntrepanos }}</td>
              <td>{{ bodega.cantidadCaras }}</td>
              <td>{{ bodega.cantidadPisos }}</td>
              <td>{{ bodega.dimensionX }} x {{ bodega.dimensionY }} x {{ bodega.dimensionZ }}</td>
              <td>{{ formatDate(bodega.fechaCreacion) }}</td>
              <td>{{ bodega.espacios }}</td>
              <td class="text-center">
                <button class="btn btn-sm btn-warning me-2" @click="editBodega(bodega)">
                  <i class="bx bx-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteBodega(bodega.id)">
                  <i class="bx bx-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para crear/editar bodega -->
    <div ref="bodegaModal" class="modal fade" tabindex="-1" aria-hidden="true" aria-labelledby="bodegaModalLabel">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="currentBodega">
          <div class="modal-header">
            <h5 class="modal-title" id="bodegaModalLabel">
              {{ currentBodega.id ? 'Editar Bodega' : 'Nueva Bodega' }}
            </h5>
            <button type="button" class="btn-close" @click="closeBodegaModal" aria-label="Cerrar"></button>
          </div>
          <form @submit.prevent="saveBodega">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" for="bodegaNombre">Nombre</label>
                  <input type="text" id="bodegaNombre" class="form-control" v-model="currentBodega.nombre" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="codigoUbicacion">Código Ubicación</label>
                  <input type="text" id="codigoUbicacion" class="form-control" v-model="currentBodega.codigoUbicacion" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="cantidadModulos">Cant. Módulos</label>
                  <input type="number" id="cantidadModulos" class="form-control" v-model.number="currentBodega.cantidadModulos" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="cantidadEntrepanos">Cant. Entrepaños</label>
                  <input type="number" id="cantidadEntrepanos" class="form-control" v-model.number="currentBodega.cantidadEntrepanos" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="cantidadCaras">Cant. Caras</label>
                  <input type="number" id="cantidadCaras" class="form-control" v-model.number="currentBodega.cantidadCaras" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="cantidadPisos">Cant. Pisos</label>
                  <input type="number" id="cantidadPisos" class="form-control" v-model.number="currentBodega.cantidadPisos" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dimensionX">Dimensión X</label>
                  <input type="number" step="0.01" id="dimensionX" class="form-control" v-model.number="currentBodega.dimensionX" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dimensionY">Dimensión Y</label>
                  <input type="number" step="0.01" id="dimensionY" class="form-control" v-model.number="currentBodega.dimensionY" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dimensionZ">Dimensión Z</label>
                  <input type="number" step="0.01" id="dimensionZ" class="form-control" v-model.number="currentBodega.dimensionZ" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="espacios">Espacios</label>
                  <input type="number" id="espacios" class="form-control" v-model.number="currentBodega.espacios" required />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeBodegaModal">Cerrar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Modal } from 'bootstrap';

export default {
  name: 'Bodegas',
  data() {
    return {
      bodegas: [],
      currentBodega: null,
      loading: false,
      modalInstance: null
    };
  },
  methods: {
    async loadBodegas() {
      this.loading = true;
      try {
        const res = await axios.get('/api/bodegas');
        this.bodegas = res.data;
      } catch (error) {
        console.error('Error al cargar las bodegas:', error);
      } finally {
        this.loading = false;
      }
    },
    openBodegaModal() {
      this.resetForm();
      this.showModal();
    },
    editBodega(bodega) {
      // Clona la bodega para evitar la mutación directa
      this.currentBodega = { ...bodega };
      this.showModal();
    },
    async saveBodega() {
      try {
        if (this.currentBodega.id) {
          // Actualización
          await axios.put(`/api/bodegas/${this.currentBodega.id}`, this.currentBodega);
        } else {
          // Creación
          await axios.post('/api/bodegas', this.currentBodega);
        }
        this.loadBodegas();
        this.closeBodegaModal();
      } catch (error) {
        console.error('Error al guardar la bodega:', error);
      }
    },
    async deleteBodega(id) {
      if (confirm('¿Estás seguro de eliminar esta bodega?')) {
        try {
          await axios.delete(`/api/bodegas/${id}`);
          this.loadBodegas();
        } catch (error) {
          console.error('Error al eliminar la bodega:', error);
        }
      }
    },
    resetForm() {
      this.currentBodega = {
        nombre: '',
        codigoUbicacion: '',
        cantidadModulos: 0,
        cantidadEntrepanos: 0,
        cantidadCaras: 0,
        cantidadPisos: 0,
        dimensionX: 0,
        dimensionY: 0,
        dimensionZ: 0,
        espacios: 0
      };
    },
    showModal() {
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.bodegaModal, { backdrop: 'static' });
      }
      this.modalInstance.show();
    },
    closeBodegaModal() {
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    }
  },
  mounted() {
    this.loadBodegas();
  }
};
</script>

<style scoped>
.table thead th {
  background-color: #f8f9fa;
}
</style>
