<template>
  <div class="modal fade" id="detalleModal" tabindex="-1" aria-labelledby="detalleModalLabel" aria-hidden="true"
    ref="detalleModal">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <!-- Encabezado del Modal -->
        <div class="modal-header row d-flex justify-content-between align-items-center">
          <div class="col">
            <h5 class="modal-title" id="detalleModalLabel">
              Detalle de Solicitud #{{ selectedTransferencia?.id }}
            </h5>
          </div>
          
           <div class="col text-end">
           
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"
              @click="$emit('close')"></button>
          </div>
        </div>        <!-- Cuerpo del Modal -->
        <div class="modal-body">
          <!-- Loader cuando está cargando -->
          <transition name="fade" mode="out-in">
            <div v-if="isLoading" key="loading" class="loading-container text-center py-5">
              <div class="loading-spinner">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
              <div class="loading-text">
                <h6 class="text-muted mb-0">Cargando detalle de la solicitud...</h6>
                <p class="text-muted small mt-1">Por favor espere un momento</p>
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            
            <!-- Contenido del modal cuando no está cargando y todos los datos están listos -->
            <div v-else-if="isDataReady" key="content">
              <p><strong>Cliente:</strong> {{ getClienteDisplayName() }}</p>
              <p><strong>Modulo:</strong> {{ processedTransferencia.modulo }}</p>
              <p><strong>Estado Actual:</strong> {{ processedTransferencia.estado }}</p>
              <p><strong>Observacion:</strong> {{ processedTransferencia.observaciones }}</p>
              <p>
                <strong>Fecha Solicitud:</strong>
                {{ formatDate(processedTransferencia.fechaSolicitud) }} - 
                {{ formatTime(processedTransferencia.fechaSolicitud) }}
              </p>
              <p>
                <strong>Ultima Actualizacion:</strong>
                {{ formatDate(processedTransferencia.updatedAt) }} - 
                {{ formatTime(processedTransferencia.updatedAt) }}
              </p>
              
              <hr />
              <h6>Detalles:</h6>
              <div v-if="!detalle || detalle.length === 0" class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No hay detalles disponibles para esta solicitud en el estado actual.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-bordered">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Referencia2</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in detalle" :key="item.id">
                      <td>{{ item.id }}</td>
                      <td>{{ item.referencia2 }}</td>
                      <td>{{ item.estado }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Timeline de Observaciones -->
              <div class="mt-4">
                <hr />
                <h6>
                  <i class="bi bi-chat-square-text me-2"></i>
                  Historial de Observaciones
                  <span v-if="observacionesTimeline && observacionesTimeline.length > 0" class="badge bg-secondary ms-2">
                    {{ observacionesTimeline.length }}
                  </span>
                </h6>
                
                <!-- Cuando hay observaciones -->
                <div v-if="observacionesTimeline && observacionesTimeline.length > 0" class="timeline-container">
                  <div 
                    v-for="(observacion, index) in observacionesTimelineOrdenado" 
                    :key="index"
                    class="timeline-item"
                    :class="{ 'timeline-item-latest': index === 0 }"
                  >
                    <div class="timeline-marker" :class="`timeline-marker-${getTimelineColor(observacion.nuevoEstado)}`">
                      <div class="timeline-marker-icon">
                        <i :class="getTimelineIcon(observacion.nuevoEstado)"></i>
                      </div>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <div class="timeline-state-change">
                          <span class="state-from">{{ observacion.estadoAnterior || 'N/A' }}</span>
                          <i class="bi bi-arrow-right mx-2"></i>
                          <span class="state-to">{{ observacion.nuevoEstado || 'N/A' }}</span>
                        </div>
                        <div class="timeline-meta">
                          <span class="timeline-user">
                            <i class="bi bi-person-fill me-1"></i>
                            {{ getUserDisplayName(observacion.usuario, observacion.usuarioNombre) }}
                          </span>
                          <span class="timeline-time">
                            <i class="bi bi-clock-fill me-1"></i>
                            {{ formatTimelineDate(observacion.fecha) }}
                            <small class="text-muted ms-2">({{ getTimeAgo(observacion.fecha) }})</small>
                          </span>
                        </div>
                      </div>
                      <div class="timeline-body">
                        <p class="mb-0">{{ observacion.observacion || 'Sin observaciones' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                    <!-- Cuando no hay observaciones -->
              <div v-else class="text-center py-4">
                <i class="bi bi-chat-square-dots text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2 mb-0">No hay observaciones registradas</p>
                <small class="text-muted">Las observaciones aparecerán aquí cuando se agreguen durante los cambios de estado.</small>
                <div v-if="selectedTransferencia?.observacionesUsuario === null" 
                     class="alert alert-warning mt-3 mx-auto" style="max-width: 80%;">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  El registro tiene un valor <code>NULL</code> en observaciones.
                  <small class="d-block mt-1">Se recomienda ejecutar la actualización de la base de datos.</small>
                </div>
              </div>
              </div>
              
              <!-- Sección de asignación de transportador -->
              <div v-if="estadoPermitido === 'asignado a transportador'">
                <div class="mb-3">
                  <label for="transportista" class="form-label">Transportador:</label>
                  <select id="transportista" class="form-select" v-model="selectedTransportistaId"
                    @change="onTransportistaChange" required>
                    <option value="" disabled>Seleccione un transportador</option>
                    <option v-for="transportista in transportistas" :key="transportista.id" :value="transportista.id">
                      {{ transportista.nombre }}
                    </option>
                  </select>
                </div>
                <div class="mb-3" v-if="selectedTransportistaId">
                  <label for="documentoIdentidad" class="form-label">Documento de Identidad:</label>
                  <input type="text" id="documentoIdentidad" class="form-control input-disabled"
                    v-model="documentoIdentidad" readonly />
                </div>
                <div class="mb-3">
                  <label for="placa" class="form-label">Placa:</label>
                  <input type="text" id="placa" class="form-control" v-model="placa"
                    placeholder="Ingrese la placa del vehículo" required />
                </div>
                <div class="mb-3">
                  <label for="sticker" class="form-label">Sticker Seguridad:</label>
                  <input type="text" id="sticker" class="form-control" v-model="sticker"
                    placeholder="Ingrese el codigo del sticker" />
                </div>
              </div>

              <!-- Asignación de Ubicaciones (solo si el estado permitido es 'completado') -->
              <div v-if="estadoPermitido === 'completado'" class="mt-3">
                <h6>Asignación de Ubicaciones:</h6>
                <div v-for="(item, idx) in detalle" :key="item.id" class="mb-2">
                  <label class="form-label">
                    Detalle ID {{ item.id }} - Ref.2: {{ item.referencia2 }}
                  </label>
                  <select class="form-select form-select-sm" v-model.number="item.nuevaUbicacionId">
                    <option disabled value="">Seleccione ubicación...</option>
                    <option 
                      v-for="u in availableUbicaciones.filter(
                        (u) =>
                          !detalle.some(
                            (d) =>
                              d.nuevaUbicacionId === u.id &&
                              d.id !== item.id
                          )
                      )" 
                      :key="u.id" 
                      :value="u.id"
                    >
                      {{ u.codigo }} - {{ u.estado }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Campo de observación para cambio de estado -->
              <div class="mt-3" v-if="processedTransferencia.estado.toLowerCase() !== 'entrega confirmada'">
                <hr />
                <h6>Observaciones del Cambio de Estado:</h6>
                <div class="mb-3">
                  <label for="observaciones" class="form-label">
                    Agregar observación <span class="text-muted">(opcional)</span>:
                  </label>
                  <textarea 
                    id="observaciones" 
                    class="form-control" 
                    v-model="observaciones"
                    placeholder="Ingrese observaciones sobre el cambio de estado..."
                    rows="3"
                    maxlength="500"
                  ></textarea>
                  <div class="form-text">
                    {{ observaciones ? observaciones.length : 0 }}/500 caracteres
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Estado de error -->
            <div v-else-if="hasError" key="error" class="error-container text-center py-5">
              <div class="error-icon mb-3">
                <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
              </div>
              <h6 class="text-muted mb-2">{{ errorMessage }}</h6>
              <button 
                type="button" 
                class="btn btn-outline-primary btn-sm mt-2"
                @click="$emit('retry')"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Reintentar
              </button>
            </div>
            
            <!-- Estado cuando no hay datos -->
          </transition>
        </div>
        
        <!-- Pie del Modal -->
        <div v-if="!botonDisabled && isDataReady && !hasError" class="modal-footer">
          <div class="d-flex align-items-center w-100 justify-content-end">
            <h6 class="me-2 mb-0">Actualizar estado a:</h6>
            <button class="btn btn-success" :disabled="botonDisabled || isLoading" @click="$emit('cambiar-estado')">
              <i class="bi bi-qr-code-scan me-1"></i>
              {{
                botonDisabled
                  ? "Confirmación Cliente Pendiente"
                  : estadoPermitido || "Cambiar Estado"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";
import { DateTime } from "luxon";

export default {
  name: "TransferenciaDetalleModal",
    props: {
    selectedTransferencia: {
      type: Object,
      default: null
    },
    detalle: {
      type: Array,
      default: () => []
    },
    estadoPermitido: {
      type: String,
      default: null
    },
    botonDisabled: {
      type: Boolean,
      default: true
    },
    transportistas: {
      type: Array,
      default: () => []
    },
    availableUbicaciones: {
      type: Array,
      default: () => []    },
    hasError: {
      type: Boolean,
      default: false
    },    errorMessage: {
      type: String,
      default: 'Ha ocurrido un error al cargar los datos'
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      detalleModalInstance: null,      selectedTransportistaId: null,
      transportista: '',
      documentoIdentidad: '',
      placa: '',
      sticker: '',
      observaciones: ''
    };
  },
    computed: {
    // Extraer el timeline de observaciones de la transferencia seleccionada
    observacionesTimeline() {
      // Primero intentar usar observacionesTimeline (ya parseado por backend)
      if (this.selectedTransferencia?.observacionesTimeline) {
        return this.selectedTransferencia.observacionesTimeline.map(obs => ({
          ...obs,
          fecha: obs.fecha?.replace('Z', '') // Quitar la Z para que se trate como hora local
        }));
      }
      
      // Si no existe, parsear observacionesUsuario con manejo robusto para NULL
      const observacionesUsuario = this.selectedTransferencia?.observacionesUsuario;
      
      // Si es NULL, indefinido, o un string vacío, devolver array vacío
      if (!observacionesUsuario) {
        console.info('📝 observacionesUsuario es NULL o indefinido, devolviendo array vacío');
        return [];
      }
      
      try {
        // Si parece ser ya un array (puede ocurrir si el backend ya lo parseó)
        if (Array.isArray(observacionesUsuario)) {
          console.info('📝 observacionesUsuario ya es un array');
          return observacionesUsuario.map(obs => ({
            ...obs,
            fecha: obs.fecha?.replace('Z', '') // Quitar la Z para que se trate como hora local
          }));
        }
        
        // Si es un string vacío o '[]', devolver array vacío
        if (observacionesUsuario === '' || observacionesUsuario === '[]') {
          console.info('📝 observacionesUsuario es un string vacío o "[]"');
          return [];
        }
        
        // Limpiar caracteres especiales antes del parsing
        const cleanJson = observacionesUsuario
          .replace(/\r\n/g, '')  // Remover \r\n
          .replace(/\r/g, '')    // Remover \r
          .replace(/\n/g, '')    // Remover \n
          .trim();               // Remover espacios al inicio/final
        
        // Si después de limpiar es vacío, devolver array vacío
        if (!cleanJson) {
          console.info('📝 observacionesUsuario limpio es vacío');
          return [];
        }
        
        try {
          const parsed = JSON.parse(cleanJson);
          const timeline = Array.isArray(parsed) ? parsed : [];
          
          // Quitar la Z de todas las fechas
          return timeline.map(obs => ({
            ...obs,
            fecha: obs.fecha?.replace('Z', '') // Quitar la Z para que se trate como hora local
          }));
        } catch (parseError) {
          console.error('❌ Error al parsear observaciones JSON:', parseError);
          console.log('⚠️ Contenido problemático:', cleanJson);
          return [];
        }
      } catch (error) {
        console.error('❌ Error general al procesar observaciones:', error);
        return [];
      }
    },
    
    // Ordenar el timeline de más reciente a más antiguo
    observacionesTimelineOrdenado() {
      if (!this.observacionesTimeline || this.observacionesTimeline.length === 0) {
        return [];
      }
      
      return [...this.observacionesTimeline].sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        return dateB - dateA; // Más reciente primero
      });
    },
      
    // Verifica que todos los datos necesarios estén cargados
    isDataReady() {
      // Si está cargando, no está listo
      if (this.isLoading) return false;
      
      // Si hay error, no está listo
      if (this.hasError) return false;
      
      // Verificar que hay información de la transferencia seleccionada
      if (!this.selectedTransferencia) return false;
      
      // No necesitamos verificar si hay detalles para mostrar la información básica
      
      // Si el estado es "completado", verificar que las ubicaciones están cargadas
      if (this.estadoPermitido === 'completado' && (!this.availableUbicaciones || this.availableUbicaciones.length === 0)) {
        return false;
      }
      
      // Si el estado es "asignado a transportador", verificar que los transportistas están cargados
      if (this.estadoPermitido === 'asignado a transportador' && (!this.transportistas || this.transportistas.length === 0)) {
        return false;
      }
      
      return true;
    },
    
    // Procesar las fechas del selectedTransferencia para quitar la Z
    processedTransferencia() {
      if (!this.selectedTransferencia) {
        return {
          id: 'N/A',
          modulo: 'N/A',
          estado: 'N/A',
          observaciones: 'Sin observaciones',
          fechaSolicitud: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return {
        ...this.selectedTransferencia,
        fechaSolicitud: this.selectedTransferencia.fechaSolicitud?.replace('Z', '') || new Date().toISOString(),
        updatedAt: this.selectedTransferencia.updatedAt?.replace('Z', '') || new Date().toISOString(),
        createdAt: this.selectedTransferencia.createdAt?.replace('Z', ''),
        fechaVerificacion: this.selectedTransferencia.fechaVerificacion?.replace('Z', ''),
        fechaCarga: this.selectedTransferencia.fechaCarga?.replace('Z', ''),
        fechaAsignacion: this.selectedTransferencia.fechaAsignacion?.replace('Z', ''),
        fechaRecogida: this.selectedTransferencia.fechaRecogida?.replace('Z', '')
      };
    }
  },
    watch: {
    observaciones(newVal) {
      this.$emit('update:observaciones', newVal);
    },
    placa(newVal) {
      this.$emit('update:placa', newVal);
    },
    sticker(newVal) {
      this.$emit('update:sticker', newVal);
    }
  },
  
  emits: ['close', 'cambiar-estado', 'retry', 'update:selectedTransportistaId', 'update:transportista', 'update:documentoIdentidad', 'update:placa', 'update:sticker', 'update:observaciones'],
  
  methods: {
    show() {
      const modalEl = this.$refs.detalleModal;
      if (!this.detalleModalInstance) {
        this.detalleModalInstance = new Modal(modalEl, {
          backdrop: 'static',
          keyboard: true
        });
      }
      this.detalleModalInstance.show();
    },
    
    hide() {
      if (this.detalleModalInstance) {
        this.detalleModalInstance.hide();
      }
    },
    
    onTransportistaChange() {
      if (this.selectedTransportistaId) {
        const transportista = this.transportistas.find(t => t.id === this.selectedTransportistaId);
        if (transportista) {
          this.transportista = transportista.nombre;
          this.documentoIdentidad = transportista.cc;
          
          // Emitir eventos para sincronizar con el padre
          this.$emit('update:selectedTransportistaId', this.selectedTransportistaId);
          this.$emit('update:transportista', this.transportista);
          this.$emit('update:documentoIdentidad', this.documentoIdentidad);
        }
      } else {
        this.transportista = '';
        this.documentoIdentidad = '';
        this.$emit('update:selectedTransportistaId', null);
        this.$emit('update:transportista', '');
        this.$emit('update:documentoIdentidad', '');
      }
    },    formatDate(dateString) {
      if (!dateString) return "";
      return DateTime.fromISO(dateString).toFormat("dd/MM/yyyy");
    },
    
    formatTime(dateString) {
      if (!dateString) return "";
      return DateTime.fromISO(dateString).toFormat("HH:mm:ss");
    },
    
    formatTimelineDate(timestamp) {
      if (!timestamp) return "";
      
      try {
        // Las fechas ya tienen la Z removida, parsear directamente
        let date = DateTime.fromISO(timestamp);
        
        if (!date.isValid) {
          // Intentar parsearlo como JavaScript Date si ISO falla
          const jsDate = new Date(timestamp);
          date = DateTime.fromJSDate(jsDate);
        }
        
        return date.toFormat("dd/MM/yyyy HH:mm");
      } catch (error) {
        console.error('❌ Error en formatTimelineDate:', error);
        return "Fecha inválida";
      }
    },
    
    resetFields() {
      this.selectedTransportistaId = null;
      this.transportista = '';
      this.documentoIdentidad = '';
      this.placa = '';
      this.sticker = '';
      this.observaciones = '';
    },
      // Obtener el nombre del cliente para mostrar en el modal
    getClienteDisplayName() {
      if (!this.selectedTransferencia) return 'N/A';
      
      // Si el backend ya envió el nombre, usarlo
      if (this.selectedTransferencia.clienteNombre && this.selectedTransferencia.clienteNombre.trim() !== '') {
        return this.selectedTransferencia.clienteNombre;
      }
      
      // Si no, mostrar ID como fallback
      if (this.selectedTransferencia.clienteId) {
        return `Cliente ${this.selectedTransferencia.clienteId}`;
      }
      
      return 'N/A';
    },    // Obtener el nombre del usuario (método simple)
    getUserDisplayName(usuarioId, usuarioNombre) {
      // Si el backend ya envió el nombre, usarlo
      if (usuarioNombre && usuarioNombre.trim() !== '') {
        return usuarioNombre;
      }
      // Si no, mostrar ID como fallback
      if (!usuarioId) return 'Sistema';
      return `Usuario ${usuarioId}`;
    },    // Formatear tiempo relativo para el timeline (método simple)
    getTimeAgo(timestamp) {
      if (!timestamp) return "";
      try {
        // Las fechas ya tienen la Z removida, parsear directamente
        let date = DateTime.fromISO(timestamp);
        
        if (!date.isValid) {
          const jsDate = new Date(timestamp);
          date = DateTime.fromJSDate(jsDate);
        }
        
        return date.toRelative({ locale: 'es' });
      } catch (error) {
        return "";
      }
    },
    
    // Obtener icono específico según el tipo de cambio de estado
    getTimelineIcon(estadoNuevo) {
      const iconMap = {
        'solicitud creada': 'bi-plus-circle-fill',
        'asignado a transportador': 'bi-truck',
        'en transito': 'bi-arrow-repeat',
        'entregado': 'bi-check-circle-fill',
        'completado': 'bi-flag-fill',
        'cancelado': 'bi-x-circle-fill',
        'devuelto': 'bi-arrow-left-circle-fill'
      };
      return iconMap[estadoNuevo?.toLowerCase()] || 'bi-chat-fill';
    },
    
    // Obtener color específico según el tipo de cambio de estado
    getTimelineColor(estadoNuevo) {
      const colorMap = {
        'solicitud creada': 'primary',
        'asignado a transportador': 'info',
        'en transito': 'warning',
        'entregado': 'success',
        'completado': 'success',
        'cancelado': 'danger',
        'devuelto': 'secondary'
      };
      return colorMap[estadoNuevo?.toLowerCase()] || 'primary';
    },
    
    // Método para imprimir debugging info sobre observaciones
    debugObservaciones() {
      if (!this.selectedTransferencia) {
        console.log('📊 No hay transferencia seleccionada');
        return;
      }
      
      const obsValue = this.selectedTransferencia.observacionesUsuario;
      console.log('📊 Tipo de observacionesUsuario:', typeof obsValue);
      console.log('📊 Es NULL:', obsValue === null);
      console.log('📊 Es undefined:', obsValue === undefined);
      console.log('📊 Es array:', Array.isArray(obsValue));
      console.log('📊 Valor raw:', obsValue);
      
      try {
        if (typeof obsValue === 'string' && obsValue) {
          console.log('📊 Parsing test:', JSON.parse(obsValue));
        }
      } catch (e) {
        console.error('📊 Error de parsing:', e);
      }
    }
  },
  
  beforeUnmount() {
    if (this.detalleModalInstance) {
      this.detalleModalInstance.dispose();
    }
  },
  
  mounted() {
    // Ejecutar debugging solo en desarrollo
    if (process.env.NODE_ENV !== 'production' && this.selectedTransferencia) {
      this.debugObservaciones();
    }
  }
};
</script>

<style scoped>
.input-disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Animación para el loader del modal */
.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

/* Animación suave para la aparición del contenido */
.modal-body > div {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mejora visual para el estado de carga */
.loading-container {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0.75rem;
  margin: -1rem;
  padding: 3rem 1rem !important;
  position: relative;
  overflow: hidden;
}

.loading-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

.loading-spinner {
  position: relative;
  z-index: 2;
}

.loading-text {
  position: relative;
  z-index: 2;
}

.loading-dots {
  display: inline-flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #6c757d;
  animation: loadingDots 1.4s infinite both;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes loadingDots {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Estilos para estado de error */
.error-container {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-radius: 0.75rem;
  margin: -1rem;
  padding: 3rem 1rem !important;
  border: 1px solid #feb2b2;
}

.error-icon i {
  animation: pulse 2s infinite;
}

/* Estilos para estado vacío */
.empty-state {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 0.75rem;
  margin: -1rem;
  padding: 3rem 1rem !important;
  border: 1px dashed #cbd5e0;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Transiciones para el cambio de estados */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Estilos para el campo de observaciones */
#observaciones {
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

#observaciones:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-text {
  font-size: 0.75rem;
  color: #6c757d;
}

/* Mejora visual para la sección de observaciones */
.mt-3 hr {
  margin: 1.5rem 0;
  border-color: #dee2e6;
}

.mt-3 h6 {
  color: #495057;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Estilos para el Timeline de Observaciones */
.timeline-container {
  position: relative;
  margin-left: 1rem;
}

.timeline-item {
  position: relative;
  padding-left: 3rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1rem;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 1.125rem;
  top: 2.5rem;
  bottom: -0.5rem;
  width: 2px;
  background: linear-gradient(to bottom, #dee2e6, #f8f9fa);
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 0;
  width: 2.25rem;
  height: 2.25rem;
  background: #ffffff;
  border: 3px solid #dee2e6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.3s ease;
}

.timeline-item-latest .timeline-marker {
  border-color: #0d6efd;
  background: #e7f3ff;
  transform: scale(1.1);
}

.timeline-marker-icon {
  font-size: 0.875rem;
  color: #6c757d;
}

.timeline-item-latest .timeline-marker-icon {
  color: #0d6efd;
}

.timeline-content {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-left: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.timeline-item-latest .timeline-content {
  border-color: #0d6efd;
  background: #f8feff;
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.timeline-state-change {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.state-from {
  color: #dc3545;
  background: #fff5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #feb2b2;
}

.state-to {
  color: #198754;
  background: #f0fff4;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #b6d7c7;
}

.timeline-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.75rem;
  color: #6c757d;
  gap: 0.25rem;
}

.timeline-user, .timeline-time {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.timeline-body {
  color: #495057;
  font-size: 0.875rem;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border-left: 3px solid #dee2e6;
}

.timeline-item-latest .timeline-body {
  border-left-color: #0d6efd;
  background: #f0f8ff;
}

/* Responsive para el timeline */
@media (max-width: 576px) {
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .timeline-meta {
    align-items: flex-start;
    flex-direction: row;
    gap: 1rem;
  }
  
  .timeline-state-change {
    flex-wrap: wrap;
  }
}

/* Colores específicos para diferentes tipos de cambios de estado */
.timeline-marker-primary {
  border-color: #0d6efd;
  background: #e7f3ff;
}

.timeline-marker-info {
  border-color: #0dcaf0;
  background: #e6f9ff;
}

.timeline-marker-warning {
  border-color: #ffc107;
  background: #fff8e1;
}

.timeline-marker-success {
  border-color: #198754;
  background: #e8f5e8;
}

.timeline-marker-danger {
  border-color: #dc3545;
  background: #ffeaea;
}

.timeline-marker-secondary {
  border-color: #6c757d;
  background: #f1f3f4;
}
</style>
