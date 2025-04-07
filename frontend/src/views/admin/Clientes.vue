<template>
  <div class="container-fluid my-4">
    <!-- Barra superior con búsqueda, estados y tabs de tipo de solicitud -->
    <div class="row mb-3 align-items-center">
      <!-- Sección de búsqueda y combo de estados -->
      <div class="col-auto">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            placeholder="Buscar..."
            v-model="searchQuery"
          />
          <select class="form-select" v-model="selectedState">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <!-- Agrega más estados según tu lógica -->
          </select>
        </div>
      </div>

      <!-- Tabs de tipo de solicitud (Transferencia, Préstamo, etc.) -->
      <div class="col text-center">
        <div class="btn-group" role="group">
          <button
            v-for="tab in solicitudTabs"
            :key="tab"
            type="button"
            class="btn btn-outline-primary"
            :class="{ active: activeSolicitudTab === tab }"
            @click="activeSolicitudTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- Tabs Pendientes / Completadas -->
      <div class="col-auto">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeFilter === 'pendientes' }"
              href="#"
              @click.prevent="activeFilter = 'pendientes'"
            >
              Pendientes
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeFilter === 'completadas' }"
              href="#"
              @click.prevent="activeFilter = 'completadas'"
            >
              Completadas
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Botón para agregar nuevo cliente -->
    <div class="mb-3">
      <button class="btn btn-primary" @click="openNewClientForm">
        Nuevo Cliente
      </button>
    </div>

    <!-- Tabla de clientes -->
    <div class="table-responsive">
      <table class="table table-striped align-middle">
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
          <!-- Si no hay clientes registrados, mostramos un mensaje -->
          <tr v-if="filteredClientes.length === 0">
            <td colspan="9" class="text-center text-muted">
              No hay clientes registrados.
            </td>
          </tr>
          <!-- De lo contrario, renderizamos cada cliente -->
          <tr v-for="cliente in filteredClientes" :key="cliente.id">
            <td>{{ cliente.id }}</td>
            <td>{{ cliente.nombre }}</td>
            <td>{{ cliente.telefono }}</td>
            <td>{{ cliente.nit }}</td>
            <td>{{ cliente.ansDevolucion }}</td>
            <td>{{ cliente.ansEspecial }}</td>
            <td>{{ cliente.ansNormal }}</td>
            <td>{{ cliente.ansUrgente }}</td>
            <td>
              <button
                class="btn btn-sm btn-warning me-1"
                @click="editCliente(cliente)"
              >
                Editar
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteCliente(cliente.id)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
          <button
            type="button"
            class="btn btn-secondary ms-2"
            @click="cancelForm"
          >
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
    const searchQuery = ref('');
    const selectedState = ref('');
    const activeSolicitudTab = ref('Transferencia'); // Por defecto
    const solicitudTabs = ['Transferencia', 'Prestamo', 'Devolucion', 'Desarchive'];
    const activeFilter = ref('pendientes'); // 'pendientes' o 'completadas'

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

    // Cargar todos los clientes (ejemplo: datos ficticios o request a API)
    const loadClientes = async () => {
      try {
        // const response = await axios.get('/api/clientes');
        // clientes.value = response.data;

        // Ejemplo con datos ficticios para test:
        clientes.value = [
          {
            id: 1,
            nombre: 'Cliente A',
            telefono: '3001234567',
            nit: '123456789',
            ansDevolucion: 12,
            ansEspecial: 4,
            ansNormal: 12,
            ansUrgente: 8
          },
          {
            id: 2,
            nombre: 'Cliente B',
            telefono: '3109876543',
            nit: '987654321',
            ansDevolucion: 10,
            ansEspecial: 2,
            ansNormal: 14,
            ansUrgente: 6
          }
        ];
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    };

    // Filtro local: search y state
    const filteredClientes = ref([]);
    const applyFilters = () => {
      let temp = [...clientes.value];

      // Filtro por searchQuery en nombre / nit
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        temp = temp.filter(
          (c) =>
            c.nombre.toLowerCase().includes(q) ||
            c.nit.toLowerCase().includes(q)
        );
      }

      // Filtro por estado (selectedState), si aplica
      // Ejemplo: si tuvieras un campo c.estado en el cliente
      if (selectedState.value) {
        // Suponiendo c.estado es 'activo' o 'inactivo', etc.
        // temp = temp.filter(c => c.estado === selectedState.value);
      }

      filteredClientes.value = temp;
    };

    // Watchers para aplicar filtros
    // (Con Composition API, en lugar de watchers, puedes usar un computed, pero aquí se ejemplifica)
    const watch = (source, fn) => {
      // Implementación mínima de un watch manual:
      source.valueOf; // no-op
      fn();
    };

    // Llamamos a applyFilters cada vez que cambie searchQuery, selectedState o la lista de clientes
    // (en un proyecto real, usarías watch de Vue, aquí es un pseudo-ejemplo)
    // watchEffect(() => applyFilters()); -> con Composition API real
    // Para simplificar, llamamos manualmente tras cargar y tras cada cambio
    // (esto es meramente ilustrativo)
    // ...
    // (Lo más recomendable es usar un computed: 
    //    computed(() => { ... return temp; }) 
    //  y en template usar esa variable computada)

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
          // Actualizar cliente en API
          // await axios.put(`/api/clientes/${currentCliente.id}`, currentCliente);
          // Actualizamos local:
          const idx = clientes.value.findIndex(c => c.id === currentCliente.id);
          if (idx !== -1) {
            clientes.value[idx] = { ...currentCliente };
          }
        } else {
          // Crear cliente en API
          // const { data } = await axios.post('/api/clientes', currentCliente);
          // clientes.value.push(data);

          // Ficticio:
          const newId = Math.max(...clientes.value.map(c => c.id)) + 1;
          clientes.value.push({ ...currentCliente, id: newId });
        }
        applyFilters();
        cancelForm();
      } catch (error) {
        console.error('Error al guardar cliente:', error);
      }
    };

    // Eliminar cliente
    const deleteCliente = async (id) => {
      if (confirm('¿Estás seguro de eliminar este cliente?')) {
        try {
          // await axios.delete(`/api/clientes/${id}`);
          // Eliminación ficticia local:
          clientes.value = clientes.value.filter(c => c.id !== id);
          applyFilters();
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
      loadClientes().then(() => {
        applyFilters();
      });
    });

    return {
      // Data
      clientes,
      filteredClientes,
      showForm,
      isEditing,
      currentCliente,
      searchQuery,
      selectedState,
      activeSolicitudTab,
      solicitudTabs,
      activeFilter,

      // Methods
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
/* Ajustes de tabla y layout para que coincida con el estilo mostrado en la captura */
.table th,
.table td {
  vertical-align: middle;
}

/* Nav-tabs y btn-group para la parte superior */
.nav-tabs .nav-link.active {
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

.btn-group .btn.active {
  background-color: #0d6efd;
  color: #fff;
  border-color: #0d6efd;
}

.input-group .form-control,
.input-group .form-select {
  border-radius: 0;
}

/* Ajustes de responsive */
.table-responsive {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

/* Card del formulario */
.card {
  border-radius: 4px;
}
</style>
