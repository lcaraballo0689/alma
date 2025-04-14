<template>
  <div class="container-fluid m-0 p-0">
    <div class="row m-0 p-0 mt-2">
      <div class="col-md-12 m-0 p-0">
        <div class="card m-0 p-0 shadow-sm">
          <!-- Encabezado (card-header) -->
          <div class="card-header d-flex align-items-center justify-content-between">
            <!-- Grupo de búsqueda -->
            <div class="input-group search-pill">
              <span class="input-group-text">
                <i class="bx bx-search"></i>
              </span>
              <input type="text" class="form-control" placeholder="Buscar por nombre o NIT" v-model="searchQuery"
                aria-label="Buscar cliente por nombre o NIT" autofocus />
            </div>


            <!-- Botón nuevo cliente -->
            <button class="buttons-actions my-custom-height" @click="openNewClientModal"
              aria-label="Crear nuevo cliente">
              <i class="bx bx-plus-circle me-1"></i> Nuevo Cliente
            </button>
          </div>

          <!-- Cuerpo de la card -->
          <div class="card-body m-0 p-0">
            <div class="table-responsive">
              <table class="table table-striped align-middle shadow-sm">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>NIT</th>
                    <th>Devolución</th>
                    <th>Especial</th>
                    <th>Normal</th>
                    <th>Urgente</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Loading Spinner -->
                  <tr v-if="loading">
                    <td colspan="9" class="text-center py-5">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                  <!-- Sin clientes -->
                  <tr v-else-if="filteredClientes.length === 0">
                    <td colspan="9" class="text-center text-muted py-5">
                      <i class="bx bx-user-x fs-1 d-block mb-2 text-secondary"></i>
                      No hay clientes registrados aún.
                    </td>
                  </tr>
                  <!-- Lista de clientes -->
                  <tr v-for="cliente in filteredClientes" :key="cliente.id">
                    <td>{{ cliente.id }}</td>
                    <td>{{ cliente.nombre }}</td>
                    <td>{{ cliente.telefono }}</td>
                    <td>{{ cliente.nit }}</td>
                    <td><span class="badge bg-info">{{ cliente.ansDevolucion }} h</span></td>
                    <td><span class="badge bg-success">{{ cliente.ansEspecial }} h</span></td>
                    <td><span class="badge bg-warning text-dark">{{ cliente.ansNormal }} h</span></td>
                    <td><span class="badge bg-danger">{{ cliente.ansUrgente }} h</span></td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-warning me-1" @click="editCliente(cliente)" title="Editar cliente">
                        <i class="bx bx-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-danger" @click="deleteCliente(cliente.id)" title="Eliminar cliente">
                        <i class="bx bx-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <!-- Fin card-body -->
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar Cliente -->
    <div ref="clientModal" class="modal fade" tabindex="-1" aria-labelledby="clienteModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content modal-custom">
          <form @submit.prevent="saveCliente">
            <div class="modal-header modal-header-custom">
              <h5 class="modal-title" id="clienteModalLabel">
                {{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}
              </h5>
              <button type="button" class="btn-close" @click="closeClientModal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre</label>
                  <input type="text" class="form-control" v-model="currentCliente.nombre" required
                    autocomplete="name" />

                  <label class="form-label mt-3">Teléfono</label>
                  <input type="tel" class="form-control" v-model="currentCliente.telefono" required
                    autocomplete="tel" />

                  <label class="form-label mt-3">NIT</label>
                  <input type="text" class="form-control" v-model="currentCliente.nit" required autocomplete="off" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">ANS Devolución (h)</label>
                  <input type="number" min="0" class="form-control" v-model.number="currentCliente.ansDevolucion"
                    required />

                  <label class="form-label mt-3">ANS Especial (h)</label>
                  <input type="number" min="0" class="form-control" v-model.number="currentCliente.ansEspecial"
                    required />

                  <label class="form-label mt-3">ANS Normal (h)</label>
                  <input type="number" min="0" class="form-control" v-model.number="currentCliente.ansNormal"
                    required />

                  <label class="form-label mt-3">ANS Urgente (h)</label>
                  <input type="number" min="0" class="form-control" v-model.number="currentCliente.ansUrgente"
                    required />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeClientModal">
                <i class="bx bx-x me-0"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-success" :disabled="isLoading">
                <i :class="isEditing ? 'bx bx-edit-alt me-1' : 'bx bx-save me-1'"></i>
                <span v-if="!isLoading">{{ isEditing ? 'Actualizar' : 'Crear' }}</span>
                <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import apiClient from '@/services/api';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';

export default {
  name: 'ClientesCrud',
  data() {
    return {
      clientes: [],
      searchQuery: '',
      loading: true,
      isLoading: false,
      isEditing: false,
      currentCliente: this.getEmptyCliente(),
      modalInstance: null
    };
  },
  computed: {
    filteredClientes() {
      const query = this.searchQuery.toLowerCase();
      return query ? this.clientes.filter(c => c.nombre.toLowerCase().includes(query) || c.nit.toLowerCase().includes(query)) : this.clientes;
    }
  },
  methods: {
    getEmptyCliente() {
      return {
        id: null,
        nombre: '',
        telefono: '',
        nit: '',
        ansDevolucion: 0,
        ansEspecial: 0,
        ansNormal: 0,
        ansUrgente: 0
      };
    },
    async loadClientes() {
      this.loading = true;
      try {
        const res = await apiClient.get('/api/clientes');
        this.clientes = res.data;
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        this.clientes = [];
      } finally {
        this.loading = false;
      }
    },
    openNewClientModal() {
      this.resetForm();
      this.isEditing = false;
      this.showModal();
    },
    editCliente(cliente) {
      this.currentCliente = { ...cliente };
      this.isEditing = true;
      this.showModal();
    },
    async saveCliente() {
      this.isLoading = true;
      try {
        if (this.isEditing) {
          await apiClient.put(`/api/clientes/${this.currentCliente.id}`, this.currentCliente);
          Swal.fire('Actualizado', 'Cliente actualizado correctamente', 'success');
        } else {
          const res = await apiClient.post('/api/clientes', this.currentCliente);
          this.currentCliente.id = res.data.id;
          Swal.fire('Creado', 'Cliente creado correctamente', 'success');
        }
        await this.loadClientes();
        this.closeClientModal();
      } catch (error) {
        console.error('Error al guardar cliente:', error);
        Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    async deleteCliente(id) {
      const confirm = await Swal.fire({
        title: '¿Eliminar cliente?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (confirm.isConfirmed) {
        try {
          await apiClient.delete(`/api/clientes/${id}`);
          await this.loadClientes();
          Swal.fire('Eliminado', 'Cliente eliminado correctamente', 'success');
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
        }
      }
    },
    resetForm() {
      this.currentCliente = this.getEmptyCliente();
    },
    showModal() {
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.clientModal, { backdrop: 'static', keyboard: false });
      }
      this.modalInstance.show();
    },
    closeClientModal() {
      this.modalInstance?.hide();
    }
  },
  mounted() {
    this.loadClientes();
  }
};
</script>

<style scoped>
.header-clientes h2 {
  font-weight: bold;
  font-size: 1.8rem;
}

.btn-new-client {
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.btn-new-client:hover {
  transform: scale(1.05);
}

.search-container {
  width: 100%;
  max-width: 300px;
}


/* Estilo visual limpio para el grupo completo */
.search-container .input-group {
  border: none;
  border-radius: 2rem;
  overflow: hidden;
  background-color: #fff;
}

/* Ícono sin borde azul ni sombra */
.search-container .input-group-text {
  background-color: #f8f9fa;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-striped tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.table th,
.table td {
  vertical-align: middle;
  font-size: 0.95rem;
}

.modal-custom {
  border-radius: 10px;
  animation: fadeIn 0.3s ease-in-out;
}

.modal-header-custom {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

@media (max-width: 576px) {

  table td:nth-child(1),
  table th:nth-child(1) {
    display: none;
  }

  .modal-dialog {
    max-width: 95%;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-group-text {
  display: flex;
  align-items: center;
  padding: none;
  margin: none;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--bs-body-color);
  text-align: center;
  white-space: nowrap;
  background-color: var(--bs-tertiary-bg);
  border: none !important;
}

.buttons-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 41px;
  width: 150px;
  padding: 0 1rem;
  margin-top: 0;
  /* quita -10px */
  gap: 0.25rem;
  /* espacio entre icono y texto */
  font-weight: 500;
  font-size: 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease-in-out;
}

/* Agrupa el input y el icono dentro de una "píldora" */
.search-pill {
  border-radius: 2rem;
  overflow: hidden;
  background-color: #fff;
  height: 36px;
  max-width: 300px;
  border: 1px solid #ced4da;
}

/* Estilo del icono */
.search-pill .input-group-text {
  background-color: transparent;
  border: none;
  padding-left: 14px;
  padding-right: 8px;
  display: flex;
  align-items: center;
  color: #6c757d;

}

/* Estilo del input */
.search-pill .form-control {
  border: none;
  border-radius: 0;
  height: 36px;
  box-shadow: none;
  padding-left: 0;
}

/* Elimina enfoque azul del input */
.search-pill .form-control:focus {
  box-shadow: none;
}
</style>