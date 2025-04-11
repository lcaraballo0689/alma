<template>
  <div class="container-fluid m-0 p-0">
    <div class="card shadow-sm border-0">
      <div class="card-header">
        <div class="row align-items-center">
          <!-- Input de búsqueda en la parte izquierda del header -->
          <div class="col-6">
            <input type="text" class="form-control" placeholder="Buscar..." v-model="searchQuery" />
          </div>
          <!-- Botón para agregar nuevo rol en la parte derecha -->
          <div class="col text-md-end">
            <button class="buttons-actions" @click="openModalForNewRole">
              Nuevo Rol
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRoles.length === 0">
              <td colspan="3" class="text-center text-muted">
                No hay roles registrados.
              </td>
            </tr>
            <tr v-for="role in filteredRoles" :key="role.id">
              <td>{{ role.id }}</td>
              <td>{{ role.tipo }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-1" @click="openModalForEditRole(role)">
                  <i class="bx bx-edit"></i>
                </button>
                <button v-if="role.id != 1 && role.id != 2 && role.id != 4" class="btn btn-sm btn-danger"
                  @click="confirmDeleteRole(role.id)">
                  <i class="bx bx-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para crear/editar rol -->
    <div ref="roleModal" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="saveRole">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar Rol' : 'Nuevo Rol' }}</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nombre del Rol</label>
                <input type="text" class="form-control" v-model="currentRole.tipo" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-success">
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import apiClient from "@/services/api";
import { Modal } from "bootstrap";
import Swal from "sweetalert2";

export default {
  name: "RolesManagement",
  data() {
    return {
      roles: [],
      searchQuery: "", // Propiedad para el término de búsqueda
      currentRole: {
        id: null,
        tipo: ""
      },
      isEditing: false,
      modalInstance: null
    };
  },
  computed: {

    filteredRoles() {
      const excludedIds = [1, 4, 2];
      return this.roles.filter(role => {
        // Excluir roles con id 1, 4 o 2
        if (excludedIds.includes(role.id)) return false;
        // Filtra los roles comprobando si el término de búsqueda coincide con alguna propiedad
        return Object.values(role).some(value =>
          String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    }

  },
  methods: {
    async loadRoles() {
      try {
        const response = await apiClient.get("/api/roles");
        this.roles = response.data;
      } catch (error) {
        console.error("Error al cargar roles:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los roles."
        });
      }
    },
    openModalForNewRole() {
      this.resetForm();
      this.isEditing = false;
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.roleModal, { backdrop: "static" });
      }
      this.modalInstance.show();
    },
    openModalForEditRole(role) {
      this.currentRole = { ...role };
      this.isEditing = true;
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.roleModal, { backdrop: "static" });
      }
      this.modalInstance.show();
    },
    async saveRole() {
      try {
        if (this.isEditing) {
          await apiClient.put(`/api/roles/${this.currentRole.id}`, this.currentRole);
          Swal.fire({
            icon: "success",
            title: "Rol actualizado",
            text: "El rol ha sido actualizado exitosamente."
          });
        } else {
          const response = await apiClient.post("/api/roles", this.currentRole);
          // Se asume que el endpoint devuelve el id insertado
          this.roles.push({ ...this.currentRole, id: response.data.id });
          Swal.fire({
            icon: "success",
            title: "Rol creado",
            text: "El rol ha sido creado exitosamente."
          });
        }
        await this.loadRoles();
        this.closeModal();
      } catch (error) {
        console.error("Error al guardar rol:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un error al guardar el rol."
        });
      }
    },
    async confirmDeleteRole(id) {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar"
      });
      if (result.isConfirmed) {
        await this.deleteRole(id);
      }
    },
    async deleteRole(id) {
      try {
        await apiClient.delete(`/api/roles/${id}`);
        Swal.fire({
          icon: "success",
          title: "Rol eliminado",
          text: "El rol ha sido eliminado exitosamente."
        });
        await this.loadRoles();
      } catch (error) {
        console.error("Error al eliminar rol:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un error al eliminar el rol."
        });
      }
    },
    closeModal() {
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    },
    resetForm() {
      this.currentRole = { id: null, tipo: "" };
    }
  },
  mounted() {
    this.loadRoles();
  }
};
</script>

<style scoped>
/* Puedes agregar estilos adicionales para mejorar la presentación */
</style>
