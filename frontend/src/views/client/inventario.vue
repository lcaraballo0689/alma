<template>
  <div class="inventario-container m-0 mx-3 p-0">
    <!-- Encabezado: pestañas, botón "Carga Masiva", DataDownload y búsqueda -->

    <!-- Tabla con scroll y encabezado fijo -->
    <div class="card shadow">
      <div class="card-header px-0 py-0 m-0">
        <div
          class="row align-items-center m-0 p-0 d-flex justify-content-between"
        >
          <!-- Columna Izquierda: Pestañas -->
          <div class="col-auto d-flex flex-wrap gap-2">
            <!-- Botón de Inventario -->
            <div class="tab-container">
              <button
                class="tab-button"
                :class="{ active: currentTab === 'inventario' }"
                @click="changeTab('inventario')"
              >
                <i class="bi bi-box"></i> Inventario
                <span class="tab-badge"
                  ><span>{{ totalCount }}</span></span
                >
              </button>

              <button
                class="tab-button"
                :class="{ active: currentTab === 'Disponible para prestar' }"
                @click="changeTab('Disponible para prestar')"
              >
                <i class="bi bi-check-circle"></i> Disponible para Prestar
                <span class="tab-badge"
                  ><span>{{ availableCount }}</span></span
                >
              </button>

              <button
                class="tab-button"
                :class="{ active: currentTab === 'Disponible para devolver' }"
                @click="changeTab('Disponible para devolver')"
              >
                <i class="bi bi-building-check"></i> Disponible para Devolver
                <span class="tab-badge"
                  ><span>{{ confirmedDeliveryCount }}</span></span
                >
              </button>
            </div>
          </div>
          <!-- Columna Derecha: Acciones -->
          <div class="col-auto d-flex align-items-center gap-3">
            
            <button
              v-if="selectedItems.length > 0"
              class="tab-button text-capitalize"
              style="
                background-color: #f99022 !important;
                color: white !important;
                font-size: 12px !important;
              "
              @click="openModal(actionText)"
            >
              <i class="bi bi-building-check"></i> {{ actionText }}
              <span class="tab-badge2"
                ><span>{{ selectedItems.length }}</span></span
              >
            </button>

            <!-- Botón Carga Masiva -->
            <button
              v-if="currentTab !== 'inventario' &&  selectedItems.length === 0"
              class="btn btn-sm buttons-actions d-flex align-items-center"
              style="
                width: 160px !important;
                color: white !important;
                background-color: black !important;
                font-weight: 700 !important;
              "
              @click="
                () => {
                  setMassUploadTab();
                  setMassAction();
                }
              "
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
                :headers="[
                  'objeto',
                  'bodega',
                  'referencia1',
                  'referencia2',
                  'referencia3',
                  'estado',
                ]"
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
                <th
                  v-if="selectedItems.length > 0 && currentTab !== 'inventario'"
                >
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
                v-for="item in paginatedInventarios"
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
                <td
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  {{ item.id }}
                </td>
                <td
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  {{ item.objeto }}
                </td>
                <td
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  {{ item.bodega }}
                </td>
                <td
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  {{ item.referencia1 }}
                </td>
                <td
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  {{ item.referencia2 }}
                </td>
                <td
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  {{ item.referencia3 }}
                </td>
                <td
                  class="rows text-uppercase"
                  :class="{ 'selected-row': selectedItems.includes(item.id) }"
                >
                  <template v-if="item.estado.toLowerCase() === 'disponible'">
                    <i class="bi bi-check-circle-fill text-success"></i>
                  </template>
                  <template
                    v-else-if="
                      item.estado.toLowerCase() === 'entrega confirmada'
                    "
                  >
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
      <div class="side-menu" :class="{ 'menu-visible': menuVisible }">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2><i class="bi bi-question-circle me-2"></i>Ayuda</h2>
          <button @click="toggleMenu" class="btn btn-circle btn-outline-light">
            X
          </button>
        </div>
        <hr />
        <ol class="help-content">
          <li class="state-item" @click="toggleState('disponible')">
            <strong>Disponible</strong>
            <div v-if="stateVisible.disponible" class="state-description">
              Este estado indica que la caja de archivos se encuentra almacenada
              y lista para ser solicitada. Significa que la caja está disponible
              para su consulta o préstamo.
            </div>
          </li>
          <li class="state-item" @click="toggleState('solicitada')">
            <strong>Solicitada</strong>
            <div v-if="stateVisible.solicitada" class="state-description">
              Este estado señala que se ha realizado una petición para acceder a
              la caja de archivos. Implica que alguien ha solicitado la caja y
              está a la espera de su entrega.
            </div>
          </li>
          <li class="state-item" @click="toggleState('entregaConfirmada')">
            <strong>Entrega Confirmada</strong>
            <div
              v-if="stateVisible.entregaConfirmada"
              class="state-description"
            >
              Este estado confirma que la caja de archivos ha sido entregada a
              la persona que la solicitó. Implica que el usuario actualmente
              tiene la caja en su poder.
            </div>
          </li>
          <li class="state-item" @click="toggleState('devolucion')">
            <strong>En Devolución</strong>
            <div v-if="stateVisible.devolucion" class="state-description">
              Este estado indica que la caja de archivos ha sido devuelta
              físicamente, pero aún se encuentra en proceso de verificación.
              Significa que la caja está siendo revisada para asegurar que esté
              completa y en buenas condiciones antes de ser re-almacenada.
            </div>
          </li>
          <li class="state-item" @click="toggleState('almacenada')">
            <strong>Disponible/Almacenada</strong>
            <div v-if="stateVisible.almacenada" class="state-description">
              Una vez que se ha confirmado que la caja de archivos ha sido
              devuelta en perfectas condiciones, esta, vuelve a estar
              disponible. Significa que la caja está nuevamente almacenada y
              lista para ser solicitada.
            </div>
          </li>
        </ol>
      </div>
    </div>
    <div class="d-flex justify-content-center align-items-center  mt-3">
              <button
                class="btn btn-sm  btn-outline-primary me-2"
                :disabled="currentPage === 1"
                @click="prevPage"
              >
                Anterior
              </button>
              <span> Página {{ currentPage }} de {{ totalPages }} </span>
              <button
                class="btn btn-sm  btn-outline-primary ms-2"
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
</template>

<script>
import apiClient from "@/services/api";
import { useTabStore } from "@/stores/tabStore";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "../../stores/authStore";
import { useLoaderStore } from "../../stores/loaderStore";
import DataDownload from "@/components/DataDownload.vue";
import SolicitudModal from "@/components/SolicitudModal.vue";

// Definición de la máquina de estados con las transiciones permitidas
const stateMachine = {
  Transferencia: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": {
      next: "en proceso de recolección",
      tipoUsuarioId: 1,
    },
    "en proceso de recolección": { next: "recogido", tipoUsuarioId: 1 },
    recogido: { next: "en bodega", tipoUsuarioId: 1 },
    "en bodega": { next: "completado", tipoUsuarioId: null },
  },
  Prestamo: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": {
      next: "en proceso de entrega",
      tipoUsuarioId: 1,
    },
    "en proceso de entrega": { next: "entregado", tipoUsuarioId: 1 },
    entregado: { next: "completado", tipoUsuarioId: null },
  },
  Devolucion: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": {
      next: "en proceso de recolección",
      tipoUsuarioId: 1,
    },
    "en proceso de recolección": { next: "recogido", tipoUsuarioId: 1 },
    recogido: { next: "completado", tipoUsuarioId: null },
  },
  Desarchive: {
    "solicitud creada": { next: "asignado a transportador", tipoUsuarioId: 1 },
    "asignado a transportador": {
      next: "en proceso de entrega",
      tipoUsuarioId: 1,
    },
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
      currentPage: 1, // Página actual
      totalCount: 0, // Total de registros (desde el servidor)
      authStore: useAuthStore(),
      currentTab: "inventario", // "inventario", "Disponible para prestar", "Disponible para devolver"
      searchTerm: "",
      recordsPerPage: 1000,
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
    };
  },
  async mounted() {
    await this.fetchCustodias();
  },
  watch: {
    searchTerm(newTerm) {
      if (newTerm.trim() !== "" && this.filteredInventarios.length === 0) {
        this.$swal({
          icon: "info",
          title: "Sin coincidencias",
          text: `No se encontraron coincidencias para "${newTerm}"`,
          timer: 50000,
          timerProgressBar: true,
          showConfirmButton: true,
          confirmButtonText: "Cerrar",
          customClass: {
            confirmButton: "my-confirm-button",
          },
        }).then(() => {
          this.searchTerm = "";
        });
      }
    },
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.recordsPerPage);
    },
    paginatedInventarios() {
      // Si hay un término de búsqueda, se muestran todos los registros filtrados.
      if (this.searchTerm.trim() !== "") {
        return this.sortedInventarios;
      }
      // Si no hay búsqueda, se aplica la paginación normal.
      const startIndex = (this.currentPage - 1) * this.recordsPerPage;
      const endIndex = this.currentPage * this.recordsPerPage;
      return this.sortedInventarios.slice(startIndex, endIndex);
    },

    availableCount() {
      return this.inventarios.filter(
        (item) => item.estado.toLowerCase() === "disponible"
      ).length;
    },
    confirmedDeliveryCount() {
      return this.inventarios.filter(
        (item) => item.estado.toLowerCase() === "entregado"
      ).length;
    },
    totalCount() {
      return this.inventarios.length;
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
      let filtered = this.inventarios.filter(
        (item) =>
          (item.referencia1 || "")
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          (item.referencia2 || "")
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())
      );
      if (this.currentTab == "Disponible para prestar") {
        filtered = filtered.filter(
          (item) => item.estado.toLowerCase() === "disponible"
        );
      } else if (this.currentTab == "Disponible para devolver") {
        console.log(`output->filtered`, filtered);
        filtered = filtered.filter((item) => item.estado.toLowerCase() === "entregado" );
      }
      return filtered;
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
    paginatedInventarios() {
      // Si hay un término de búsqueda, se muestran todos los registros filtrados.
      if (this.searchTerm.trim() !== "") {
        return this.sortedInventarios;
      }
      // Si no hay búsqueda, se aplica la paginación normal.
      const startIndex = (this.currentPage - 1) * this.recordsPerPage;
      const endIndex = this.currentPage * this.recordsPerPage;
      return this.sortedInventarios.slice(startIndex, endIndex);
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
        this.selectedItems = this.selectedItems.filter(
          (itemId) => itemId !== id
        );
      } else {
        this.selectedItems.push(id);
      }
    },
    async fetchCustodias() {
      try {
        const clienteId = this.authStore.clienteId;
        const body = {
          clienteId,
          page: this.currentPage,
          pageSize: this.recordsPerPage,
        };

        if (import.meta.env.DEV === true) {
          console.log("Request body:", body);
        }

        //this.loaderStore.showLoader();
        const response = await apiClient.post(`/api/custodias/cliente`, body);
        // Si la API devuelve { data: [...], totalCount: ... }:
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
        console.log("datos paginados: ", datos);

        // Actualiza el total de registros usando la propiedad que devuelve el API.
        this.totalCount = response.data.totalCount || this.inventarios.length;
        this.loaderStore.hideLoader();
      } catch (error) {
        console.error("Error al obtener datos de Custodia:", error);
      }
    },
    loadMoreRecords() {
      this.currentPage++;
    },
    resetPagination() {
      this.currentPage = 1;
    },
    changeTab(tabName) {
      this.currentTab = tabName;
      this.resetPagination();
      //this.fetchCustodias();
      this.selectedItems = [];
    },
    toggleSelectAll() {
      const visibleIds = this.paginatedInventarios.map((item) => item.id);
      if (this.allSelected) {
        this.selectedItems = this.selectedItems.filter(
          (id) => !visibleIds.includes(id)
        );
      } else {
        this.selectedItems = [
          ...new Set([...this.selectedItems, ...visibleIds]),
        ];
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
    // Método que utiliza la máquina de estados para obtener el siguiente estado permitido
    getNextState(modulo, currentState) {
      const transitions = stateMachine[modulo];
      if (!transitions) return null;
      const transition = transitions[currentState.toLowerCase()];
      return transition ? transition.next : null;
    },
    // Al confirmar la acción, se actualiza el estado de cada ítem seleccionado
    confirmAction(payload) {
      if (!payload.selectedItems || !Array.isArray(payload.selectedItems)) {
        console.error("No se recibió la data completa de los ítems:", payload);
        return;
      }
      // Determinar el módulo según la pestaña actual: para este ejemplo,
      // "Disponible para prestar" usa el módulo "Prestamo" y "Disponible para devolver" el módulo "Devolucion"
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

/* Contenedor de los botones */
.tab-container {
  display: flex;
  gap: 10px;
}

/* Botón con apariencia moderna */
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

/* Estado activo */
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
  width: 40px; /* Ajusta el tamaño del botón según tus necesidades */
  height: 40px;
  border-radius: 50%; /* Hace que el botón sea un círculo */
  display: flex; /* Centra el contenido vertical y horizontalmente */
  align-items: center;
  justify-content: center;
  padding: 0; /* Elimina el padding predeterminado del botón */
  margin-top: -5px;
}

/* Opcional: Ajustes para diferentes tamaños de botón */
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
