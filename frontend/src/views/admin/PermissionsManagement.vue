<template>
  <div class="container-fluid m-0 p-0">
    <div class="card shadow-sm border-0">
      <div class="card-header">
        <div class="row align-items-center">
          <!-- Input de búsqueda en la parte izquierda del header -->
          <div class="col-2">
            <input
              type="text"
              class="form-control"
              placeholder="Buscar..."
              v-model="searchQuery"
            />
          </div>
          <!-- Botón para agregar nuevo permiso en la parte derecha -->
          <div class="col text-md-end">
            <button class="buttons-actions" @click="openModalForNewPermission">
              Nuevo Permiso
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Permiso</th>
                <th>Descripción</th>
                <th>Permiso Padre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPermissions.length === 0">
                <td colspan="5" class="text-center text-muted">
                  No hay permisos registrados.
                </td>
              </tr>
              <tr v-for="perm in filteredPermissions" :key="perm.id">
                <td>{{ perm.id }}</td>
                <td>{{ perm.nombre }}</td>
                <td>{{ perm.descripcion }}</td>
                <td>{{ perm.parentId ? perm.parentId : "Ninguno" }}</td>
                <td>
                  <button
                    class="btn btn-sm btn-warning me-1"
                    @click="openModalForEditPermission(perm)"
                  >
                  <i class="bx bx-edit"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="confirmDeletePermission(perm.id)"
                  >
                  <i class="bx bx-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar permiso -->
    <div ref="permissionModal" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="savePermission">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar Permiso' : 'Nuevo Permiso' }}</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nombre del Permiso</label>
                <input type="text" class="form-control" v-model="currentPermission.nombre" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <input type="text" class="form-control" v-model="currentPermission.descripcion" />
              </div>
              <div class="mb-3">
                <label class="form-label">ID del Permiso Padre</label>
                <input type="number" class="form-control" v-model.number="currentPermission.parentId" placeholder="Dejar en blanco si no tiene padre" />
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
  name: "PermissionsManagement",
  data() {
    return {
      permissions: [],
      searchQuery: "", // Propiedad para almacenar el término de búsqueda
      currentPermission: {
        id: null,
        nombre: "",
        descripcion: "",
        parentId: null
      },
      isEditing: false,
      modalInstance: null
    };
  },
  computed: {
    filteredPermissions() {
      // Filtra los permisos basándose en la búsqueda en todas las columnas
      return this.permissions.filter((perm) => {
        // Convierte cada propiedad a string para facilitar la búsqueda
        return Object.values(perm).some(value =>
          String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    }
  },
  methods: {
    async loadPermissions() {
      try {
        const response = await apiClient.get("/api/permissions");
        this.permissions = response.data;
      } catch (error) {
        console.error("Error al cargar permisos:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los permisos."
        });
      }
    },
    openModalForNewPermission() {
      this.resetForm();
      this.isEditing = false;
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.permissionModal, { backdrop: "static" });
      }
      this.modalInstance.show();
    },
    openModalForEditPermission(permission) {
      this.currentPermission = { ...permission };
      this.isEditing = true;
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.permissionModal, { backdrop: "static" });
      }
      this.modalInstance.show();
    },
    async savePermission() {
      try {
        if (this.isEditing) {
          await apiClient.put(`/api/permissions/${this.currentPermission.id}`, this.currentPermission);
          Swal.fire({
            icon: "success",
            title: "Permiso actualizado",
            text: "El permiso ha sido actualizado exitosamente."
          });
        } else {
          const response = await apiClient.post("/api/permissions", this.currentPermission);
          this.permissions.push({ ...this.currentPermission, id: response.data.id });
          Swal.fire({
            icon: "success",
            title: "Permiso creado",
            text: "El permiso ha sido creado exitosamente."
          });
        }
        await this.loadPermissions();
        this.closeModal();
      } catch (error) {
        console.error("Error al guardar permiso:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un error al guardar el permiso."
        });
      }
    },
    async confirmDeletePermission(id) {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará el permiso.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar"
      });
      if (result.isConfirmed) {
        await this.deletePermission(id);
      }
    },
    async deletePermission(id) {
      try {
        await apiClient.delete(`/api/permissions/${id}`);
        Swal.fire({
          icon: "success",
          title: "Permiso eliminado",
          text: "El permiso ha sido eliminado exitosamente."
        });
        await this.loadPermissions();
      } catch (error) {
        console.error("Error al eliminar permiso:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un error al eliminar el permiso."
        });
      }
    },
    closeModal() {
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    },
    resetForm() {
      this.currentPermission = {
        id: null,
        nombre: "",
        descripcion: "",
        parentId: null
      };
    }
  },
  mounted() {
    this.loadPermissions();
  }
};
</script>

<style scoped>
/* Puedes agregar estilos adicionales para mejorar la interfaz */
</style>
