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
            <div v-else-if="isDataReady" key="content" class="modal-content-scrollable">
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
              </div>              <div v-else class="table-responsive details-table">
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
              
              <!-- Sección de asignación de transportador -->              <div v-if="estadoPermitido === 'asignado a transportador'">
                <div class="mb-3">
                  <label for="transportista" class="form-label">Transportador:</label>
                  <select id="transportista" class="form-select" v-model="selectedTransportistaId"
                    @change="onTransportistaChange" required :disabled="!transportistas || transportistas.length === 0">
                    <option value="" disabled>
                      {{ !transportistas || transportistas.length === 0 ? 'Cargando transportadores...' : 'Seleccione un transportador' }}
                    </option>                    <option 
                      v-for="transportista in transportistas" 
                      :key="transportista.id" 
                      :value="transportista.id"
                      :title="transportista.tipoUsuarioId === 5 ? 'Transportista' : 'Bodega-Transportista'"
                    >
                      {{ transportista.nombre }} 
                      {{ transportista.tipoUsuarioId === 6 ? '(Bodega)' : '' }}
                    </option>
                  </select>                  <div v-if="!transportistas || transportistas.length === 0" class="form-text text-warning mt-1">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> Cargando lista de transportadores...
                    <button type="button" class="btn btn-sm btn-outline-warning ms-2" @click="$emit('reload-transportistas')">
                      <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                    </button>
                  </div>
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
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0">Asignación de Ubicaciones:</h6>
                  <div class="btn-group" role="group">
                    <button 
                      type="button" 
                      class="btn btn-outline-success btn-sm"
                      @click="descargarPlantillaExcel"
                      :disabled="isLoadingExcel"
                      title="Descargar plantilla Excel para asignación masiva"
                    >
                      <i class="bi bi-file-earmark-excel me-1"></i>
                      Descargar Plantilla
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-outline-primary btn-sm"
                      @click="$refs.fileInput.click()"
                      :disabled="isLoadingExcel"
                      title="Cargar archivo Excel con asignaciones"
                    >
                      <i class="bi bi-upload me-1"></i>
                      Cargar Excel
                    </button>
                  </div>
                </div>
                
                <!-- Input oculto para seleccionar archivo -->
                <input 
                  ref="fileInput" 
                  type="file" 
                  accept=".xlsx,.xls" 
                  @change="procesarArchivoExcel" 
                  style="display: none;"
                />
                
                <!-- Indicador de carga de Excel -->
                <div v-if="isLoadingExcel" class="alert alert-info">
                  <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                    <span>{{ excelLoadingMessage }}</span>
                  </div>
                </div>
                
                <!-- Resultados de carga de Excel -->
                <div v-if="excelResults" class="alert" :class="excelResults.exitosas && excelResults.exitosas.length > 0 ? 'alert-success' : 'alert-warning'">
                  <h6 class="alert-heading">
                    <i :class="excelResults.exitosas && excelResults.exitosas.length > 0 ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'" class="me-2"></i>
                    Resultados del procesamiento Excel
                  </h6>
                  <div class="small mb-3">
                    <strong>Resumen:</strong> 
                    {{ excelResults.totalExitosas || 0 }} exitosas, 
                    {{ excelResults.totalErrores || 0 }} errores de {{ excelResults.totalProcesadas || 0 }} registros procesados.
                  </div>
                  
                  <!-- Botones de acción -->
                  <div class="d-flex gap-2 mb-2">
                    <button 
                      v-if="excelResults.exitosas && excelResults.exitosas.length > 0"
                      type="button" 
                      class="btn btn-sm btn-success"
                      @click="aplicarAsignacionesExcel"
                    >
                      <i class="bi bi-check-circle me-1"></i>
                      Aplicar {{ excelResults.exitosas.length }} Asignaciones
                    </button>
                    
                    <button 
                      v-if="excelResults.errores && excelResults.errores.length > 0"
                      type="button" 
                      class="btn btn-sm btn-outline-danger"
                      @click="descargarArchivoErrores"
                    >
                      <i class="bi bi-file-earmark-excel me-1"></i>
                      Descargar Errores ({{ excelResults.errores.length }})
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    class="btn-close" 
                    @click="cerrarResultadosExcel"
                    aria-label="Cerrar"
                  ></button>
                </div>
                
                <div v-if="!availableUbicaciones || availableUbicaciones.length === 0" class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  Cargando ubicaciones disponibles...
                  <button type="button" class="btn btn-sm btn-outline-warning ms-2" @click="$emit('reload-ubicaciones')">
                    <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                  </button>
                </div>
                <div v-for="(item, idx) in detalle" :key="item.id" class="mb-2">
                  <label class="form-label">
                    Detalle ID {{ item.id }} - Ref.2: {{ item.referencia2 }}
                  </label>
                  <select class="form-select form-select-sm" v-model.number="item.nuevaUbicacionId" 
                    :disabled="!availableUbicaciones || availableUbicaciones.length === 0">
                    <option disabled value="">{{ !availableUbicaciones || availableUbicaciones.length === 0 ? 'Cargando ubicaciones...' : 'Seleccione ubicación...' }}</option>
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

              <!-- Campo de observación para cambio de estado -->              <div class="mt-3" v-if="processedTransferencia && processedTransferencia.estado && processedTransferencia.estado.toLowerCase() !== 'entrega confirmada'">
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
          <!-- Pie del Modal -->        <div v-if="isDataReady && !hasError" class="modal-footer">
          <!-- Solo mostrar el botón cuando NO es "Entrega Confirmada" -->
          <div v-if="!isEntregaConfirmada" class="d-flex align-items-center w-100 justify-content-end">
            <h6 class="me-2 mb-0">Actualizar estado a:</h6>
            <button 
              class="btn btn-success" 
              :disabled="botonDisabled || isLoading || isActualizandoEstado" 
              @click="actualizarEstado"
              :title="botonDisabled ? 'No disponible para su rol' : 'Actualizar estado'"
            >
              <span v-if="isActualizandoEstado" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-qr-code-scan me-1"></i>
              {{
                isActualizandoEstado 
                  ? "Actualizando..." 
                  : (botonDisabled
                      ? "Confirmación Cliente Pendiente"
                      : estadoPermitido || "Cambiar Estado")
              }}
            </button>
          </div>
          <!-- Mostrar mensaje cuando es "Entrega Confirmada" -->
          <div v-else class="d-flex align-items-center w-100 justify-content-end">
            <p class="text-success mb-0">
              <i class="bi bi-check-circle-fill me-2"></i>
              <strong>Esta transferencia ya está completada</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";
import { DateTime } from "luxon";
import { useAuthStore } from "@/stores/authStore";
import * as XLSX from 'xlsx';
import apiClient from '@/services/api';

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
      observaciones: '',
      isActualizandoEstado: false,
      // Variables para funcionalidad de Excel
      isLoadingExcel: false,
      excelResults: null,
      showExcelResults: false,
      excelErrorFile: null
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
      console.log('🔄 Calculando isDataReady');
      
      // Si está cargando, no está listo
      if (this.isLoading) {
        console.log('⏳ isDataReady: false (isLoading es true)');
        return false;
      }
      
      // Si hay error, no está listo
      if (this.hasError) {
        console.log('❌ isDataReady: false (hasError es true)');
        return false;
      }
      
      // Verificar que hay información de la transferencia seleccionada
      if (!this.selectedTransferencia) {
        console.log('❌ isDataReady: false (selectedTransferencia es null/undefined)');
        return false;
      }
      
      // No necesitamos verificar si hay detalles para mostrar la información básica
        // Verificar ubicaciones pero no bloquear la visualización del modal
      if (this.estadoPermitido === 'completado' && (!this.availableUbicaciones || this.availableUbicaciones.length === 0)) {
        console.log('⚠️ isDataReady: true (estado "completado" pero faltan ubicaciones) - Mostrando de todas formas');
        // Ya no retornamos false aquí, permitimos que se muestre el contenido
      }
        // Verificar transportistas pero no bloquear la visualización del modal
      if (this.estadoPermitido === 'asignado a transportador' && (!this.transportistas || this.transportistas.length === 0)) {
        console.log('⚠️ isDataReady: true (estado "asignado a transportador" pero faltan transportistas) - Mostrando de todas formas');
        // Ya no retornamos false aquí, permitimos que se muestre el contenido
      }
      
      console.log('✅ isDataReady: true (todos los datos están disponibles)');
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
    },
    
    // Verificar si el estado actual es "Entrega Confirmada"
    isEntregaConfirmada() {
      if (!this.processedTransferencia || !this.processedTransferencia.estado) {
        return false;
      }
      
      // Normalizar a minúsculas y comparar
      const estadoActual = this.processedTransferencia.estado.toLowerCase();
      return estadoActual === 'entrega confirmada';
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
  
  emits: [
    'close', 
    'cambiar-estado', 
    'retry', 
    'reload-transportistas',
    'reload-ubicaciones',
    'update:selectedTransportistaId', 
    'update:transportista', 
    'update:documentoIdentidad', 
    'update:placa', 
    'update:sticker', 
    'update:observaciones',
    'aplicar-asignaciones-excel'
  ],
  
  methods: {    show() {
      console.log('🚀 TransferenciaDetalleModal - show() iniciado');
      const modalEl = this.$refs.detalleModal;
      console.log('🔍 TransferenciaDetalleModal - Elemento del modal:', modalEl ? 'Encontrado' : 'No encontrado');
      
      // Resetear el estado del botón actualizar
      this.isActualizandoEstado = false;
      
      try {
        if (!this.detalleModalInstance) {
          console.log('🔍 TransferenciaDetalleModal - Creando instancia de Modal');
          this.detalleModalInstance = new Modal(modalEl, {
            backdrop: 'static',
            keyboard: true
          });
        }
        
        console.log('🔍 TransferenciaDetalleModal - Llamando a show()');
        this.detalleModalInstance.show();
        console.log('✅ TransferenciaDetalleModal - show() completado');
      } catch (error) {
        console.error('❌ TransferenciaDetalleModal - Error en show():', error);
      }
    },
      hide() {
      console.log('🚪 TransferenciaDetalleModal - hide() iniciado');
      try {
        // Detener el loader cuando se cierra el modal
        this.isActualizandoEstado = false;
        
        if (this.detalleModalInstance) {
          this.detalleModalInstance.hide();
          console.log('✅ TransferenciaDetalleModal - hide() completado');
        } else {
          console.warn('⚠️ TransferenciaDetalleModal - No hay instancia para ocultar');
        }
      } catch (error) {
        console.error('❌ TransferenciaDetalleModal - Error en hide():', error);
      }
    },actualizarEstado() {
      // Mostrar el loader
      this.isActualizandoEstado = true;
      
      console.log('🔄 TransferenciaDetalleModal - Actualizando estado a:', this.estadoPermitido);
      
      // Emitir el evento al componente padre
      // El loader permanecerá activo hasta que se cierre el modal
      this.$emit('cambiar-estado');
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
      return DateTime.fromISO(dateString).toFormat("hh:mm a");
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
      console.group('📊 DEBUG - Análisis de observaciones');
      
      if (!this.selectedTransferencia) {
        console.log('❌ No hay transferencia seleccionada');
        console.groupEnd();
        return;
      }
      
      const obsValue = this.selectedTransferencia.observacionesUsuario;
      console.log('Tipo:', typeof obsValue);
      console.log('Es NULL:', obsValue === null);
      console.log('Es undefined:', obsValue === undefined);
      console.log('Es array:', Array.isArray(obsValue));
      console.log('Valor raw:', obsValue);
      
      // Tratar de mostrar JSON válido en la consola para depuración
      try {
        if (typeof obsValue === 'string' && obsValue) {
          const parsed = JSON.parse(obsValue);
          console.log('✅ Parsing exitoso');
          console.table(parsed);
          
          if (Array.isArray(parsed)) {
            console.log(`📝 Array con ${parsed.length} elementos`);
          } else {
            console.log('⚠️ Contenido parseado no es un array');
          }
        }
      } catch (e) {
        console.error('❌ Error de parsing:', e.message);
        
        if (typeof obsValue === 'string') {
          console.log('⚠️ Primeros 100 caracteres:', obsValue.substring(0, 100));
          
          // Intentar identificar caracteres problemáticos
          const charCodes = Array.from(obsValue.substring(0, 20)).map(c => c.charCodeAt(0));
          console.log('Códigos de caracteres:', charCodes);
        }
      }
      
      // Analizar el estado calculado en observacionesTimeline
      console.log('📊 observacionesTimeline calculado:', this.observacionesTimeline);
      console.log(`📊 Contiene ${this.observacionesTimeline?.length || 0} elementos`);
      
      console.groupEnd();
    },

    // Métodos para funcionalidad de Excel
    async descargarPlantillaExcel() {
      try {
        console.log('📥 Descargando plantilla Excel...');
        
        // Crear datos para la plantilla con referencia2, referencia3 y codigo (vacío)
        const plantillaData = this.detalle.map(item => ({
          referencia2: item.referencia2 || '',
          referencia3: item.referencia3 || '',
          codigo: '' // Campo vacío para que el usuario lo llene
        }));
        
        // Crear workbook y worksheet
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(plantillaData);
        
        // Agregar la hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Asignaciones');
        
        // Descargar el archivo
        const fileName = `plantilla_ubicaciones_${this.selectedTransferencia.id}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('✅ Plantilla descargada exitosamente');
      } catch (error) {
        console.error('❌ Error al descargar plantilla:', error);
        alert('Error al descargar la plantilla. Por favor, intente nuevamente.');
      }
    },

    triggerFileInput() {
      this.$refs.excelFileInput.click();
    },

    async procesarArchivoExcel(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      this.isLoadingExcel = true;
      this.excelResults = null;
      this.showExcelResults = false;
      this.excelErrorFile = null;
      
      try {
        console.log('📊 Procesando archivo Excel...');
        
        // Leer el archivo Excel
        const XLSX = await import('xlsx');
        const data = await this.readFileAsArrayBuffer(file);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('📋 Datos del Excel:', jsonData);
        
        // Procesar las asignaciones
        const resultado = await this.procesarAsignaciones(jsonData);
        
        this.excelResults = resultado;
        this.showExcelResults = true;
        
        // Si hay errores, generar archivo de errores
        if (resultado.errores.length > 0) {
          await this.generarArchivoErrores(resultado.errores);
        }
        
      } catch (error) {
        console.error('❌ Error al procesar archivo Excel:', error);
        alert('Error al procesar el archivo Excel. Verifique el formato y contenido.');
      } finally {
        this.isLoadingExcel = false;
        // Limpiar el input file
        event.target.value = '';
      }
    },

    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(new Uint8Array(e.target.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    },

    async procesarAsignaciones(excelData) {
      const asignacionesExitosas = [];
      const errores = [];
      const advertencias = [];
      
      for (let i = 0; i < excelData.length; i++) {
        const fila = excelData[i];
        const numeroFila = i + 2; // +2 porque Excel empieza en 1 y tiene header
        
        try {
          // Validar que tenga los campos requeridos
          if (!fila.referencia2 || !fila.referencia3 || !fila.codigo) {
            errores.push({
              fila: numeroFila,
              referencia2: fila.referencia2 || '',
              referencia3: fila.referencia3 || '',
              codigo: fila.codigo || '',
              error: 'Faltan campos requeridos (referencia2, referencia3, codigo)'
            });
            continue;
          }
          
          // Buscar el detalle correspondiente
          const detalleItem = this.detalle.find(d => 
            d.referencia2 === fila.referencia2 && d.referencia3 === fila.referencia3
          );
          
          if (!detalleItem) {
            errores.push({
              fila: numeroFila,
              referencia2: fila.referencia2,
              referencia3: fila.referencia3,
              codigo: fila.codigo,
              error: 'No se encontró un registro con esas referencias en la transferencia'
            });
            continue;
          }
          
          // Verificar si la ubicación existe
          let ubicacion = this.availableUbicaciones.find(u => u.codigo === fila.codigo);
          
          if (ubicacion) {
            // La ubicación existe, verificar si está disponible
            if (ubicacion.estado !== 'DISPONIBLE') {
              errores.push({
                fila: numeroFila,
                referencia2: fila.referencia2,
                referencia3: fila.referencia3,
                codigo: fila.codigo,
                error: `La ubicación ${fila.codigo} existe pero no está disponible (estado: ${ubicacion.estado})`
              });
              continue;
            }
          } else {
            // La ubicación no existe, simular creación
            advertencias.push({
              fila: numeroFila,
              referencia2: fila.referencia2,
              referencia3: fila.referencia3,
              codigo: fila.codigo,
              mensaje: `Se creará nueva ubicación: ${fila.codigo}`
            });
            
            // Simular la nueva ubicación (en el backend se creará realmente)
            ubicacion = {
              id: `new_${Date.now()}_${i}`, // ID temporal
              codigo: fila.codigo,
              estado: 'DISPONIBLE',
              ocupado: 0,
              bodegaId: 2
            };
          }
          
          // Agregar a asignaciones exitosas
          asignacionesExitosas.push({
            ubicacionId: ubicacion.id,
            detalleId: detalleItem.id,
            codigo: fila.codigo,
            referencia2: fila.referencia2,
            referencia3: fila.referencia3,
            esNueva: ubicacion.id.toString().startsWith('new_')
          });
          
        } catch (error) {
          console.error(`❌ Error procesando fila ${numeroFila}:`, error);
          errores.push({
            fila: numeroFila,
            referencia2: fila.referencia2 || '',
            referencia3: fila.referencia3 || '',
            codigo: fila.codigo || '',
            error: `Error interno: ${error.message}`
          });
        }
      }
      
      return {
        exitosas: asignacionesExitosas,
        errores,
        advertencias,
        totalProcesadas: excelData.length,
        totalExitosas: asignacionesExitosas.length,
        totalErrores: errores.length,
        totalAdvertencias: advertencias.length
      };
    },

    async generarArchivoErrores(errores) {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(errores);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Errores');
        
        // Convertir a blob para descarga posterior
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        this.excelErrorFile = new Blob([wbout], { type: 'application/octet-stream' });
        
        console.log('📄 Archivo de errores generado');
      } catch (error) {
        console.error('❌ Error al generar archivo de errores:', error);
      }
    },

    descargarArchivoErrores() {
      if (!this.excelErrorFile) return;
      
      const url = URL.createObjectURL(this.excelErrorFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = `errores_ubicaciones_${this.selectedTransferencia.id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    async aplicarAsignacionesExcel() {
      if (!this.excelResults || this.excelResults.exitosas.length === 0) {
        alert('No hay asignaciones válidas para aplicar.');
        return;
      }
      
      try {
        this.isLoadingExcel = true;
        
        // Extraer códigos únicos del Excel
        const codigosUnicos = [...new Set(this.excelResults.exitosas.map(item => item.codigo))];
        
        console.log('📋 Códigos extraídos del Excel:', codigosUnicos);
        
        // Llamar al nuevo endpoint para validar códigos
        const response = await apiClient.post('/api/transferencias/validarCodigosUbicacion', {
          codigos: codigosUnicos
        });
        
        console.log('✅ Respuesta del endpoint validarCodigosUbicacion:', response.data);
        
        const ubicacionesValidadas = response.data.resultados || [];
        
        // Mapear las asignaciones del Excel con las ubicaciones validadas
        const asignacionesConIds = this.excelResults.exitosas.map(asignacion => {
          const ubicacionValidada = ubicacionesValidadas.find(u => u.codigo === asignacion.codigo);
          
          if (!ubicacionValidada) {
            console.error(`❌ No se encontró ubicación validada para código: ${asignacion.codigo}`);
            return null;
          }
          
          return {
            detalleId: asignacion.detalleId,
            ubicacionId: ubicacionValidada.ubicacionId,
            codigo: asignacion.codigo,
            referencia2: asignacion.referencia2,
            referencia3: asignacion.referencia3,
            esNueva: ubicacionValidada.creada || false
          };
        }).filter(Boolean); // Filtrar elementos null
        
        console.log('🎯 Asignaciones con IDs reales:', asignacionesConIds);
         
         // Emitir evento para actualizar el frontend con las asignaciones procesadas
         this.$emit('aplicar-asignaciones-excel', asignacionesConIds);
         
         // Mostrar mensaje de éxito
         const mensaje = `✅ ${asignacionesConIds.length} asignaciones aplicadas correctamente`;
         alert(mensaje);
        
        // Limpiar resultados
        this.excelResults = null;
        this.showExcelResults = false;
        this.excelErrorFile = null;
        
      } catch (error) {
        console.error('❌ Error al aplicar asignaciones:', error);
        alert('Error al aplicar las asignaciones. Por favor, intente nuevamente.');
      } finally {
        this.isLoadingExcel = false;
      }
    },

    cerrarResultadosExcel() {
      this.excelResults = null;
      this.showExcelResults = false;
      this.excelErrorFile = null;
    }
  },
    beforeUnmount() {
    // Eliminar el event listener para evitar memory leaks
    const modalEl = this.$refs.detalleModal;
    if (modalEl) {
      modalEl.removeEventListener('hidden.bs.modal', () => {
        this.isActualizandoEstado = false;
      });
    }
    
    if (this.detalleModalInstance) {
      this.detalleModalInstance.dispose();
    }
  },
    mounted() {
    console.log('🔍 TransferenciaDetalleModal - mounted', {
      selectedTransferencia: this.selectedTransferencia ? `ID: ${this.selectedTransferencia.id}` : 'No seleccionado',
      estadoPermitido: this.estadoPermitido || 'No definido',
      isLoading: this.isLoading,
      hasError: this.hasError,
      detalleCount: this.detalle ? this.detalle.length : 0,
      isDataReady: this.isDataReady
    });
    
    // Añadir event listener para detectar cuando se cierra el modal
    // y detener el loader en ese momento
    const modalEl = this.$refs.detalleModal;
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        // Asegurarnos de que el loader se detenga cuando el modal se cierra
        this.isActualizandoEstado = false;
        console.log('🔄 TransferenciaDetalleModal - Modal cerrado, loader detenido');
      });
    }
    
    // Ejecutar debugging solo en desarrollo o producción
    if (this.selectedTransferencia) {
      this.debugObservaciones();
    }
  },
  
  updated() {
    console.log('🔄 TransferenciaDetalleModal - updated', {
      isDataReady: this.isDataReady,
      isLoading: this.isLoading,
      hasError: this.hasError
    });
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

/* Estilos para el scroll vertical en el contenido del modal */
.modal-content-scrollable {
  max-height: 20vh; /* Altura máxima relativa a la ventana */
  overflow-y: auto; /* Scroll vertical cuando el contenido excede la altura máxima */
  padding-right: 5px; /* Espacio para el scrollbar */
  scrollbar-width: thin; /* Para Firefox */
}

/* Estilos personalizados para el scrollbar en navegadores WebKit (Chrome, Safari, etc.) */
.modal-content-scrollable::-webkit-scrollbar {
  width: 6px;
}

.modal-content-scrollable::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.modal-content-scrollable::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.modal-content-scrollable::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Mejora para la tabla de detalles */
.details-table {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

/* Fijar el encabezado de la tabla */
.details-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Asegurarnos de que el modal tenga suficiente espacio */
@media (min-height: 768px) {
  .modal-content-scrollable {
    max-height: 65vh;
  }
}

@media (max-height: 576px) {
  .modal-content-scrollable {
    max-height: 50vh;
  }
}
</style>
