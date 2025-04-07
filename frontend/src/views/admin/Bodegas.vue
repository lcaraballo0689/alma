<template>
  <div class="container my-4">
    <h2 class="mb-4">Mantenedor de Clientes</h2>
    <!-- Botón para agregar nuevo cliente -->
    <div class="mb-3">
      <button class="btn btn-primary" @click="openNewClientForm">
        Nuevo Cliente
      </button>
    </div>

    <!-- Tabla de clientes -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>NIT</th>
          <th>ANS Devolución</th>
          <th>ANS Especial</th>
          <th>ANS Normal</th>
          <th>ANS Urgente</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cliente in clientes" :key="cliente.id">
          <td>{{ cliente.id }}</td>
          <td>{{ cliente.nombre }}</td>
          <td>{{ cliente.telefono }}</td>
          <td>{{ cliente.nit }}</td>
          <td>{{ cliente.ansDevolucion }}</td>
          <td>{{ cliente.ansEspecial }}</td>
          <td>{{ cliente.ansNormal }}</td>
          <td>{{ cliente.ansUrgente }}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" @click="editCliente(cliente)">
              Editar
            </button>
            <button class="btn btn-sm btn-danger" @click="deleteCliente(cliente.id)">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Formulario para crear o editar un cliente -->
    <div v-if="showForm" class="card mt-4">
      <div class="card-header">
        <h5>{{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveCliente">
          <div class="mb-3">
            <label class="form-label">Nombre</label>
            <input
              type="text"
              class="form-control"
              v-model="currentCliente.nombre"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">Teléfono</label>
            <input
              type="text"
              class="form-control"
              v-model="currentCliente.telefono"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">NIT</label>
            <input
              type="text"
              class="form-control"
              v-model="currentCliente.nit"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">ANS Devolución</label>
            <input
              type="number"
              class="form-control"
              v-model.number="currentCliente.ansDevolucion"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">ANS Especial</label>
            <input
              type="number"
              class="form-control"
              v-model.number="currentCliente.ansEspecial"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">ANS Normal</label>
            <input
              type="number"
              class="form-control"
              v-model.number="currentCliente.ansNormal"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label">ANS Urgente</label>
            <input
              type="number"
              class="form-control"
              v-model.number="currentCliente.ansUrgente"
              required
            />
          </div>
          <button type="submit" class="btn btn-success">
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </button>
          <button type="button" class="btn btn-secondary ms-2" @click="cancelForm">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, reactive, onMounted } from 'vue';

export default {
  name: 'ClientesCrud',
  setup() {
    const clientes = ref([]);
    const showForm = ref(false);
    const isEditing = ref(false);
    const currentCliente = reactive({
      id: null,
      nombre: '',
      telefono: '',
      nit: '',
      ansDevolucion: 0,
      ansEspecial: 0,
      ansNormal: 0,
      ansUrgente: 0
    });

    // Cargar todos los clientes
    const loadClientes = async () => {
      try {
        const response = await axios.get('/api/clientes');
        clientes.value = response.data;
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    };

    // Abre el formulario para un nuevo cliente
    const openNewClientForm = () => {
      resetForm();
      isEditing.value = false;
      showForm.value = true;
    };

    // Asigna el cliente seleccionado al formulario para editar
    const editCliente = (cliente) => {
      currentCliente.id = cliente.id;
      currentCliente.nombre = cliente.nombre;
      currentCliente.telefono = cliente.telefono;
      currentCliente.nit = cliente.nit;
      currentCliente.ansDevolucion = cliente.ansDevolucion;
      currentCliente.ansEspecial = cliente.ansEspecial;
      currentCliente.ansNormal = cliente.ansNormal;
      currentCliente.ansUrgente = cliente.ansUrgente;
      isEditing.value = true;
      showForm.value = true;
    };

    // Guardar (crear o actualizar) cliente
    const saveCliente = async () => {
      try {
        if (isEditing.value) {
          // Actualizar cliente
          await axios.put(`/api/clientes/${currentCliente.id}`, currentCliente);
        } else {
          // Crear cliente
          await axios.post('/api/clientes', currentCliente);
        }
        await loadClientes();
        cancelForm();
      } catch (error) {
        console.error('Error al guardar cliente:', error);
      }
    };

    // Eliminar cliente
    const deleteCliente = async (id) => {
      if (confirm('¿Estás seguro de eliminar este cliente?')) {
        try {
          await axios.delete(`/api/clientes/${id}`);
          await loadClientes();
        } catch (error) {
          console.error('Error al eliminar cliente:', error);
        }
      }
    };

    // Cancelar y limpiar formulario
    const cancelForm = () => {
      showForm.value = false;
      resetForm();
    };

    // Reiniciar los valores del formulario
    const resetForm = () => {
      currentCliente.id = null;
      currentCliente.nombre = '';
      currentCliente.telefono = '';
      currentCliente.nit = '';
      currentCliente.ansDevolucion = 0;
      currentCliente.ansEspecial = 0;
      currentCliente.ansNormal = 0;
      currentCliente.ansUrgente = 0;
    };

    onMounted(() => {
      loadClientes();
    });

    return {
      clientes,
      showForm,
      isEditing,
      currentCliente,
      openNewClientForm,
      editCliente,
      saveCliente,
      deleteCliente,
      cancelForm
    };
  }
};
</script>

<style scoped>
/* Puedes agregar estilos adicionales o personalizar Bootstrap según tus necesidades */
.table th,
.table td {
  vertical-align: middle;
}
</style>
