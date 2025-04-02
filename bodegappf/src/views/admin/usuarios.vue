<template>
    <div class="usuarios-container">
      <!-- Encabezado de la sección -->
      <div class="usuarios-header">
        <h1>Usuarios</h1>
        <div class="header-actions">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Buscar..."
            class="search-input"
            @input="filterUsers"
          />
          <select v-model="selectedStatus" @change="filterUsers" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <button class="btn btn-primary" @click="openCreateForm">Nuevo Usuario</button>
        </div>
      </div>
  
      <!-- Tabla de usuarios -->
      <div class="table-container">
        <table class="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.clienteId }}</td>
              <td>{{ user.nombre }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.telefono }}</td>
              <td>
                <span v-if="user.activo" class="status-active">Activo</span>
                <span v-else class="status-inactive">Inactivo</span>
              </td>
              <td>
                <button class="btn btn-secondary" @click="editUser(user)">Editar</button>
                <button class="btn btn-danger" @click="deleteUser(user.id)">Eliminar</button>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7">No se encontraron usuarios.</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Formulario para crear/editar usuario -->
      <div v-if="showForm" class="form-overlay">
        <div class="form-dialog">
          <h2>{{ isEditing ? 'Editar Usuario' : 'Crear Usuario' }}</h2>
          <form @submit.prevent="saveUser">
            <div class="form-group">
              <label>Cliente ID:</label>
              <input type="number" v-model="userForm.clienteId" required />
            </div>
            <div class="form-group">
              <label>Tipo de Usuario ID:</label>
              <input type="number" v-model="userForm.tipoUsuarioId" required />
            </div>
            <div class="form-group">
              <label>Nombre:</label>
              <input type="text" v-model="userForm.nombre" required />
            </div>
            <div class="form-group">
              <label>Dirección:</label>
              <input type="text" v-model="userForm.direccion" />
            </div>
            <div class="form-group">
              <label>Teléfono:</label>
              <input type="text" v-model="userForm.telefono" required />
            </div>
            <div class="form-group">
              <label>Cédula (CC):</label>
              <input type="text" v-model="userForm.cc" />
            </div>
            <div class="form-group">
              <label>Email:</label>
              <input type="email" v-model="userForm.email" required />
            </div>
            <div class="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                v-model="userForm.password"
                :required="!isEditing"
                placeholder="(Sólo llenar si se va a cambiar)"
              />
            </div>
            <div class="form-group">
              <label>Activo:</label>
              <select v-model="userForm.activo" required>
                <option :value="true">Sí</option>
                <option :value="false">No</option>
              </select>
            </div>
            <div class="form-group">
              <label>Firma:</label>
              <input type="text" v-model="userForm.firma" />
            </div>
  
            <div class="dialog-actions">
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeForm">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive, computed, onMounted } from 'vue';
  import axios from 'axios';
  
  export default {
    name: 'Usuarios',
    setup() {
      // Estados
      const users = ref([]);
      const searchTerm = ref('');
      const selectedStatus = ref('');
      const showForm = ref(false);
      const isEditing = ref(false);
  
      // Datos del formulario
      const userForm = reactive({
        id: null,
        clienteId: '',
        tipoUsuarioId: '',
        nombre: '',
        direccion: '',
        telefono: '',
        cc: '',
        email: '',
        password: '',
        activo: true,
        firma: '',
      });
  
      // Obtener usuarios al montar el componente
      const fetchUsers = async () => {
        try {
          const response = await axios.get('/usuarios');
          users.value = response.data;
        } catch (error) {
          console.error('Error al obtener usuarios:', error);
        }
      };
  
      onMounted(() => {
        fetchUsers();
      });
  
      // Filtro en memoria
      const filteredUsers = computed(() => {
        // Filtrar por término de búsqueda
        let result = users.value.filter(u => {
          const term = searchTerm.value.toLowerCase();
          return (
            u.nombre?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            u.telefono?.toLowerCase().includes(term)
          );
        });
  
        // Filtrar por estado (activo/inactivo) si se selecciona
        if (selectedStatus.value !== '') {
          const statusBool = selectedStatus.value === 'true';
          result = result.filter(u => u.activo === statusBool);
        }
  
        return result;
      });
  
      // Función para refiltrar cuando cambie la búsqueda o estado
      const filterUsers = () => {
        // Computed ya se encarga, sólo reactiva la actualización
      };
  
      // Abrir formulario en modo crear
      const openCreateForm = () => {
        isEditing.value = false;
        clearForm();
        showForm.value = true;
      };
  
      // Cerrar formulario
      const closeForm = () => {
        showForm.value = false;
        clearForm();
      };
  
      // Editar usuario
      const editUser = (user) => {
        isEditing.value = true;
        userForm.id = user.id;
        userForm.clienteId = user.clienteId;
        userForm.tipoUsuarioId = user.tipoUsuarioId;
        userForm.nombre = user.nombre;
        userForm.direccion = user.direccion;
        userForm.telefono = user.telefono;
        userForm.cc = user.cc;
        userForm.email = user.email;
        userForm.password = ''; // Se deja vacío para no sobrescribir si no se cambia
        userForm.activo = user.activo;
        userForm.firma = user.firma;
        showForm.value = true;
      };
  
      // Guardar (crear/actualizar)
      const saveUser = async () => {
        try {
          if (isEditing.value) {
            // Actualizar usuario
            await axios.put(`/usuarios/${userForm.id}`, {
              clienteId: userForm.clienteId,
              tipoUsuarioId: userForm.tipoUsuarioId,
              nombre: userForm.nombre,
              direccion: userForm.direccion,
              telefono: userForm.telefono,
              cc: userForm.cc,
              email: userForm.email,
              password: userForm.password,
              activo: userForm.activo,
              firma: userForm.firma,
            });
          } else {
            // Crear usuario
            await axios.post('/usuarios', {
              clienteId: userForm.clienteId,
              tipoUsuarioId: userForm.tipoUsuarioId,
              nombre: userForm.nombre,
              direccion: userForm.direccion,
              telefono: userForm.telefono,
              cc: userForm.cc,
              email: userForm.email,
              password: userForm.password,
              activo: userForm.activo,
              firma: userForm.firma,
            });
          }
          await fetchUsers();
          closeForm();
        } catch (error) {
          console.error('Error al guardar usuario:', error);
        }
      };
  
      // Eliminar usuario
      const deleteUser = async (id) => {
        try {
          await axios.delete(`/usuarios/${id}`);
          await fetchUsers();
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
        }
      };
  
      // Limpiar formulario
      const clearForm = () => {
        userForm.id = null;
        userForm.clienteId = '';
        userForm.tipoUsuarioId = '';
        userForm.nombre = '';
        userForm.direccion = '';
        userForm.telefono = '';
        userForm.cc = '';
        userForm.email = '';
        userForm.password = '';
        userForm.activo = true;
        userForm.firma = '';
      };
  
      return {
        users,
        searchTerm,
        selectedStatus,
        showForm,
        isEditing,
        userForm,
        filteredUsers,
        filterUsers,
        openCreateForm,
        closeForm,
        editUser,
        saveUser,
        deleteUser,
      };
    },
  };
  </script>
  
  <style scoped>
  /* Ajusta los estilos a tu layout y colores */
  
  /* Contenedor principal */
  .usuarios-container {
    padding: 20px;
    background-color: #fff; /* Si tu layout usa un fondo diferente, ajústalo */
  }
  
  /* Encabezado */
  .usuarios-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .usuarios-header h1 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .search-input {
    flex: 1;
    padding: 6px;
  }
  .filter-select {
    padding: 6px;
  }
  .btn {
    cursor: pointer;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
  }
  .btn-primary {
    background-color: #007bff;
    color: #fff;
  }
  .btn-secondary {
    background-color: #6c757d;
    color: #fff;
  }
  .btn-danger {
    background-color: #dc3545;
    color: #fff;
  }
  
  /* Tabla */
  .table-container {
    margin-top: 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    background: #f9f9f9;
  }
  .usuarios-table {
    width: 100%;
    border-collapse: collapse;
  }
  .usuarios-table th,
  .usuarios-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  .usuarios-table thead {
    background-color: #f4f4f4;
    font-weight: bold;
  }
  
  /* Estados */
  .status-active {
    color: green;
    font-weight: bold;
  }
  .status-inactive {
    color: red;
    font-weight: bold;
  }
  
  /* Formulario en overlay */
  .form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .form-dialog {
    background-color: #fff;
    padding: 20px;
    width: 400px;
    max-width: 90%;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }
  .form-dialog h2 {
    margin-top: 0;
    margin-bottom: 10px;
  }
  .form-group {
    margin-bottom: 10px;
  }
  .form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 5px;
  }
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
  }
  </style>
  