<template>
  <div class="container-fluid m-0 p-0">
    <div v-if="loading" class="d-flex justify-content-center align-items-center" style="height: 300px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else>
      <!-- Lista de permisos -->
      <div class="card shadow-sm border-0">
        <div class="card-header">
          <div class="row align-items-center">
            <div class="col-2">
              <select id="roleSelect" v-model="selectedRoleId" class="form-select" @change="loadRolePermissions">
                <option disabled value="">-- Elige un rol --</option>
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.tipo }}
                </option>
              </select>
            </div>
            <div class="col text-md-end">
              <button class="btn buttons-actions" @click="toggleSelectAll"
                :hidden="!selectedRoleId || filteredPermissions.length === 0">
                {{ allSelected ? "Desmarcar Todo" : "Marcar Todo" }}
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div v-if="filteredPermissions.length === 0" class="text-muted text-center py-3">
            No se encontraron permisos que coincidan con la búsqueda.
          </div>
          <div v-else v-if="selectedRoleId">
            <div class="accordion" id="permissionsAccordion">
              <div v-for="(group, gIdx) in hierarchy" :key="gIdx" class="accordion-item border-0 mb-3">
                <h2 class="accordion-header" :id="'heading-' + gIdx">
                  <button class="accordion-button bg-light text-dark rounded" type="button" data-bs-toggle="collapse"
                    :data-bs-target="'#collapse-' + gIdx" aria-expanded="true" :aria-controls="'collapse-' + gIdx">
                    <div class="d-flex align-items-center w-100">
                      <div class="form-check form-switch me-2">
                        <input class="form-check-input" type="checkbox" role="switch" :id="'parent-' + group.parent.id"
                          :value="group.parent.id" v-model="selectedPermissions"
                          @change="onParentToggle(group.parent)" />
                      </div>
                      <span class="fw-bold">{{ group.parent.nombre }}</span>
                    </div>
                  </button>
                </h2>
                <div :id="'collapse-' + gIdx" class="accordion-collapse collapse"
                  :class="{ show: isParentOn(group.parent.id) }" :aria-labelledby="'heading-' + gIdx"
                  data-bs-parent="#permissionsAccordion">
                  <div class="accordion-body p-3">
                    <div class="row">
                      <div class="col-lg-4 col-md-6 col-sm-12 mb-3" v-for="(child, cIdx) in group.children" :key="cIdx">
                        <div class="p-2 rounded shadow-sm bg-white border">
                          <div class="d-flex align-items-center">
                            <div class="form-check form-switch">
                              <input class="form-check-input" type="checkbox" role="switch" :id="'child-' + child.id"
                                :value="child.id" v-model="selectedPermissions"
                                :disabled="!isParentOn(group.parent.id)" />
                            </div>
                            <label class="form-check-label ms-2 permission-label flex-grow-1" :for="'child-' + child.id"
                              :title="child.descripcion">
                              <strong>{{ child.nombre }}</strong>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="hierarchy.every(group => group.children.length === 0)" class="row"></div>
          </div>
          <div v-if="selectedRoleId" class="d-flex justify-content-end mt-4">
            <button class="btn btn-success" @click="saveRolePermissions"
              :disabled="JSON.stringify(selectedPermissions.sort()) === JSON.stringify(originalPermissions.sort())">
              <i class="bi bi-floppy"></i> Guardar Permisos
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import Swal from "sweetalert2";

export default {
  name: "RolePermissionsAssignment",
  data() {
    return {
      roles: [],
      permissions: [],
      selectedRoleId: "",
      selectedPermissions: [],
      originalPermissions: [],
      // IDs de ejemplo para cada grupo
      adminPermissionIds: [46],
      clientPermissionIds: [47],
      searchTerm: "",
      allSelected: false,
      loading: true,
    };
  },
  computed: {
    filteredPermissions() {
      if (!this.searchTerm.trim()) return this.permissions;
      const lower = this.searchTerm.toLowerCase();
      return this.permissions.filter(perm =>
        perm.nombre.toLowerCase().includes(lower) ||
        (perm.descripcion || "").toLowerCase().includes(lower)
      );
    },
    hierarchy() {
      const parents = this.filteredPermissions.filter(p => !p.parentId);
      return parents.map(parent => ({
        parent,
        children: this.filteredPermissions.filter(c => c.parentId === parent.id)
      }));
    },
  },
  watch: {
    selectedPermissions(newVal, oldVal) {
      // Si se reduce la selección (por ejemplo, al desmarcar) o no hay valor anterior, solo actualizamos allSelected.
      if (!oldVal || newVal.length <= oldVal.length) {
        const ids = this.filteredPermissions.map(p => p.id);
        this.allSelected = ids.length > 0 && ids.every(id => newVal.includes(id));
        return;
      }
      
      // Determinar el permiso recién agregado.
      const addedPermission = newVal.find(id => !oldVal.includes(id));
      
      // Si se agrega un permiso y ya hay alguno del grupo opuesto, se deseleccionan TODOS los permisos.
      if (
        this.adminPermissionIds.includes(addedPermission) &&
        oldVal.some(id => this.clientPermissionIds.includes(id))
      ) {
        this.selectedPermissions = [addedPermission];
      } else if (
        this.clientPermissionIds.includes(addedPermission) &&
        oldVal.some(id => this.adminPermissionIds.includes(id))
      ) {
        this.selectedPermissions = [addedPermission];
      }
      
      // Actualizamos el estado de allSelected.
      const ids = this.filteredPermissions.map(p => p.id);
      this.allSelected = ids.length > 0 && ids.every(id => this.selectedPermissions.includes(id));
    }
  },
  methods: {
    async loadRoles() {
      try {
        const res = await apiClient.get("/api/roles");
        this.roles = res.data;
      } catch (err) {
        Swal.fire("Error", "No se pudieron cargar los roles", "error");
      }
    },
    async loadAllPermissions() {
      try {
        const res = await apiClient.get("/api/permissions");
        this.permissions = res.data;
      } catch (err) {
        Swal.fire("Error", "No se pudieron cargar los permisos", "error");
      }
    },
    async loadRolePermissions() {
      if (!this.selectedRoleId) {
        this.selectedPermissions = [];
        return;
      }
      try {
        const res = await apiClient.post("/api/role-permissions", { tipoUsuarioId: this.selectedRoleId });
        this.selectedPermissions = res.data.map(p => p.id);
        this.originalPermissions = [...this.selectedPermissions];
      } catch (err) {
        Swal.fire("Error", "No se pudieron cargar los permisos del rol", "error");
      }
    },
    async saveRolePermissions() {
      if (!this.selectedRoleId) {
        Swal.fire("Error", "Debes seleccionar un rol antes de guardar los permisos.", "error");
        return;
      }
      const payload = {
        tipoUsuarioId: Number(this.selectedRoleId),
        permisos: this.selectedPermissions.map(Number)
      };
      console.log("Payload a enviar:", payload);
      try {
        await apiClient.post(`/api/roles/permissions`, payload);
        this.originalPermissions = [...this.selectedPermissions];
        Swal.fire("Éxito", "Permisos actualizados correctamente", "success");
      } catch (err) {
        Swal.fire("Error", "No se pudieron actualizar los permisos", "error");
      }
    },
    toggleSelectAll() {
      if (!this.filteredPermissions.length) return;
      const allIds = this.filteredPermissions.map(p => p.id);
      const isAllSelected = allIds.every(id => this.selectedPermissions.includes(id));
      this.selectedPermissions = isAllSelected
        ? this.selectedPermissions.filter(id => !allIds.includes(id))
        : Array.from(new Set([...this.selectedPermissions, ...allIds]));
      this.allSelected = !isAllSelected;
    },
    isParentOn(id) {
      return this.selectedPermissions.includes(id);
    },
    onParentToggle(parent) {
      if (!this.isParentOn(parent.id)) {
        const childIds = this.filteredPermissions
          .filter(p => p.parentId === parent.id)
          .map(c => c.id);
        this.selectedPermissions = this.selectedPermissions.filter(id =>
          !childIds.includes(id) && id !== parent.id
        );
      }
    }
  },
  async mounted() {
    await Promise.all([this.loadRoles(), this.loadAllPermissions()]);
    this.loading = false;
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* Títulos y encabezados */
h2 {
  font-weight: 600;
}

/* Personalización de cards */
.card {
  border-radius: 10px;
}
.card-header {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

/* Mejoras en el botón de guardar */
.btn-success {
  font-weight: 600;
  transition: background-color 0.3s ease;
}
.btn-success:hover {
  background-color: #218838;
}

/* Efecto hover en etiquetas de permisos */
.permission-label {
  transition: color 0.2s ease;
}
.permission-label:hover {
  color: #0056b3;
  cursor: pointer;
}

/* Transición suave para la aparición de elementos */
.accordion-button {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Ajustes responsivos para dispositivos pequeños */
@media (max-width: 768px) {
  .card-body.d-flex {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
