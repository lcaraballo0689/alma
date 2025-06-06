<template>
  <div class="inventario-container m-0 mx-3 p-0">
    <!-- Encabezado: pestañas, botón "Carga Masiva", DataDownload y búsqueda -->
    <div class="card shadow">
      <div class="card-header px-0 py-0 m-0">
        <div class="row align-items-center m-0 p-0 d-flex justify-content-between">
          <!-- Columna Izquierda: Pestañas -->
          <div class="col-auto d-flex flex-wrap gap-2">
            <div class="tab-container">
              <!-- Pestaña Inventario: muestra el total de registros -->
              <button
                class="tab-button"
                :class="{ active: currentTab === 'inventario' }"
                @click="changeTab('inventario')"
              >
                <i class="bi bi-box"></i> Inventario
                <span class="tab-badge">
                  <span>{{ totalCount }}</span>
                </span>
              </button>
              <!-- Pestaña Disponible para Prestar -->
              <button
                class="tab-button"
                :class="{ active: currentTab === 'Disponible para prestar' }"
                @click="changeTab('Disponible para prestar')"
              >
                <i class="bi bi-check-circle"></i> Disponible para Prestar
                <span class="tab-badge">
                  <span>{{ totalCount }}</span>
                </span>
              </button>
              <!-- Pestaña Disponible para Devolver -->
              <button
                class="tab-button"
                :class="{ active: currentTab === 'Disponible para devolver' }"
                @click="changeTab('Disponible para devolver')"
              >
                <i class="bi bi-building-check"></i> Disponible para Devolver
                <span class="tab-badge">
                  <span>{{ totalCount }}</span>
                </span>
              </button>
            </div>
          </div>
          <!-- Columna Derecha: Acciones -->
          <div class="col-auto d-flex align-items-center gap-3">
            <button
              v-if="selectedItems.length > 0"
              class="tab-button text-capitalize"
              style="background-color: #f99022 !important; color: white !important; font-size: 12px !important;"
              @click="openModal(actionText)"
            >
              <i class="bi bi-building-check"></i> {{ actionText }}
              <span class="tab-badge2">
                <span>{{ selectedItems.length }}</span>
              </span>
            </button>
            <!-- Botón Carga Masiva -->
            <button
              v-if="currentTab !== 'inventario' && selectedItems.length === 0"
              class="btn btn-sm buttons-actions d-flex align-items-center"
              style="width: 160px !important; color: white !important; background-color: black !important; font-weight: 700 !important;"
              @click="() => { setMassUploadTab(); setMassAction(); }"
            >
              <i class="bi bi-file-earmark-arrow-up me-2"></i>
              {{
                currentTab === "Disponible para devolver"
                  ? "Devolución Masiva"
                  : currentTab === "Disponible para prestar"
                  ? "Préstamo Masivo"
                  : "Inventario"
              }}
            </button>
            <!-- Botón de Exportar -->
            <div>
              <DataDownload
                :dataToDownload="filteredInventarios"
                :currentTab="currentTab"
                :headers="['objeto','bodega','referencia1','referencia2','referencia3','estado']"
                class="mt-3"
              />
            </div>
            <!-- Campo de Búsqueda Mejorado -->
            <div class="custom-search">
              <i class="bi bi-search search-icon"></i>
              <input
                type="text"
                class="form-control form-control-sm"
                placeholder="Buscar"
                v-model="searchTerm"
                @input="handleSearch"
                @keyup.delete="handleSearch"
                @keyup.backspace="handleSearch"
              />
            </div>
            <button class="btn btn-small" @click="toggleMenu">
              <i class="bi bi-question-circle fs-4"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="card-body m-0 p-0 bg-white">
        <div class="table-container bg-white">
          <table class="table table-sm border-none table-hover">
            <colgroup>
              <col style="width: 20px" v-if="selectedItems.length > 0" />
              <col style="width: 100px" />
              <col style="width: 200px" />
              <col style="width: 200px" />
              <col style="width: 200px" />
              <col style="width: 200px" />
              <col style="width: 200px" />
            </colgroup>
            <thead class="sticky-header">
              <tr class="text-start">
                <th v-if="selectedItems.length > 0 && currentTab !== 'inventario'">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>ID</th>
                <th>Objeto</th>
                <th>Bodega</th>
                <th>Referencia 1</th>
                <th>Referencia 2</th>
                <th>Referencia 3</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredInventarios"
                :key="item.id"
                class="text-start rows"
                @click="currentTab !== 'inventario' && toggleRow(item.id)"
              >
                <td
                  v-if="selectedItems.length > 0"
                  @click.stop
                  class="rows"
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  <template v-if="selectedItems.includes(item.id)">
                    <i class="bi bi-check2-circle text-success"></i>
                  </template>
                  <template v-else>
                    <i class="bi bi-circle text-secondary"></i>
                  </template>
                </td>
                <td :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  {{ item.id }}
                </td>
                <td :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  {{ item.objeto }}
                </td>
                <td :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  {{ item.bodega }}
                </td>
                <td :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  {{ item.referencia1 }}
                </td>
                <td :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  {{ item.referencia2 }}
                </td>
                <td :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  {{ item.referencia3 }}
                </td>
                <td class="rows text-uppercase" :class="{ 'selected-row': selectedItems.includes(item.id) }">
                  <template v-if="item.estado.toUpperCase() === 'DISPONIBLE'">
                    <i class="bi bi-check-circle-fill text-success"></i>
                  </template>
                  <template v-else-if="item.estado.toUpperCase() === 'ENTREGADO'">
                    <i class="bi bi-building-check"></i>
                  </template>
                  <template v-else>
                    <i class="bi bi-calendar-check text-info"></i>
                  </template>
                  {{ item.estado }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paginación -->
      <div class="d-flex justify-content-center align-items-center mt-3">
        <button
          class="btn btn-sm btn-outline-primary me-2"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          Anterior
        </button>
        <span> Página {{ currentPage }} de {{ totalPages }} </span>
        <button
          class="btn btn-sm btn-outline-primary ms-2"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Siguiente
        </button>
      </div>

      <!-- Componente Modal para Solicitud -->
      <SolicitudModal
        :visible="showModal"
        :selectedItems="selectedItemsData"
        :actionType="actionText"
        :modalTitle="modalTitle"
        @close="closeModal"
        @confirm="confirmAction"
      />
      <!-- Fondo para el modal -->
      <div class="modal-backdrop" v-if="showModal"></div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useTabStore } from "@/stores/tabStore";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "../../stores/authStore";
import { useLoaderStore } from "../../stores/loaderStore";
import DataDownload from "@/components/DataDownload.vue";
import SolicitudModal from "@/components/SolicitudModal.vue";

const stateMachine = {
  Transferencia: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": { next: "en proceso de recolección", tipoUsuarioId: 1 },
    "en proceso de recolección": { next: "recogido", tipoUsuarioId: 1 },
    recogido: { next: "en bodega", tipoUsuarioId: 1 },
    "en bodega": { next: "completado", tipoUsuarioId: null },
  },
  Prestamo: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": { next: "en proceso de entrega", tipoUsuarioId: 1 },
    "en proceso de entrega": { next: "entregado", tipoUsuarioId: 1 },
    entregado: { next: "completado", tipoUsuarioId: null },
  },
  Devolucion: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": { next: "en proceso de recolección", tipoUsuarioId: 1 },
    "en proceso de recolección": { next: "recogido", tipoUsuarioId: 1 },
    recogido: { next: "completado", tipoUsuarioId: null },
  },
  Desarchive: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": { next: "en proceso de entrega", tipoUsuarioId: 1 },
    "en proceso de entrega": { next: "entregado", tipoUsuarioId: 1 },
    entregado: { next: "completado", tipoUsuarioId: null },
  },
  transferencia: {
    "solicitud creada": { next: "cancelado", tipoUsuarioId: 1 },
    "asignado a transportador": { next: "cancelado", tipoUsuarioId: 1 },
    "en proceso de recolección": { next: "cancelado", tipoUsuarioId: 1 },
    recogido: { next: "cancelado", tipoUsuarioId: 1 },
    "en bodega": { next: "cancelado", tipoUsuarioId: 1 },
  },
};

export default {
  name: "Inventario",
  components: {
    DataDownload,
    SolicitudModal,
  },
  data() {
    return {
      currentPage: 1,
      totalCountAll: 0,
      totalCountDisponible: 0,
      totalCountEntregado: 0,
      authStore: useAuthStore(),
      currentTab: "inventario",
      searchTerm: "",
      recordsPerPage: 100,
      recordsOptions: [25, 50, 100, 250, 500],
      inventarios: [],
      selectedItems: [],
      showModal: false,
      sortColumn: "",
      sortOrder: "asc",
      loaderStore: useLoaderStore(),
      menuVisible: false,
      stateVisible: {
        disponible: true,
        solicitada: false,
        entregaConfirmada: false,
        devolucion: false,
        almacenada: false,
      },
      searchTimeout: null
    };
  },
  async mounted() {
    await this.fetchCounts(); // Obtener los totales para cada filtro
    await this.fetchCustodias();
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.recordsPerPage);
    },
    // Retorna el total según la pestaña actual
    totalCount() {
      if (this.currentTab === "inventario") {
        return this.totalCountAll;
      } else if (this.currentTab === "Disponible para prestar") {
        return this.totalCountDisponible;
      } else if (this.currentTab === "Disponible para devolver") {
        return this.totalCountEntregado;
      }
      return 0;
    },
    // Los datos paginados se reciben desde el servidor y se asignan a "inventarios"
    paginatedInventarios() {
      return this.inventarios;
    },
    availableCount() {
      return this.totalCountDisponible;
    },
    confirmedDeliveryCount() {
      return this.totalCountEntregado;
    },
    selectedItemsData() {
      return this.selectedItems.map((id) => this.getItemById(id));
    },
    modalTitle() {
      if (this.currentTab === "Disponible para prestar") {
        return "Solicitar Ítems";
      } else if (this.currentTab === "Disponible para devolver") {
        return "Devolver Ítems";
      }
      return "Acción";
    },
    actionText() {
      if (this.currentTab === "Disponible para prestar") {
        return "Solicitar";
      } else if (this.currentTab === "Disponible para devolver") {
        return "Devolver";
      } else {
        return "";
      }
    },
    filteredInventarios() {
      if (!this.searchTerm || this.searchTerm.trim() === '') {
        return this.inventarios;
      }
      
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      return this.inventarios.filter(item => {
        return (
          (item.objeto && item.objeto.toLowerCase().includes(searchTermLower)) ||
          (item.bodega && item.bodega.toLowerCase().includes(searchTermLower)) ||
          (item.referencia1 && item.referencia1.toLowerCase().includes(searchTermLower)) ||
          (item.referencia2 && item.referencia2.toLowerCase().includes(searchTermLower)) ||
          (item.referencia3 && item.referencia3.toLowerCase().includes(searchTermLower))
        );
      });
    },
    sortedInventarios() {
      if (!this.sortColumn) return this.filteredInventarios;
      return this.filteredInventarios.slice().sort((a, b) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];
        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return this.sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return this.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    },
    allSelected() {
      const visibleIds = this.paginatedInventarios.map((item) => item.id);
      if (visibleIds.length === 0) return false;
      return visibleIds.every((id) => this.selectedItems.includes(id));
    },
  },
  methods: {
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchCustodias();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.goToPage(this.currentPage + 1);
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    },
    toggleMenu() {
      this.menuVisible = !this.menuVisible;
    },
    toggleState(state) {
      this.stateVisible[state] = !this.stateVisible[state];
    },
    setMassUploadTab() {
      const tabStore = useTabStore();
      tabStore.setTab("MassUpload");
    },
    setMassAction() {
      const userStore = useUserStore();
      if (this.currentTab === "Disponible para prestar") {
        userStore.setMassAction("prestamo-masivo");
      } else if (this.currentTab === "Disponible para devolver") {
        userStore.setMassAction("devolucion-masiva");
      }
      return "";
    },
    toggleRow(id) {
      if (this.selectedItems.includes(id)) {
        this.selectedItems = this.selectedItems.filter((itemId) => itemId !== id);
      } else {
        this.selectedItems.push(id);
      }
    },
    // Obtiene los totales para cada categoría haciendo llamadas a la API (solo se solicita una fila para obtener totalCount)
    async fetchCounts() {
      try {
        const clienteId = this.authStore.clienteId;
        // Para Inventario (todos)
        const responseAll = await apiClient.post(`/api/custodias/cliente`, {
          clienteId,
          page: 1,
          pageSize: 1,
          tipo: ""
        });
        this.totalCountAll = responseAll.data.totalCount || 0;

        // Para Disponible para Prestar (estado DISPONIBLE)
        const responseDisponible = await apiClient.post(`/api/custodias/cliente`, {
          clienteId,
          page: 1,
          pageSize: 1,
          tipo: "disponible"
        });
        this.totalCountDisponible = responseDisponible.data.totalCount || 0;

        // Para Disponible para Devolver (estado ENTREGADO)
        const responseEntregado = await apiClient.post(`/api/custodias/cliente`, {
          clienteId,
          page: 1,
          pageSize: 1,
          tipo: "entregado"
        });
        this.totalCountEntregado = responseEntregado.data.totalCount || 0;
      } catch (error) {
        console.error("Error al obtener los totales:", error);
      }
    },
    async fetchCustodias() {
      try {
        const clienteId = this.authStore.clienteId;
        let tipo = "";
        switch (this.currentTab) {
          case "inventario":
            tipo = "";
            break;
          case "Disponible para prestar":
            tipo = "disponible";
            break;
          case "Disponible para devolver":
            tipo = "entregado";
            break;
          default:
            tipo = "";
            break;
        }

        const body = {
          clienteId,
          page: this.currentPage,
          pageSize: this.recordsPerPage,
          tipo: tipo,
          searchTerm: this.searchTerm ? this.searchTerm.trim() : ''
        };

        //this.loaderStore.showLoader();
        const response = await apiClient.post(`/api/custodias/cliente`, body);
        const datos = response.data.data ? response.data.data : response.data;
        this.inventarios = datos.map((custodia) => ({
          id: custodia.id,
          objeto: custodia.item,
          bodega: custodia.bodega,
          ubicacionId: custodia.ubicacionId,
          clienteId: custodia.clienteId,
          referencia1: custodia.referencia1,
          referencia2: custodia.referencia2,
          referencia3: custodia.referencia3,
          estado: custodia.estado,
          baja: custodia.baja,
        }));

        // Actualizar los contadores según el tipo y el término de búsqueda
        if (tipo === "disponible") {
          this.totalCountDisponible = response.data.totalCount || this.inventarios.length;
        } else if (tipo === "entregado") {
          this.totalCountEntregado = response.data.totalCount || this.inventarios.length;
        } else {
          this.totalCountAll = response.data.totalCount || this.inventarios.length;
        }
        
        //this.loaderStore.hideLoader();
      } catch (error) {
        console.error("Error al obtener datos de Custodia:", error);
        //this.loaderStore.hideLoader();
      }
    },
    loadMoreRecords() {
      this.currentPage++;
      this.fetchCustodias();
    },
    resetPagination() {
      this.currentPage = 1;
      this.selectedItems = [];
    },
    changeTab(tabName) {
      this.currentTab = tabName;
      this.currentPage = 1;
      this.searchTerm = ''; // Limpiar el término de búsqueda al cambiar de pestaña
      this.fetchCustodias();
      this.selectedItems = [];
    },
    toggleSelectAll() {
      const visibleIds = this.paginatedInventarios.map((item) => item.id);
      if (this.allSelected) {
        this.selectedItems = this.selectedItems.filter((id) => !visibleIds.includes(id));
      } else {
        this.selectedItems = [...new Set([...this.selectedItems, ...visibleIds])];
      }
    },
    getItemById(id) {
      return this.inventarios.find((item) => item.id === id);
    },
    openModal() {
      this.showModal = true;
    },
    async closeModal() {
      console.log("closeModal() llamado, se establece showModal = false");
      this.showModal = false;
      await this.fetchCustodias();
    },
    getNextState(modulo, currentState) {
      const transitions = stateMachine[modulo];
      if (!transitions) return null;
      const transition = transitions[currentState.toLowerCase()];
      return transition ? transition.next : null;
    },
    confirmAction(payload) {
      if (!payload.selectedItems || !Array.isArray(payload.selectedItems)) {
        console.error("No se recibió la data completa de los ítems:", payload);
        return;
      }
      const modulo =
        this.currentTab === "Disponible para prestar"
          ? "Prestamo"
          : this.currentTab === "Disponible para devolver"
          ? "Devolucion"
          : null;

      if (modulo) {
        payload.selectedItems.forEach((item) => {
          const nextState = this.getNextState(modulo, item.estado);
          if (nextState) {
            item.estado = nextState;
          }
        });
      }
      this.selectedItems = [];
      // Aquí se podría llamar a una API para actualizar el estado en el backend.
      this.closeModal();
    },
    setSort(column) {
      if (this.sortColumn === column) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortColumn = column;
        this.sortOrder = "asc";
      }
    },
    handleSearch() {
      // Cancelar el timeout anterior si existe
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Crear un nuevo timeout
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1; // Resetear a la primera página
        this.fetchCustodias();
      }, 300); // Esperar 300ms después de que el usuario deje de escribir
    },
  },
};
</script>

<style scoped>
:deep(.swal2-confirm.my-confirm-button) {
  background-color: #a3a3a3 !important;
  border: none !important;
  color: #000000 !important;
}
.blink {
  animation: blink-animation 1s steps(5, start) infinite;
  -webkit-animation: blink-animation 1s steps(5, start) infinite;
  color: white;
  background-color: black;
}
@keyframes blink-animation {
  to {
    visibility: hidden;
  }
}
@-webkit-keyframes blink-animation {
  to {
    visibility: hidden;
  }
}
.inventario-container {
  padding: 1rem;
}
.table-container {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  border: none;
}
.sticky-header {
  position: sticky;
  top: 0;
  background-color: #e5e5e5;
  z-index: 2;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.2);
}
.fixed-action-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 2;
}
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 500;
}
.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  max-width: 500px;
  width: 90%;
  z-index: 5000;
}
.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form-control:focus {
  border-color: gray;
  box-shadow: none !important;
}
:deep(.selected-row) {
  background-color: #e9e9e9 !important;
  cursor: pointer;
}
.rows {
  cursor: pointer;
}
.tab-container {
  display: flex;
  gap: 10px;
}
.tab-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #e5e5e5;
  border-radius: 50px;
  padding: 5px 15px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  position: relative;
  height: 31px;
  min-width: 150px;
  transition: background 0.3s ease-in-out, transform 0.2s ease-in-out;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}
.tab-button:hover {
  background: #d4d4d4;
  transform: translateY(-1px);
}
.tab-button.active {
  background: #c9c9c9 !important;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.2);
}
.tab-button i {
  margin-right: 8px;
  font-size: 16px;
}
.tab-badge {
  background: #1e1e1e;
  color: white;
  font-size: 14px;
  font-weight: bold;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease-in-out, height 0.3s ease-in-out,
    padding 0.3s ease-in-out, opacity 0.2s ease-in-out;
  overflow: hidden;
  white-space: nowrap;
  padding: 0;
  position: relative;
  margin-left: 8px;
  opacity: 0.8;
}
.tab-button:active .tab-badge,
.tab-button.active .tab-badge {
  width: auto;
  height: 20px;
  border-radius: 15px;
  padding: 4px 10px;
  opacity: 1;
}
.tab-badge span {
  display: none;
}
.tab-button:active .tab-badge span,
.tab-button.active .tab-badge span {
  display: inline;
  animation: fade-in 0.2s ease-in-out;
}
.tab-badge2 {
  background: #1e1e1e;
  color: white;
  font-size: 14px;
  font-weight: bold;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease-in-out, height 0.3s ease-in-out,
    padding 0.3s ease-in-out, opacity 0.2s ease-in-out;
  overflow: hidden;
  white-space: nowrap;
  padding: 0;
  position: relative;
  margin-left: 8px;
  opacity: 0.8;
}
.tab-button:hover .tab-badge2,
.tab-button.hover .tab-badge2 {
  width: auto;
  height: 20px;
  border-radius: 15px;
  padding: 4px 10px;
  opacity: 1;
}
.tab-badge2 span {
  display: none;
}
.tab-button:hover .tab-badge2 span,
.tab-button.hover .tab-badge2 span {
  display: inline;
  animation: fade-in 0.2s ease-in-out;
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.side-menu {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: calc(100vh - 97px);
  margin-top: 60px;
  background-color: #646464;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
  z-index: 5000;
  padding: 20px;
  overflow-y: auto;
  color: whitesmoke;
  transition: transform 0.5s ease-in-out;
  transform: translateX(100%);
}
.side-menu.menu-visible {
  transform: translateX(0);
}
.close-menu {
  font-size: 1em;
}
.state-item {
  cursor: pointer;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}
.state-description {
  padding: 10px;
  margin: 5px;
  text-justify: inter-word;
  transition: max-height 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
}
.state-description:not(v-if) {
  max-height: auto;
}
ol {
  padding-left: 0px;
}
li {
  list-style-type: none;
}
.btn-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-top: -5px;
}
.btn-circle.btn-sm {
  width: 30px;
  height: 30px;
  font-size: 0.8rem;
}
.btn-circle.btn-lg {
  width: 50px;
  height: 50px;
  font-size: 1.2rem;
}
</style>
