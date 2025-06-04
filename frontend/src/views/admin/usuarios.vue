<template>
  <div class="container-fluid m-0 p-0">
    <!-- Encabezado: Buscador, Filtro por Cliente y Botón Nuevo -->
    <div class="row m-0 p-0 mt-2">
      <div class="col-md-12 m-0 p-0">
        <div class="card m-0 p-0 shadow-sm">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <div class="input-group search-pill">
                <span class="input-group-text">
                  <i class="bx bx-search"></i>
                </span>
                <input type="text" class="form-control" placeholder="Buscar por nombre o email" v-model="searchQuery"
                  aria-label="Buscar usuario" autofocus />
              </div>

              <div class="input-group filter-select-container ms-2">
                <span class="input-group-text bg-white border-0">
                  <i class="bx bx-filter-alt"></i>
                </span>
                <select class="form-select form-select-filter" v-model="selectedClient">
                  <option value="">Todos los clientes</option>
                  <option v-for="cli in clientes" :key="cli.id" :value="cli.id">
                    {{ cli.nombre }}
                  </option>
                </select>
              </div>





            </div>
            <button class="buttons-actions my-custom-height" @click="openNewUserModal" aria-label="Crear nuevo usuario">
              <i class="bx bx-plus-circle me-1"></i> Nuevo Usuario
            </button>
          </div>
          <div class="card-body m-0 p-0">
            <div class="table-responsive">
              <table class="table table-striped align-middle ">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo Usuario</th>
                    <th>Email</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="7" class="text-center py-5">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-else-if="filteredUsers.length === 0">
                    <td colspan="7" class="text-center text-muted py-5">
                      <i class="bx bx-user-x fs-1 d-block mb-2 text-secondary"></i>
                      No hay usuarios registrados aún.
                    </td>
                  </tr>
                  <tr v-else v-for="user in filteredUsers" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.nombre }}</td>
                    <td>{{ getUserType(user.tipoUsuarioId) }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ getClientName(user.clienteId) }}</td>
                    <td>
                      <span v-if="user.activo" class="badge bg-success blink">ACTIVO</span>
                      <span v-else class="badge bg-danger">INACTIVO</span>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-warning me-1" @click="editUser(user)" title="Editar usuario">
                        <i class="bx bx-edit"></i>
                      </button>
                      <!-- <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)" title="Eliminar usuario">
                        <i class="bx bx-trash"></i>
                      </button> -->
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

    <!-- Modal para Crear/Editar Usuario (Modal extra grande) -->
    <div ref="userModal" class="modal fade" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content modal-custom">
          <form @submit.prevent="saveUser">
            <div class="modal-header modal-header-custom">
              <h5 class="modal-title" id="userModalLabel">
                {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
              </h5>
              <button type="button" class="btn-close" @click="closeUserModal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <!-- Sección: Datos Básicos -->
              <h6 class="mb-2 fw-bold">Datos Básicos</h6>
              <div class="row row-cols-1 row-cols-md-4 g-4 mb-3">
                <div class="col-3">
                  <label class="form-label">Nombre</label>
                  <input type="text" class="form-control" v-model="currentUser.nombre" required
                    placeholder="Nombre completo" />
                </div>
                <div class="col-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="currentUser.email" required
                    placeholder="ejemplo@dominio.com" />
                </div>
                <div class="col-2">
                  <label class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" v-model="currentUser.telefono"
                    placeholder="Número de contacto" />
                </div>
                <div class="col-2">
                  <label class="form-label">Núm. Documento</label>
                  <input type="text" class="form-control" v-model="currentUser.cc" placeholder="Ej: 123456789" />
                </div>
              </div>

              <!-- Sección: Firma -->
              <h6 class="mb-2 fw-bold">Firma</h6>
              <div class="row row-cols-1 row-cols-md-2 g-3 mb-3">
                <div class="col">
                  <label class="form-label">Cargar Firma (PNG)</label>
                  <input type="file" accept=".png" class="form-control" @change="onFirmaChange" />
                  <small class="form-text text-muted">
                    Seleccione un archivo .png. Se previsualizará la firma.
                  </small>
                </div>
                <div class="col d-flex align-items-center">
                  <div v-if="firmaPreview" class="mt-1">
                    <p class="mb-1 fw-light">Firma Actual / Previsualización:</p>
                    <img :src="firmaPreview" alt="Firma" class="img-thumbnail" width="130" />
                  </div>
                  <div v-else class="text-muted small">
                    <p class="mb-0">No hay firma cargada.</p>
                  </div>
                </div>
              </div>
              <!-- Sección: Contraseña -->
              <h6 class="mb-2 fw-bold">Contraseña</h6>
              <div class="row row-cols-1 row-cols-md-2 g-3">
                <div class="col">
                  <label class="form-label">Contraseña</label>
                  <div class="input-group">
                    <input :type="showPassword ? 'text' : 'password'" class="form-control"
                      v-model="currentUser.password" :required="!isEditing" placeholder="Ingrese la contraseña"
                      @input="validatePassword" />
                    <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                      <i :class="showPassword ? 'bx bx-show' : 'bx bx-hide'"></i>
                    </button>
                  </div>
                  <!-- Lista dinámica de validación de requisitos -->
                  <ul class="list-unstyled mt-2" v-if="currentUser.password">
                    <li v-for="check in passwordChecks" :key="check.text">
                      <i :class="check.valid
                        ? 'bx bx-check text-success'
                        : 'bx bx-x text-danger'"></i>
                      <small class="ms-1">{{ check.text }}</small>
                    </li>
                  </ul>
                  <div v-if="passwordError" class="text-danger small">
                    {{ passwordError }}
                  </div>
                </div>
                <div class="col">
                  <label class="form-label">Confirmar Contraseña</label>
                  <div class="input-group">
                    <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control"
                      v-model="confirmPassword" :required="!isEditing" placeholder="Repita la contraseña"
                      @input="validateConfirmPassword" />
                    <button type="button" class="btn btn-outline-secondary"
                      @click="showConfirmPassword = !showConfirmPassword">
                      <i :class="showConfirmPassword
                        ? 'bx bx-show'
                        : 'bx bx-hide'"></i>
                    </button>
                  </div>
                  <div v-if="confirmPasswordError" class="text-danger small mt-1">
                    {{ confirmPasswordError }}
                  </div>
                </div>
              </div>

              <!-- Sección: Datos del Cliente -->
              <h6 class="mb-2 fw-bold">Datos del Cliente</h6>
              <div class="row row-cols-1 row-cols-md-3 g-3 mb-3">
                <div class="col">
                  <label class="form-label">Cliente</label>
                  <select class="form-select" v-model="currentUser.clienteId" required>
                    <option disabled value="">-- Seleccionar --</option>
                    <option v-for="cli in clientes" :key="cli.id" :value="cli.id">
                      {{ cli.nombre }} (ID: {{ cli.id }})
                    </option>
                  </select>
                </div>
                <div class="col">
                  <label class="form-label">Tipo Usuario</label>
                  <select class="form-select" v-model="currentUser.tipoUsuarioId" required>
                    <option disabled value="">-- Seleccionar --</option>
                    <option v-for="tipo in tiposUsuario" :key="tipo.id" :value="tipo.id">
                      {{ tipo.tipo }}
                    </option>
                  </select>
                </div>
                <div class="col">
                  <label class="form-label">Activo</label>
                  <div class="form-check form-switch mt-1">
                    <input type="checkbox" class="form-check-input" id="activoSwitch" v-model="currentUser.activo" />
                    <label class="form-check-label" for="activoSwitch">
                      {{ currentUser.activo ? 'Sí' : 'No' }}
                    </label>
                  </div>
                </div>
              </div>
              <!-- Fin Sección Contraseña -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeUserModal">
                <i class="bx bx-x me-0"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-success" :disabled="isLoading || !isFormValid">
                <i :class="isEditing ? 'bx bx-edit-alt me-1' : 'bx bx-save me-1'"></i>
                <span v-if="!isLoading">{{ isEditing ? 'Actualizar' : 'Crear' }}</span>
                <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- Fin Modal -->
  </div>
</template>

<script>
import apiClient from '@/services/api';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';

export default {
  name: 'UsuariosCrud',
  data() {
    return {
      users: [],
      clientes: [],
      tiposUsuario: [],
      searchQuery: '',
      selectedClient: '',
      loading: true,
      isLoading: false,
      isEditing: false,
      currentUser: this.getEmptyUser(),
      modalInstance: null,
      confirmPassword: '',
      passwordError: '',
      confirmPasswordError: '',
      showPassword: false,
      showConfirmPassword: false
    };
  },
  computed: {
    getUserType() {
      return (id) => {
        const tipo = this.tiposUsuario.find(item => item.id === id);
        return tipo ? tipo.tipo : 'Desconocido';
      };
    },
    filteredUsers() {
      let filtered = this.users;
      // Filtro por cliente
      if (this.selectedClient) {
        filtered = filtered.filter(user => user.clienteId == this.selectedClient);
      }
      // Filtro por búsqueda
      const query = this.searchQuery.toLowerCase();
      if (query) {
        filtered = filtered.filter(
          u =>
            (u.nombre && u.nombre.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query))
        );
      }
      return filtered;
    },
    // Validación dinámica de requisitos de contraseña
    passwordChecks() {
      const pwd = this.currentUser.password || '';
      return [
        { text: 'Al menos 8 caracteres', valid: pwd.length >= 8 },
        { text: 'Contiene letra minúscula', valid: /[a-z]/.test(pwd) },
        { text: 'Contiene letra mayúscula', valid: /[A-Z]/.test(pwd) },
        { text: 'Contiene número', valid: /\d/.test(pwd) },
        { text: 'Contiene símbolo', valid: /[\W_]/.test(pwd) }
      ];
    },
    isFormValid() {
      return !this.passwordError && !this.confirmPasswordError;
    },
    firmaPreview() {
      return this.currentUser.firma
        ? 'data:image/png;base64,' + this.currentUser.firma
        : null;
    }
  },
  methods: {
    getEmptyUser() {
      return {
        id: null,
        nombre: '',
        clienteId: '',
        tipoUsuarioId: '',
        tipoUsuario: [],
        email: '',
        telefono: '',
        firma: '',
        password: '',
        activo: true,
        cc: ''
      };
    },    async loadUsers() {
      this.loading = true;
      try {
        const res = await apiClient.get('/api/users');
        this.users = res.data;
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        this.users = [];
        // Los errores se manejan automáticamente por el interceptor
      } finally {
        this.loading = false;
      }
    },async loadClientes() {
      try {
        const res = await apiClient.get('/api/clientes');
        this.clientes = res.data;
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        this.clientes = [];
        // Los errores se manejan automáticamente por el interceptor
      }
    },async loadTiposUsuario() {
      try {
        const res = await apiClient.get("/api/roles");
        this.tiposUsuario = res.data;
        console.log("Tipos de usuario:", this.tiposUsuario);
      } catch (err) {
        console.error('Error al cargar tipos de usuario:', err);
        // Los errores se manejan automáticamente por el interceptor
      }
    },
    getClientName(clientId) {
      const cli = this.clientes.find(c => c.id === clientId);
      return cli ? cli.nombre : '';
    },
    openNewUserModal() {
      this.resetForm();
      this.isEditing = false;
      this.showModal();
    },
    editUser(user) {
      this.resetForm();
      this.isEditing = true;
      // Clonamos e inicializamos la contraseña en blanco
      this.currentUser = { ...user, password: '' };
      this.showModal();
    },    async saveUser() {
      this.validatePassword();
      this.validateConfirmPassword();
      if (this.passwordError || this.confirmPasswordError) {
        return;
      }
      
      console.log('💾 Intentando guardar usuario...');
      console.log('📤 Datos a enviar:', this.currentUser);
      console.log('🔗 URL base del API:', apiClient.defaults.baseURL);
      
      this.isLoading = true;
      try {
        let response;
        if (this.isEditing && this.currentUser.id) {
          console.log('✏️ Editando usuario ID:', this.currentUser.id);
          response = await apiClient.put(`/api/users/${this.currentUser.id}`, this.currentUser);
        } else {
          console.log('➕ Creando nuevo usuario');
          response = await apiClient.post('/api/users', this.currentUser);
          this.currentUser.id = response.data.id;
        }
        
        console.log('✅ Respuesta del servidor:', response.data);
        
        // Mostrar alerta de éxito si viene del backend
        if (response.data && response.data.showAlert) {
          console.log('🎉 Mostrando alerta de éxito:', response.data.showAlert);
          Swal.fire(response.data.showAlert);
        }
        
        await this.loadUsers();
        this.closeUserModal();
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        console.log('🔍 Datos del error:', error.response?.data);
        
        // Mostrar alerta de error si viene del backend
        if (error.response && error.response.data && error.response.data.showAlert) {
          console.log('✅ Mostrando showAlert del backend:', error.response.data.showAlert);
          Swal.fire(error.response.data.showAlert);
        } else if (error.response && error.response.data && error.response.data.error) {
          console.log('⚠️ Usando mensaje de error básico:', error.response.data.error);          // Fallback si no hay showAlert pero sí hay mensaje de error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response.data.error,
            toast: false,
            position: 'center',
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#e74c3c'
          });
        } else {
          console.log('❌ Error genérico sin datos específicos');
          // Error genérico
          Swal.fire({
            icon: 'error',
            title: 'Error del Sistema',
            text: 'No se pudo guardar el usuario. Intente nuevamente.',
            toast: false,
            position: 'center',
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#e74c3c'
          });
        }
      } finally {
        this.isLoading = false;
      }
    },    async deleteUser(id) {
      const userToDelete = this.users.find(u => u.id === id);
      const userName = userToDelete ? userToDelete.nombre : 'el usuario';
      
      const confirm = await Swal.fire({
        title: '¿Eliminar usuario?',
        html: `
          <p>Se eliminará el usuario <strong>"${userName}"</strong> permanentemente.</p>
          <p class="text-warning"><small>Esta acción no se puede deshacer.</small></p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
        if (confirm.isConfirmed) {        try {
          const response = await apiClient.delete(`/api/users/${id}`);
          
          // Mostrar alerta de éxito si viene del backend
          if (response.data && response.data.showAlert) {
            Swal.fire(response.data.showAlert);
          } else {
            // Alerta de éxito por defecto
            Swal.fire({
              icon: 'success',
              title: 'Usuario Eliminado',
              text: `El usuario "${userName}" ha sido eliminado exitosamente.`,
              toast: true,
              position: 'top-end',
              timer: 4000,
              showConfirmButton: false
            });
          }
          
          await this.loadUsers();
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          
          // Mostrar alerta de error si viene del backend
          if (error.response && error.response.data && error.response.data.showAlert) {
            Swal.fire(error.response.data.showAlert);
          } else if (error.response && error.response.data && error.response.data.error) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.response.data.error,
              toast: false,
              position: 'center',
              showConfirmButton: true,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#e74c3c'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error del Sistema',
              text: 'No se pudo eliminar el usuario. Intente nuevamente.',
              toast: false,
              position: 'center',
              showConfirmButton: true,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#e74c3c'
            });
          }
        }
      }
    },    onFirmaChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.png')) {
        Swal.fire({
          icon: 'warning',
          title: 'Formato Incorrecto',
          text: 'Por favor selecciona un archivo con formato .png',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const base64String = e.target.result;
        // Remove data:image/png;base64,
        this.currentUser.firma = base64String.replace(/^data:image\/png;base64,/, '');
      };
      reader.readAsDataURL(file);
    },
    validatePassword() {
      const pwd = this.currentUser.password || '';
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (pwd && !regex.test(pwd)) {
        this.passwordError = 'La contraseña no cumple todos los requisitos.';
      } else {
        this.passwordError = '';
      }
    },
    validateConfirmPassword() {
      if (
        this.currentUser.password &&
        this.confirmPassword &&
        this.currentUser.password !== this.confirmPassword
      ) {
        this.confirmPasswordError = 'Las contraseñas no coinciden.';
      } else {
        this.confirmPasswordError = '';
      }
    },
    resetForm() {
      this.currentUser = this.getEmptyUser();
      this.confirmPassword = '';
      this.passwordError = '';
      this.confirmPasswordError = '';
      this.showPassword = false;
      this.showConfirmPassword = false;
    },
    showModal() {
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.userModal, {
          backdrop: 'static',
          keyboard: false
        });
      }
      this.modalInstance.show();
    },
    closeUserModal() {
      this.modalInstance?.hide();
    }
  },  async mounted() {
    await Promise.all([this.loadUsers(), this.loadClientes(), this.loadTiposUsuario()]);
  }
};
</script>

<style scoped>
.table thead th {
  background-color: #f8f9fa;
}

.search-pill {
  border-radius: 2rem;
  overflow: hidden;
  background-color: #fff;
  height: 36px;
  max-width: 300px;
  border: 1px solid #ced4da;
}

.search-pill .input-group-text {
  background-color: transparent;
  border: none;
  padding-left: 14px;
  padding-right: 8px;
  color: #6c757d;
}

.search-pill .form-control {
  border: none;
  border-radius: 0;
  height: 36px;
  box-shadow: none;
  padding-left: 0;
}

.buttons-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 41px;
  width: 150px;
  padding: 0 1rem;
  gap: 0.25rem;
  font-weight: 500;
  font-size: 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease-in-out;
}

/* Modal */
.modal-custom {
  border-radius: 10px;
  animation: fadeIn 0.3s ease-in-out;
}

.modal-header-custom {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
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

/* Ajusta altura y fuente de inputs y selects para una apariencia más compacta */
.form-select,
.form-control {
  height: 36px;
  padding: 6px 12px;
  font-size: 0.9rem;
}



/* Contenedor del select con estilo redondeado */
.filter-select-container {
  border-radius: 2rem;
  /* esquinas redondeadas */
  overflow: hidden;
  /* oculta bordes internos */
  border: 1px solid #ced4da;
  /* borde exterior */
  background-color: #fff;
  /* fondo */
  transition: all 0.2s ease-in-out;
  width: 300px;
  /* Ajusta el ancho a tu gusto */
}

/* El ícono y su fondo */
.input-group-text {
  background-color: transparent !important;
  /* para que no choque con .bg-white si aplicaste otra clase */
  border: none;
  border-right: 1px solid #ced4da;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;

}

/* El select con fondo transparente */
.form-select-filter {
  border: none;
  outline: none;
  box-shadow: none !important;
  background-color: transparent;
  border-radius: 0;
  /* quita esquinas del select interno */

}

/* Quita outline al enfocar */
.form-select-filter:focus {
  box-shadow: none !important;
  outline: none !important;
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
</style>
