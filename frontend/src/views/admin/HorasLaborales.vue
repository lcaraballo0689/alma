<template>
  <div class="container-fluid p-0">
    <!-- Encabezado, buscador, etc. -->

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table table-striped align-middle shadow-sm">
        <thead>
          <tr>
            <th style="width: 5%;">ID</th>
            <th style="width: 20%;" class="text-start fw-bold">Cliente</th>
            <!-- Se muestran los días de la semana -->
            <th v-for="day in dayNames" :key="day" class="text-center" style="white-space: nowrap;">
              {{ day }}
            </th>
            <th style="width: 10%;" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading -->
          <tr v-if="loading">
            <td colspan="9" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </td>
          </tr>
          <!-- Sin datos -->
          <tr v-else-if="filteredHorarios.length === 0">
            <td colspan="9" class="text-center text-muted py-4">
              Sin datos de horarios.
            </td>
          </tr>
          <!-- Lista de horarios -->
          <tr v-else v-for="(h, idx) in filteredHorarios" :key="h.clienteId">
            <td>{{ h.clienteId }}</td>
            <td class="text-start fw-bold">{{ h.clienteNombre }}</td>
            <!-- Iteramos por cada día y mostramos un badge -->
            <td v-for="day in dayNames" :key="day" class="text-center" style="white-space: nowrap;">
              <span v-if="h.dias[day] && h.dias[day].active" class="badge bg-success" tabindex="0" role="button"
                :aria-label="`Horario activo para ${day}: Hora inicio ${h.dias[day].horaInicio || 'desconocida'}, Hora fin ${h.dias[day].horaFin || 'desconocida'}`"
                v-popover="popoverOptions(day, h)">
                Activo
              </span>
              <span v-else class="badge bg-danger">
                No Laborable
              </span>
            </td>

            <td class="text-center">
              <button class="btn btn-sm btn-warning" @click="editHorario(h)">
                <i class="bx bx-edit"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div ref="horarioModal" class="modal fade" tabindex="-1" aria-hidden="true" aria-labelledby="horarioModalLabel">
      <div class="modal-dialog modal-lg">
      <div class="modal-content" v-if="currentHorario">
        <div class="modal-header">
        <h5 class="modal-title" id="horarioModalLabel">
          Horario - {{ getClientName(currentHorario.clienteId) || 'Nuevo Cliente' }}
        </h5>
        <button type="button" class="btn-close" @click="closeHorarioModal" aria-label="Cerrar"></button>
        </div>
        <form @submit.prevent="saveHorario">
        <div class="modal-body">
          <!-- Selector de cliente -->
          <div class="mb-4">
          <label for="clienteSelect" class="form-label fw-bold">Seleccionar Cliente</label>
          <select id="clienteSelect" v-model="currentHorario.clienteId" class="form-select" required>
            <option disabled value="">-- Selecciona un Cliente --</option>
            <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
            {{ cliente.nombre }}
            </option>
          </select>
          </div>
          <!-- Días de la semana en 4 columnas -->
          <div class="row g-3">
          <div class="col-md-3" v-for="day in dayNames" :key="day">
            <div class="card p-3 h-100">
            <h6 class="card-title text-center">{{ day }}</h6>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" v-model="currentHorario.dias[day].active"
              :id="`toggle-${day}`" />
              <label class="form-check-label" :for="`toggle-${day}`">
              {{ currentHorario.dias[day].active ? "Activo" : "Inactivo" }}
              </label>
            </div>
            <!-- Selects para Horas solo si está activo -->
            <div v-if="currentHorario.dias[day].active">
              <div class="mb-2">
              <label class="form-label" :for="`horaInicio-${day}`">Hora Inicio</label>
              <select :id="`horaInicio-${day}`" v-model="currentHorario.dias[day].horaInicio"
                class="form-select" required>
                <option disabled value="">-- Selecciona Hora --</option>
                <option v-for="time in availableTimes" :key="time" :value="time">
                {{ time }}
                </option>
              </select>
              </div>
              <div>
              <label class="form-label" :for="`horaFin-${day}`">Hora Fin</label>
              <select :id="`horaFin-${day}`" v-model="currentHorario.dias[day].horaFin" class="form-select"
                required>
                <option disabled value="">-- Selecciona Hora --</option>
                <option v-for="time in availableTimes" :key="time" :value="time">
                {{ time }}
                </option>
              </select>
              </div>
            </div>
            </div>
          </div> <!-- Fin de cada columna de día -->
          </div>
        </div>
        <!-- Footer del Modal -->
        <div class="modal-footer d-flex justify-content-between">
          <button type="button" @click="closeHorarioModal" class="btn btn-secondary">
          <i class="bx bx-x-circle"></i> Cerrar
          </button>
          <button type="submit" class="btn btn-primary">
          <i class="bx bx-save"></i> Guardar
          </button>
        </div>
        </form>
      </div>
      </div>
    </div>
    <div ref="horarioModal" class="modal fade" tabindex="-1" aria-hidden="true" aria-labelledby="horarioModalLabel">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="currentHorario" style="width: 120%;">
          <div class="modal-header">
            <h5 class="modal-title" id="horarioModalLabel">
              Horario - {{ getClientName(currentHorario.clienteId) || 'Nuevo Cliente' }}
            </h5>
            <button type="button" class="btn-close" @click="closeHorarioModal" aria-label="Cerrar"></button>
          </div>
          <form @submit.prevent="saveHorario">
            <div class="modal-body">
              <!-- Días de la semana en 4 columnas -->
              <div class="row g-3">
                <div class="col-md-3" v-for="day in dayNames" :key="day">
                  <div class="card p-2 h-100">
                    <h6 class="card-title">{{ day }}</h6>
                    <div class="form-check form-switch mb-2">
                      <input class="form-check-input" type="checkbox" v-model="currentHorario.dias[day].active"
                        :id="`toggle-${day}`" />
                      <label class="form-check-label" :for="`toggle-${day}`">
                        {{
                          currentHorario.dias[day].active
                            ? "Activo"
                            : "Inactivo"
                        }}
                      </label>
                    </div>
                    <!-- Selects para Horas solo si está activo -->
                    <div v-if="currentHorario.dias[day].active">
                      <div class="mb-2">
                        <label class="form-label" :for="`horaInicio-${day}`">
                          Hora Inicio (AM/PM)
                        </label>
                        <select :id="`horaInicio-${day}`" v-model="currentHorario.dias[day].horaInicio"
                          class="form-select" required>
                          <option disabled value="">
                            -- Selecciona Hora --
                          </option>
                          <option v-for="time in availableTimes" :key="time" :value="time">
                            {{ time }}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label class="form-label" :for="`horaFin-${day}`">
                          Hora Fin (AM/PM)
                        </label>
                        <select :id="`horaFin-${day}`" v-model="currentHorario.dias[day].horaFin" class="form-select"
                          required>
                          <option disabled value="">
                            -- Selecciona Hora --
                          </option>
                          <option v-for="time in availableTimes" :key="time" :value="time">
                            {{ time }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div> <!-- Fin de cada columna de día -->
              </div>
            </div>
            <!-- Footer del Modal -->
            <div class="modal-footer">
              <button type="button" @click="closeHorarioModal" class="btn btn-secondary">
                Cerrar
              </button>
              <button type="submit" class="btn btn-success">
                Actualizar Horario
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal, Popover } from 'bootstrap';
import apiClient from '@/services/api';

export default {
  name: 'HorasLaborales',
  data() {
    return {
      dayNames: [
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
        'domingo'
      ],
      currentHorario: null,
      horarios: [],
      clientes: [],
      searchQuery: '',
      loading: true,
      modalInstance: null,
      // Opciones de hora para los select (ajusta según las necesidades)
      availableTimes: [
        '07:00 AM',
        '08:00 AM',
        '09:00 AM',
        '10:00 AM',
        '11:00 AM',
        '12:00 PM',
        '01:00 PM',
        '02:00 PM',
        '03:00 PM',
        '04:00 PM',
        '05:00 PM',
        '06:00 PM'
      ]
    };
  },
  directives: {
    // Directiva para manejar los popovers de forma declarativa
    popover: {
      mounted(el, binding) {
        const options = binding.value || { trigger: 'hover', placement: 'top' };
        el.__popoverInstance__ = new Popover(el, options);
      },
      updated(el, binding) {
        const options = binding.value || { trigger: 'hover', placement: 'top' };
        if (el.__popoverInstance__) {
          el.__popoverInstance__.dispose();
        }
        el.__popoverInstance__ = new Popover(el, options);
      },
      unmounted(el) {
        if (el.__popoverInstance__) {
          el.__popoverInstance__.dispose();
          delete el.__popoverInstance__;
        }
      }
    }
  },
  computed: {
    filteredHorarios() {
      const q = this.searchQuery.toLowerCase();
      return q
        ? this.horarios.filter(h =>
          h.clienteNombre?.toLowerCase().includes(q)
        )
        : this.horarios;
    }
  },
  methods: {
    // Crea la estructura base para un nuevo horario con días predefinidos
    newHorarioData() {
      const diasObj = {};
      for (const day of this.dayNames) {
        diasObj[day] = { active: false, horaInicio: '', horaFin: '' };
      }
      return {
        clienteId: '',
        dias: diasObj
      };
    },
    // Retorna las opciones para el popover según el día y la información del horario
    popoverOptions(day, h) {
      return {
        trigger: 'focus hover',
        placement: 'top',
        html: true,
        content: `<strong>Hora inicio:</strong> ${h.dias[day].horaInicio || '??'
          }<br><strong>Hora fin:</strong> ${h.dias[day].horaFin || '??'}`
      };
    },
    async loadHorarios() {
      this.loading = true;
      try {
        const res = await apiClient.get('/api/horarios');
        this.horarios = res.data;
      } catch (err) {
        console.error(err);
        this.horarios = [];
      } finally {
        this.loading = false;
      }
    },
    async loadClientes() {
      try {
        const res = await apiClient.get('/api/clientes');
        this.clientes = res.data;
      } catch (err) {
        console.error(err);
        this.clientes = [];
      }
    },
    openHorarioModal() {
      this.resetForm();
      this.showModal();
    },
    resetForm() {
      this.currentHorario = this.newHorarioData();
    },
    editHorario(h) {
      this.resetForm();
      this.currentHorario.clienteId = h.clienteId || '';
      if (h.dias) {
        for (const day of this.dayNames) {
          const info = h.dias[day];
          if (info) {
            this.currentHorario.dias[day].active = info.active;
            this.currentHorario.dias[day].horaInicio =
              info.horaInicio || '';
            this.currentHorario.dias[day].horaFin = info.horaFin || '';
          }
        }
      }
      this.showModal();
    },
    async saveHorario() {
      try {
        const payload = { ...this.currentHorario };
        await apiClient.post('/api/horarios', payload);
        // Se recomienda usar un sistema de notificaciones en lugar de alert()
        console.log('Guardado con éxito');
        this.loadHorarios();
        this.closeHorarioModal();
      } catch (err) {
        console.error(err);
        console.error('Error al guardar');
      }
    },
    showModal() {
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.horarioModal, {
          backdrop: 'static'
        });
      }
      this.modalInstance.show();
    },
    closeHorarioModal() {
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    },
    getClientName(clientId) {
      const client = this.clientes.find(c => c.id === clientId);
      return client ? client.nombre : '';
    }
  },
  mounted() {
    this.loadHorarios();
    this.loadClientes();
  }
};
</script>

<style scoped>
/* Estilos para la tabla */
.table thead th {
  background-color: #f8f9fa;
}

.table> :not(caption)>*>* {
  vertical-align: middle;
}

/* Estilos para el modal y las tarjetas */
.modal .card {
  border: 1px solid #e3e6f0;
  border-radius: 8px;
}

.card h6 {
  font-size: 0.95rem;
}

/* Ajusta el espaciado entre columnas y filas en el modal */
.row.g-3>[class^="col-"] {
  margin-bottom: 1rem;
}
</style>
