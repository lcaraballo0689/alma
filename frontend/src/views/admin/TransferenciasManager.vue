<template>
  <div class="container-fluid p-0 pt-2">
    <!-- Card de Filtros -->
    <div class="card shadow-sm mb-4">
      <div class="card-header">
        <div class="row align-items-center justify-content-between">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="search" type="text" class="form-control" placeholder="Buscar..." />
            </div>
          </div>
          <!-- <div class="col-md-2">
            <select class="form-select" v-model="selectedEstado">
              <option value="">Todos los estados</option>
              <option value="solicitud creada">Solicitud creada</option>
              <option value="asignado a transportador">Asignado a transportador</option>
              <option value="en proceso de recolección">En proceso de recolección</option>
              <option value="recogido">Recogido</option>
              <option value="en bodega">En bodega</option>
              <option value="completado">Completado</option>
            </select>
          </div> -->
          <div class="col-md-4">
            <ul class="nav nav-pills justify-content-center">
              <li class="nav-item" v-for="mod in modules" :key="mod">
                <button class="btn btn-sm me-2" :class="{
                  'btn-outline-secondary': activeModule !== mod,
                  'btn-secondary': activeModule === mod
                }" @click="activeModule = mod">
                  {{ mod }}
                </button>
              </li>
            </ul>
          </div>
          <div class="col-md-3">
            <ul class="nav nav-tabs justify-content-end">
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'pendientes' }"
                  @click="activeTab = 'pendientes'">

                  Pendientes
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'completadas' }"
                  @click="activeTab = 'completadas'">
                  Completadas
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        <hr class="m-0" />
        <div class="table-container">
          <table class="table table-striped mb-0">
            <thead class="table-light table-sticky-header">
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Tipo Solicitud</th>
                <th>Estado</th>
                <th>{{ direccionHeader }}</th>
                <th>Observaciones</th>
                <th>Fecha Solicitud</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>              <tr v-for="t in filteredTransferencias" :key="t.id">
                <td>{{ t.id }}</td>
                <td>{{ getClienteDisplayName(t) }}</td>
                <td>{{ t.modulo }}</td>
                <td>{{ t.estado }}</td>
                <td>{{ t.direccion }}</td>
                <td style="width: 100px; text-align: justify;">{{ t.observaciones }}</td>
                <td>{{ formatDate(t.fechaSolicitud) }} - {{ formatTime2(t.fechaSolicitud) }}</td>

                <td>
                  <button class="btn btn-sm btn-outline-primary" @click="seleccionarTransferencia(t)">
                    <i class="bi bi-eye"></i> Ver Detalle
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredTransferencias.length">
                <td colspan="6" class="text-center py-3">
                  <i class="bi bi-exclamation-circle me-2"></i>
                  No hay solicitudes registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>    </div>

    <!-- Componente Modal -->    <TransferenciaDetalleModal
      ref="detalleModal"
      :selectedTransferencia="selectedTransferencia"
      :detalle="detalle"
      :estadoPermitido="estadoPermitido"
      :botonDisabled="botonDisabled"
      :transportistas="transportistas"
      :availableUbicaciones="availableUbicaciones"      :isLoading="isLoadingModal"
      :hasError="hasModalError"
      :errorMessage="modalErrorMessage"
      v-model:selectedTransportistaId="selectedTransportistaId"
      v-model:transportista="transportista"
      v-model:documentoIdentidad="documentoIdentidad"      v-model:placa="placa"
      v-model:sticker="sticker"      v-model:observaciones="observaciones"
      @close="closeDetalle"
      @cambiar-estado="cambiarEstado"
      @retry="retryLoadModal"
      @reload-transportistas="reloadTransportistas"
      @reload-ubicaciones="reloadUbicaciones"
      @aplicar-asignaciones-excel="aplicarAsignacionesExcel"
    />
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { DateTime } from "luxon";
import TransferenciaDetalleModal from "@/components/TransferenciaDetalleModal.vue";

export default {
  name: "TransferenciaManager",
  components: {
    TransferenciaDetalleModal
  },
  data() {
    return {
      transferencias: [],      selectedTransferencia: null,
      detalle: null,      isLoadingModal: false, // Loading state para el modal
      hasModalError: false, // Estado de error del modal
      modalErrorMessage: 'Ha ocurrido un error al cargar los datos', // Mensaje de error
      availableUbicaciones: [],
      search: "",
      selectedEstado: "",
      activeTab: "pendientes",
      modules: ["Transferencia", "Prestamo", "Devolucion", "Desarchive"],
      activeModule: "Transferencia",
      estadoPermitido: null,
      botonDisabled: true,      authStore: useAuthStore(),
      transportista: '',
      transportistas: [], // Lista de transportistas
      selectedTransportistaId: null, // ID del transportista seleccionado
      documentoIdentidad: '',      placa: '',
      sticker: '',
      observaciones: '', // Campo para observaciones del cambio de estado
    };
  },
  computed: {
    direccionHeader() {      if (this.filteredTransferencias && this.filteredTransferencias.length > 0 && this.filteredTransferencias[0].modulo) {
        // Convertir a minúsculas para evitar problemas de mayúsculas/minúsculas
        const modulo = this.filteredTransferencias[0].modulo.toLowerCase();
        if (modulo === "transferencia" || modulo === "devolucion") {
          return "Dirección de recogida";
        } else if (modulo === "prestamo" || modulo === "desarchivo" || modulo === "desarchive") {
          return "Dirección de entrega";
        }
      }
      return "";
    },
    filteredTransferencias() {      return this.transferencias.filter((t) => {
        // Validar que estado exista antes de usar toLowerCase
        const estadoLower = t.estado ? t.estado.toLowerCase() : "";
        const moduloLower = t.modulo ? t.modulo.toLowerCase() : "";        const matchModule = this.activeModule
          ? moduloLower === (this.activeModule ? this.activeModule.toLowerCase() : "")
          : true;const matchEstado = this.selectedEstado
          ? estadoLower === (this.selectedEstado ? this.selectedEstado.toLowerCase() : "")
          : true;const matchBusqueda = this.search
          ? (t.clienteId ? t.clienteId.toString().includes(this.search) : false) ||
            (estadoLower ? estadoLower.includes(this.search.toLowerCase()) : false)
          : true;
        const isCompleted = estadoLower === "completado";
        if (this.activeTab === "completadas") {
          return isCompleted && matchModule && matchEstado && matchBusqueda;
        } else {
          return !isCompleted && matchModule && matchEstado && matchBusqueda;
        }
      });
    },
  },
  methods: {    // Retorna la fecha formateada "dd/MM/yyyy" en la zona de Bogotá
    formatDate(dateString) {
      if (!dateString) return "N/A";
      
      let dt;
      if (dateString.endsWith('Z')) {
        // Es UTC, convertir a Bogotá
        dt = DateTime.fromISO(dateString, { zone: "utc" }).setZone("America/Bogota");
      } else {
        // No es UTC, parsear directamente
        dt = DateTime.fromISO(dateString);
      }
      
      return dt.setLocale("es").toFormat("dd/MM/yyyy");
    },
    // Retorna la hora formateada "HH:mm" en la zona de Bogotá
    formatTime(dateString) {
      if (!dateString) return "N/A";
      
      let dt;
      if (dateString.endsWith('Z')) {
        // Es UTC, convertir a Bogotá
        dt = DateTime.fromISO(dateString, { zone: "utc" }).setZone("America/Bogota");
      } else {
        // No es UTC, parsear directamente
        dt = DateTime.fromISO(dateString);
      }
      
      return dt.setLocale("es").toFormat("hh:mm a");
    },
    formatTime2(dateString) {
      if (!dateString) return "N/A";
      
      let dt;
      if (dateString.endsWith('Z')) {
        // Es UTC, convertir a Bogotá
        dt = dateString.endsWith('Z')
          ? DateTime.fromISO(dateString, { zone: "utc" }).setZone("utc")
          : DateTime.fromISO(dateString);
      } else {
        // No es UTC, parsear directamente
        dt = DateTime.fromISO(dateString);
      }
      
      return dt.setLocale("es").toFormat("hh:mm a");
    },
      // Obtener el nombre del cliente para mostrar en la tabla
    getClienteDisplayName(transferencia) {
      if (!transferencia) return 'N/A';
      
      // Si el backend ya envió el nombre, usarlo
      if (transferencia.clienteNombre && transferencia.clienteNombre.trim() !== '') {
        return transferencia.clienteNombre;
      }
      
      // Si no, mostrar ID como fallback
      if (transferencia.clienteId) {
        return `Cliente ${transferencia.clienteId}`;
      }
      
      return 'N/A';
    },
    async fetchTransferencias() {
      try {
        const body = { clienteId: 2 };
        const response = await apiClient.post(
          "/api/transferencias/consultar",
          body
        );
        this.transferencias = response.data.data || [];
        // console.log("Transferencias:", this.transferencias);
      } catch (error) {
        console.error("Error fetching transferencias:", error);
      }
    },

    async cargarTransportistas() {
      try {
        const response = await apiClient.get("/api/transferencias/transportistas");
        this.transportistas = response.data.data || [];
        // console.log("Transportistas cargados:", this.transportistas);
      } catch (error) {
        console.error("Error cargando transportistas:", error);
        this.transportistas = [];      }
    },
    
    async fetchEstadoPermitido() {

      try {
        const tipoUsuarioId = this.authStore.user?.tipoUsuarioId;
        // console.log("Tipo Usuario ID:", tipoUsuarioId);

        if (!this.selectedTransferencia) return;
        const body = {
          clienteId: this.selectedTransferencia.clienteId,
          tipoUsuarioId,
          modulo: this.selectedTransferencia.modulo,
          estadoActual: this.selectedTransferencia.estado,
        };
        // console.log("Body para estado permitido:", body);
        const response = await apiClient.post(
          "/api/estados/transiciones",
          body
        );
        const data = response.data;
        this.estadoPermitido = data.estadoPermitido;
        this.botonDisabled = data.disabled;
        // console.log("EstadoPermitido:", this.estadoPermitido, "Disabled:", this.botonDisabled);
      } catch (error) {
        console.error("Error fetching estadoPermitido:", error);
        this.estadoPermitido = null;
        this.botonDisabled = true;
      }    },    async seleccionarTransferencia(t) {
      try {        // Limpiar estados anteriores
        this.isLoadingModal = true;
        this.hasModalError = false;
        this.selectedTransferencia = t;
        
        // Limpiar todos los datos anteriores
        this.detalle = null;
        this.estadoPermitido = null;
        this.availableUbicaciones = [];
        this.transportistas = [];
        
        // Mostrar el modal con el loader
        this.showDetalleModal();
        
        // Cargar detalle básico primero
        await this.fetchDetalle(t.id);
        
        // Cargar estado permitido
        await this.fetchEstadoPermitido();
          // Cargar datos adicionales necesarios
        const loadingPromises = [];
        
        // Siempre cargar transportistas para tener la lista disponible
        // incluso si aún no se necesitan (para casos donde cambia el estado)
        loadingPromises.push(
          this.fetchTransportistas()
            .catch(err => console.warn("No se pudieron cargar los transportistas, pero continuamos", err))
        );
        
        // Cargar ubicaciones si es necesario
        if (this.estadoPermitido === 'completado') {
          loadingPromises.push(
            this.fetchUbicacionesDisponibles()
              .catch(err => console.warn("No se pudieron cargar las ubicaciones, pero continuamos", err))
          );
        }
        
        // Esperar a que se carguen todos los datos adicionales
        if (loadingPromises.length > 0) {
          try {
            await Promise.allSettled(loadingPromises); // Usamos allSettled en lugar de all para continuar incluso si hay errores
            console.log("✅ Carga de datos adicionales completada (transportistas y/o ubicaciones)");
          } catch (error) {
            console.warn("⚠️ Algunos recursos no pudieron cargarse, pero continuamos", error);
          }
        }
        
        // Pequeña pausa para asegurar que el renderizado se complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Desactivar loading una vez que todo esté cargado
        this.isLoadingModal = false;
        
      } catch (error) {
        console.error("Error al seleccionar transferencia:", error);
        this.isLoadingModal = false; // Asegurar que se desactive el loading en caso de error
        this.hasModalError = true; // Activar estado de error
        this.modalErrorMessage = "No se pudo cargar la información de la solicitud. Verifique su conexión e intente nuevamente.";
        
        // Mostrar mensaje de error al usuario
        await import("sweetalert2").then((Swal) => {
          Swal.default.fire({
            toast: true,
            position: "bottom-right",
            icon: "error",
            title: "Error al cargar detalle",
            text: "No se pudo cargar la información de la solicitud",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        });
      }
    },    async fetchDetalle(solicitudId) {      try {
        const body = { solicitudId };
        const response = await apiClient.post(
          "/api/transferencias/detalle",
          body
        );
        this.detalle = response.data.detalle || [];
        
        // Asegurarse de que selectedTransferencia tenga el timeline
        if (response.data.solicitud) {
          this.selectedTransferencia = {
            ...this.selectedTransferencia,
            ...response.data.solicitud
          };
        }
        
        // console.log("Detalle:", this.detalle);
      } catch (error) {
        console.error("Error fetching detalle:", error);
      }
    },    async fetchUbicacionesDisponibles() {
      try {
        console.log("📡 Iniciando carga de ubicaciones...");
        const response = await apiClient.get("/api/transferencias/ubicaciones");
        this.availableUbicaciones = response.data.data.filter(
          (u) => !u.ocupado && u.estado.toUpperCase() === "DISPONIBLE"
        );
        console.log(`✅ Ubicaciones disponibles cargadas: ${this.availableUbicaciones.length} encontradas`);
        return this.availableUbicaciones;
      } catch (error) {
        console.error("❌ Error cargando ubicaciones:", error);
        // No establecemos this.availableUbicaciones = [] para mantener valores previos si hay alguno
        
        // Notificar al usuario del error
        await import("sweetalert2").then((Swal) => {
          Swal.default.fire({
            toast: true,
            position: "bottom-right",
            icon: "error",
            title: "Error al cargar ubicaciones",
            text: "No se pudieron cargar las ubicaciones disponibles. Intente nuevamente.",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        });
        
        throw error; // Re-lanzar el error para manejo externo
      }
    },
      async fetchTransportistas() {
      try {
        console.log("📡 Iniciando carga de transportistas...");
        const response = await apiClient.get("/api/transferencias/transportistas");
        this.transportistas = response.data.data || [];
        // Contar tipos de transportistas para logging
        const transportistas = this.transportistas.filter(t => t.tipoUsuarioId === 5).length;
        const bodegaTransportistas = this.transportistas.filter(t => t.tipoUsuarioId === 6).length;
        console.log(`✅ Transportistas cargados: ${this.transportistas.length} encontrados (${transportistas} transportistas, ${bodegaTransportistas} bodega-transportistas)`);
        return this.transportistas;
      } catch (error) {
        console.error("❌ Error cargando transportistas:", error);
        // No establecemos this.transportistas = [] para mantener los valores previos si hay alguno
        
        // Notificar al usuario del error
        await import("sweetalert2").then((Swal) => {
          Swal.default.fire({
            toast: true,
            position: "bottom-right",
            icon: "error",
            title: "Error al cargar transportistas",
            text: "No se pudieron cargar los transportistas. Intente nuevamente.",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        });
        
        throw error; // Re-lanzar el error para manejo externo
      }
    },showDetalleModal() {      this.$refs.detalleModal.show();
    },      closeDetalle() {
      this.$refs.detalleModal.hide();
      this.$refs.detalleModal.resetFields();
      this.selectedTransferencia = null;
      this.detalle = null;
      this.isLoadingModal = false; // Resetear estado de loading
      this.hasModalError = false; // Resetear estado de error
    },
    
    // Método para reintentar cargar los datos del modal
    async retryLoadModal() {
      if (this.selectedTransferencia) {
        await this.seleccionarTransferencia(this.selectedTransferencia);
      }
    },
    
    async cambiarEstado() {
      try {
        if (this.botonDisabled) {
          alert("No puedes avanzar de estado, otro rol debe intervenir.");
          return;
        }

        const accion = this.estadoPermitido?.toLowerCase() || "";
        
        // Pequeña pausa para asegurar que los datos del modal se han sincronizado
        await new Promise(resolve => setTimeout(resolve, 50));
          // Si la acción es asignar a transportador, validamos que los campos requeridos estén completos.
        if (accion === "asignado a transportador") {
          // Obtener valores actuales del modal para asegurar sincronización
          const modalData = {
            selectedTransportistaId: this.selectedTransportistaId || this.$refs.detalleModal?.selectedTransportistaId,
            transportista: this.transportista || this.$refs.detalleModal?.transportista,
            documentoIdentidad: this.documentoIdentidad || this.$refs.detalleModal?.documentoIdentidad,
            placa: this.placa || this.$refs.detalleModal?.placa
          };          
          // console.log('Validando campos para asignación a transportador:', {
          //   padre: {
          //     selectedTransportistaId: this.selectedTransportistaId,
          //     transportista: this.transportista,
          //     documentoIdentidad: this.documentoIdentidad,
          //     placa: this.placa
          //   },
          //   modal: {
          //     selectedTransportistaId: this.$refs.detalleModal?.selectedTransportistaId,
          //     transportista: this.$refs.detalleModal?.transportista,
          //     documentoIdentidad: this.$refs.detalleModal?.documentoIdentidad,
          //     placa: this.$refs.detalleModal?.placa
          //   },
          //   merged: modalData
          // });
          
          if (!modalData.selectedTransportistaId || !modalData.transportista || !modalData.documentoIdentidad || !modalData.placa) {            const camposFaltantes = [];
            if (!modalData.selectedTransportistaId) camposFaltantes.push('Transportista');
            if (!modalData.documentoIdentidad) camposFaltantes.push('Documento de identidad');
            if (!modalData.placa) camposFaltantes.push('Placa');
            
            await import("sweetalert2").then((Swal) => {
              Swal.default.fire({
                toast: true,
                position: "bottom-right",
                icon: "warning",
                title: "Campos incompletos",
                text: `Por favor, complete los siguientes campos: ${camposFaltantes.join(', ')}.`,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
              });
            });
            return;
          }        }

        // Sincronizar valores del modal antes de continuar
        if (this.$refs.detalleModal) {
          this.selectedTransportistaId = this.$refs.detalleModal.selectedTransportistaId || this.selectedTransportistaId;
          this.transportista = this.$refs.detalleModal.transportista || this.transportista;
          this.documentoIdentidad = this.$refs.detalleModal.documentoIdentidad || this.documentoIdentidad;
          this.placa = this.$refs.detalleModal.placa || this.placa;
          this.sticker = this.$refs.detalleModal.sticker || this.sticker;
          this.observaciones = this.$refs.detalleModal.observaciones || this.observaciones;
        }

        let asignaciones = [];
        
        // Si la acción es 'completado', preparar las asignaciones para enviar al SP_ScanQR
        if (accion === "completado") {
          console.log("🎯 DEBUG cambiarEstado - Procesando acción 'completado'");
          console.log("📋 Estado actual del detalle antes de filtrar:", this.detalle);
          
          const ubicacionesParaAsignar = this.detalle
            .filter((d) => d.nuevaUbicacionId)
            .map((d) => ({
              detalleId: d.id,
              ubicacionId: d.nuevaUbicacionId,
            }));
          
          console.log("🔍 DEBUG cambiarEstado - Ubicaciones para asignar:", ubicacionesParaAsignar);
          console.log("📊 Total de ubicaciones para asignar:", ubicacionesParaAsignar.length);
          
          // Validar que hay asignaciones antes de proceder
          if (ubicacionesParaAsignar.length === 0) {
            await import("sweetalert2").then((Swal) => {
              Swal.default.fire({
                icon: "warning",
                title: "Asignaciones requeridas",
                text: "Debe asignar ubicaciones a todas las cajas antes de completar la transferencia.",
                confirmButtonText: "Entendido"
              });
            });
            return;
          }
          
          // Asignar las ubicaciones para enviar al SP_ScanQR
          asignaciones = ubicacionesParaAsignar;
          console.log("🎯 DEBUG cambiarEstado - Asignaciones que se enviarán a scanQR:", asignaciones);
        }
        
        const idUsuario = this.authStore.user?.id;
        const body = {
          qrToken: `solicitud_${this.selectedTransferencia.id}`,
          accion,
          modulo: this.selectedTransferencia.modulo,
          usuarioId: idUsuario,
          clienteId: this.selectedTransferencia.clienteId,
          asignaciones,
          transportista: this.transportista,
          documentoIdentidad: this.documentoIdentidad,
          placa: this.placa,
          sticker: this.sticker || '',
          observaciones: this.observaciones || '', // Observaciones del cambio de estado
        };

        console.log("🚀 DEBUG cambiarEstado - Body completo que se enviará a scanQR:", body);
        console.log("🔍 DEBUG cambiarEstado - Detalles de asignaciones en el body:", {
          asignaciones: body.asignaciones,
          esArray: Array.isArray(body.asignaciones),
          longitud: Array.isArray(body.asignaciones) ? body.asignaciones.length : 'N/A',
          tipo: typeof body.asignaciones
        });
        
        const response = await apiClient.post("/api/transferencias/qr/scan", body);
        // console.log("Cambio de estado después:", response.data);
        this.selectedTransferencia.estado = response.data.NuevoEstado || accion;
        await this.fetchTransferencias();
        this.closeDetalle();
      } catch (error) {
        console.error("Error al cambiar estado:", error);
      }
    },

    // Método para recargar solo los transportistas
    async reloadTransportistas() {
      try {
        await import("sweetalert2").then((Swal) => {
          const toast = Swal.default.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          toast.fire({
            icon: "info",
            title: "Recargando transportistas..."
          });
        });
        
        await this.fetchTransportistas();
        
        // Notificación de éxito
        await import("sweetalert2").then((Swal) => {
          const toast = Swal.default.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          toast.fire({
            icon: "success",
            title: `${this.transportistas.length} transportistas cargados`
          });
        });
      } catch (error) {
        console.error("Error al recargar transportistas:", error);
      }
    },
    
    // Método para recargar solo las ubicaciones
    async reloadUbicaciones() {
      try {
        await import("sweetalert2").then((Swal) => {
          const toast = Swal.default.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          toast.fire({
            icon: "info",
            title: "Recargando ubicaciones..."
          });
        });
        
        await this.fetchUbicacionesDisponibles();
        
        // DEBUG: Mostrar el array de asignaciones que se pasará al scanQR
        console.log("🔍 DEBUG - Comprobar ubicaciones clickeado");
        console.log("📋 Estado actual del detalle:", this.detalle);
        
        const ubicacionesParaAsignar = this.detalle
          ?.filter((d) => d.nuevaUbicacionId)
          .map((d) => ({
            detalleId: d.id,
            ubicacionId: d.nuevaUbicacionId,
          })) || [];
        
        console.log("🎯 Array de asignaciones que se pasará al scanQR:", ubicacionesParaAsignar);
        console.log("📊 Total de asignaciones preparadas:", ubicacionesParaAsignar.length);
        
        if (ubicacionesParaAsignar.length === 0) {
          console.warn("⚠️ ADVERTENCIA: El array de asignaciones está vacío. Esto causará el error 400 en scanQR.");
        }
        
        // Notificación de éxito
        await import("sweetalert2").then((Swal) => {
          const toast = Swal.default.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          toast.fire({
            icon: "success",
            title: `${this.availableUbicaciones.length} ubicaciones cargadas`
          });
        });
      } catch (error) {
        console.error("Error al recargar ubicaciones:", error);
      }
    },

    // Método para aplicar las asignaciones del Excel al detalle
    async aplicarAsignacionesExcel(asignaciones) {
      console.log("📊 DEBUG aplicarAsignacionesExcel - Asignaciones recibidas:", asignaciones);
      console.log("📋 DEBUG aplicarAsignacionesExcel - Estado actual del detalle:", this.detalle);
      
      // Actualizar el detalle con las asignaciones del Excel
      asignaciones.forEach(asignacion => {
        const detalleItem = this.detalle.find(d => d.id === asignacion.detalleId);
        if (detalleItem) {
          detalleItem.nuevaUbicacionId = asignacion.ubicacionId;
          console.log(`✅ Asignación aplicada: Detalle ${asignacion.detalleId} -> Ubicación ${asignacion.ubicacionId} (${asignacion.codigo})`);
        } else {
          console.warn(`⚠️ No se encontró detalle con ID ${asignacion.detalleId}`);
        }
      });
      
      console.log("📋 DEBUG aplicarAsignacionesExcel - Estado del detalle después de aplicar asignaciones:", this.detalle);
      
      // Mostrar notificación de éxito
      await import("sweetalert2").then((Swal) => {
        Swal.default.fire({
          icon: "success",
          title: "Asignaciones aplicadas",
          text: `Se aplicaron ${asignaciones.length} asignaciones desde el Excel`,
          timer: 3000,
          showConfirmButton: false
        });
      });
      
      // Recargar las ubicaciones disponibles para reflejar los cambios
      await this.fetchUbicacionesDisponibles();
    },
  }, mounted() {
    this.fetchTransferencias();
    this.cargarTransportistas(); // Cargar transportistas al inicializar el componente
  },
};
</script>

<style scoped>
.container-fluid {
  padding: 1rem;
}

.card {
  margin-bottom: 1.5rem;
}

.table th,
.table td {
  vertical-align: middle;
}

.nav-tabs .nav-link.active,
.nav-pills .nav-link.active {
  font-weight: 600;
}

.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: scale(1.02);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.input-disabled {
  background-color: #e9ecef;
  opacity: 0.8;
  cursor: not-allowed;
  color: #6c757d;
  border-color: #ced4da;
  box-shadow: none;
}

.input-disabled:hover {
  cursor: not-allowed;
}

/* Estilos para la tabla con encabezado fijo */
.table-container {
  max-height: calc(100vh - 290px);
  /* Altura máxima del contenedor de la tabla */
  overflow-y: auto;
  /* Habilita el scroll vertical si es necesario */
}

.table-sticky-header th {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa;
  /* Color de fondo del encabezado */
  border-bottom: 2px solid #dee2e6;
  /* Línea inferior del encabezado */
}
</style>
