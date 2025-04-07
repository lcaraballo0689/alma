<template>
    <div class="container-fluid px-4 py-4">
      <!-- Fila superior con tarjetas de estadísticas -->

  
      <!-- Filtro por Módulo -->
      <div class="row mb-3">
        <div class="col-md-4">
          <label class="form-label fw-bold">Filtrar por Módulo</label>
          <select class="form-select" v-model="selectedModulo">
            <option value="">Todos</option>
            <option v-for="mod in distinctModulos" :key="mod" :value="mod">
              {{ mod }}
            </option>
          </select>
        </div>
      </div>
  
      <!-- Vista previa de la referencia para el módulo seleccionado -->
      <div v-if="selectedModulo" class="mb-3">
        <label class="form-label fw-bold"
          >Vista previa de la referencia para módulo "{{ selectedModulo }}"</label
        >
        <div class="alert alert-secondary">
          <code>{{ previewTemplate }}</code>
        </div>
      </div>
  
      <!-- Botón para crear una nueva nomenclatura -->
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-primary" @click="openModalToCreate">
          <i class="bi bi-plus-lg me-2"></i> Crear Nueva
        </button>
      </div>
  
      <!-- Tabla de Nomenclaturas -->
      <div class="card shadow-sm">
        <div class="card-header fw-bold">Nomenclaturas Registradas</div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-striped table-hover align-middle mb-0">
              <thead class="table-primary">
                <tr>
                  <th>ID</th>
                  <th>Cliente ID</th>
                  <th>Módulo</th>
                  <th>Tipo Componente</th>
                  <th>Componente</th>
                  <th>Orden</th>
                  <th>Separador</th>
                  <th>Valor Fijo</th>
                  <th>Placeholder</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in filteredNomenclaturas" :key="n.id">
                  <td>{{ n.id }}</td>
                  <td>{{ n.clienteId }}</td>
                  <td>{{ n.modulo }}</td>
                  <td>
                    <span>
                      {{
                        fixedComponents.includes(n.componente.toLowerCase())
                          ? "Placeholder fijo"
                          : "Personalizado"
                      }}
                    </span>
                  </td>
                  <td>{{ n.componente }}</td>
                  <td>{{ n.orden }}</td>
                  <td>{{ n.separador || "N/A" }}</td>
                  <td>{{ n.valorFijo || "N/A" }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="n.esPlaceholder ? 'bg-info' : 'bg-secondary'"
                    >
                      {{ n.esPlaceholder ? "Sí" : "No" }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button
                      class="btn btn-sm btn-outline-primary me-2"
                      @click="openModalToEdit(n)"
                    >
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteNomenclatura(n)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredNomenclaturas.length === 0">
                  <td colspan="10" class="text-center">
                    No hay nomenclaturas registradas.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  
      <!-- Modal para Crear/Editar Nomenclatura -->
      <div
        class="modal fade"
        id="nomenclaturaModal"
        tabindex="-1"
        aria-labelledby="nomenclaturaModalLabel"
        aria-hidden="true"
        ref="nomenclaturaModal"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <form
              @submit.prevent="isEditing ? updateNomenclatura() : createNomenclatura()"
            >
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="nomenclaturaModalLabel">
                  {{ isEditing ? "Editar Nomenclatura" : "Crear Nomenclatura" }}
                </h5>
                <button
                  type="button"
                  class="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  @click="clearForm"
                ></button>
              </div>
              <div class="modal-body">
                <input type="hidden" v-model.number="form.clienteId" />
  
                <div class="mb-3">
                  <label class="form-label fw-bold">Módulo</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.modulo"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Tipo de Componente</label>
                  <select
                    class="form-select"
                    v-model="form.tipoComponente"
                    required
                  >
                    <option value="placeholder">Placeholder fijo</option>
                    <option value="input">Valor personalizado</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Componente</label>
                  <template v-if="form.tipoComponente === 'placeholder'">
                    <select
                      class="form-select"
                      v-model="form.componente"
                      required
                    >
                      <option value="anio">Año</option>
                      <option value="mes">Mes</option>
                      <option value="dia">Día</option>
                      <option value="secuencia">Secuencia</option>
                      <option value="prefijo">Prefijo</option>
                    </select>
                  </template>
                  <template v-else>
                    <input
                      type="text"
                      class="form-control"
                      v-model="form.componente"
                      required
                    />
                  </template>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Orden</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="form.orden"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Separador</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.separador"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Valor Fijo</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.valorFijo"
                    placeholder="Si no es placeholder, ingresa el valor fijo"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">¿Es Placeholder?</label>
                  <select class="form-select" v-model="form.esPlaceholder" required>
                    <option :value="true">Sí</option>
                    <option :value="false">No</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-bs-dismiss="modal"
                  @click="clearForm"
                >
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                  {{ isEditing ? "Actualizar" : "Crear" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { Modal } from "bootstrap";
  import apiClient from "@/services/api";
  
  export default {
    name: "NomenclaturaManager",
    data() {
      return {
        nomenclaturas: [],
        // Cliente fijo en 2
        form: {
          id: null,
          clienteId: 2,
          modulo: "",
          tipoComponente: "input",
          componente: "",
          orden: 0,
          separador: "",
          valorFijo: "",
          esPlaceholder: true,
        },
        isEditing: false,
        modalInstance: null,
        selectedModulo: "",
        fixedComponents: ["anio", "mes", "dia", "secuencia", "prefijo"],
      };
    },
    computed: {
      // --- Cálculos para las tarjetas de la parte superior ---
      totalNomenclaturas() {
        return this.nomenclaturas.length;
      },
      placeholdersFijos() {
        return this.nomenclaturas.filter((n) =>
          this.fixedComponents.includes(n.componente.toLowerCase())
        ).length;
      },
      personalizadas() {
        return this.nomenclaturas.filter(
          (n) => !this.fixedComponents.includes(n.componente.toLowerCase())
        ).length;
      },
      conSeparador() {
        return this.nomenclaturas.filter((n) => n.separador).length;
      },
      sinSeparador() {
        return this.nomenclaturas.filter((n) => !n.separador).length;
      },
  
      // --- Para el filtro de la tabla ---
      distinctModulos() {
        const mods = this.nomenclaturas.map((n) => n.modulo);
        return [...new Set(mods)].sort();
      },
      filteredNomenclaturas() {
        if (this.selectedModulo) {
          return this.nomenclaturas.filter(
            (n) => n.modulo.toLowerCase() === this.selectedModulo.toLowerCase()
          );
        }
        return this.nomenclaturas;
      },
  
      // --- Vista previa para el módulo seleccionado ---
      previewTemplate() {
        const items = [...this.filteredNomenclaturas];
        if (items.length === 0) return "";
        items.sort((a, b) => a.orden - b.orden);
  
        let template = "";
        items.forEach((item) => {
          const piece = item.esPlaceholder ? `{${item.componente}}` : item.valorFijo;
          template += piece + (item.separador || "");
        });
  
        // Eliminar el separador del último item si lo hubiera
        const lastItem = items[items.length - 1];
        const lastSeparator = lastItem?.separador || "";
        if (lastSeparator && template.endsWith(lastSeparator)) {
          template = template.slice(0, -lastSeparator.length);
        }
        return template;
      },
    },
    methods: {
      async fetchNomenclaturas() {
        try {
          const response = await apiClient.post("/api/nomenclatura/getAll", {
            clienteId: 2,
          });
          this.nomenclaturas = response.data;
        } catch (error) {
          console.error("Error fetching nomenclaturas:", error);
        }
      },
      openModalToCreate() {
        this.isEditing = false;
        this.clearForm();
        this.showModal();
      },
      openModalToEdit(n) {
        this.isEditing = true;
        this.form = { ...n };
        this.form.tipoComponente = this.fixedComponents.includes(
          n.componente.toLowerCase()
        )
          ? "placeholder"
          : "input";
        this.showModal();
      },
      showModal() {
        if (!this.modalInstance) {
          const modalEl = this.$refs.nomenclaturaModal;
          this.modalInstance = new Modal(modalEl, {});
        }
        this.modalInstance.show();
      },
      hideModal() {
        if (this.modalInstance) {
          this.modalInstance.hide();
        }
      },
      async createNomenclatura() {
        try {
          await apiClient.post("/api/nomenclatura/create", this.form);
          this.fetchNomenclaturas();
          this.hideModal();
        } catch (error) {
          console.error("Error creating nomenclatura:", error);
        }
      },
      async updateNomenclatura() {
        try {
          await apiClient.post("/api/nomenclatura/update", this.form);
          this.fetchNomenclaturas();
          this.hideModal();
        } catch (error) {
          console.error("Error updating nomenclatura:", error);
        }
      },
      async deleteNomenclatura(n) {
        if (!confirm(`¿Eliminar la nomenclatura con ID ${n.id}?`)) return;
        try {
          await apiClient.post("/api/nomenclatura/delete", {
            id: n.id,
            clienteId: n.clienteId,
          });
          this.fetchNomenclaturas();
        } catch (error) {
          console.error("Error deleting nomenclatura:", error);
        }
      },
      clearForm() {
        this.form = {
          id: null,
          clienteId: 2,
          modulo: "",
          tipoComponente: "input",
          componente: "",
          orden: 0,
          separador: "",
          valorFijo: "",
          esPlaceholder: true,
        };
        this.isEditing = false;
      },
    },
    mounted() {
      this.fetchNomenclaturas();
    },
  };
  </script>
  
  <style scoped>
  /* ==== Tarjetas de la parte superior ==== */
  .info-card {
    background-color: #1b2e4b;
    color: #fff;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  
  .info-card-sm {
    background-color: #1b2e4b;
    color: #fff;
    padding: 0.75rem;
    border-radius: 0.5rem;
  }
  
  .info-card i {
    font-size: 2rem;
  }
  
  .info-card-sm h4 {
    margin: 0;
  }
  
  .info-card-sm small {
    display: block;
    font-size: 0.8rem;
  }
  
  /* ==== Tabla y Modal ==== */
  .table-responsive {
    margin-top: 1rem;
  }
  
  .table thead th {
    vertical-align: middle;
  }
  
  .table tbody td {
    vertical-align: middle;
  }
  
  .badge {
    font-size: 0.9rem;
    padding: 0.5em 0.75em;
  }
  
  .modal-content {
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .modal-header {
    padding: 1rem 1.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: none;
  }
  </style>
  