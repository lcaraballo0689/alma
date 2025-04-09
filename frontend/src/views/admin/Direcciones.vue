<template>
  <div class="container-fluid p-0 m-0">
    <!-- Sección adicional: Card que contiene la tabla y el botón "Nueva Dirección" -->
    <div class="row m-0 p-0">
      <div class="col-md-12 m-0 p-0">
        <div class="card m-0 p-0">
          <!-- Card Header -->
          <!-- Card Header -->
          <div class="card-header d-flex align-items-center justify-content-between">
            <!-- Select con ícono -->
            <div class="input-group filter-select-container">
              <span class="input-group-text bg-white border-0">
                <i class="bx bx-filter-alt"></i>
              </span>
              <select v-model="selectedClientFilter" class="form-select form-select-filter">
                <option value="">Todos</option>
                <option v-for="cl in clientes" :key="cl.id" :value="cl.id">
                  {{ cl.nombre }}
                </option>
              </select>
            </div>

            <!-- Botón "Nueva Dirección" -->
            <button class="buttons-actions"  @click="openModal()">
              <i class="bx bx-plus-circle me-1"></i> Nueva Dirección
            </button>
          </div>


          <!-- Card Body: Tabla de Direcciones -->
          <div class="card-body m-0 p-0">
            <div class="table-responsive">
              <table class="table table-bordered align-middle">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Alias</th>
                    <th>Dirección (Guardada)</th>
                    <th>Cliente</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Loading -->
                  <tr v-if="loading">
                    <td colspan="7" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                  <!-- Sin direcciones -->
                  <tr v-else-if="filteredDirecciones.length === 0">
                    <td colspan="7" class="text-center text-muted py-4">
                      No hay direcciones registradas.
                    </td>
                  </tr>
                  <!-- Direcciones Filtradas -->
                  <tr v-else v-for="dir in filteredDirecciones" :key="dir.id">
                    <td>{{ dir.id }}</td>
                    <td>{{ dir.alias }}</td>
                    <td>{{ dir.direccion }}</td>
                    <td>{{ getClienteNombre(dir.clienteId) }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-warning me-2" @click="openModal(dir)">
                        <i class="bx bx-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-danger" @click="deleteDireccion(dir.id)">
                        <i class="bx bx-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <!-- Fin Card Body -->
        </div>
      </div>
    </div>

    <!-- Modal: Direcciones con Mapa -->
    <div class="modal fade" ref="direccionModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form @submit.prevent="saveDireccion">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isEditing ? 'Editar Dirección' : 'Nueva Dirección' }}
              </h5>
              <button type="button" class="btn-close" @click="closeModal" aria-label="Cerrar"></button>
            </div>

            <!-- Modal Body en dos columnas -->
            <div class="modal-body">
              <div class="row g-3">
                <!-- Columna Izquierda -->
                <div class="col-md-6">
                  <!-- Alias -->
                  <label class="form-label">Alias</label>
                  <input type="text" class="form-control mb-2" v-model="currentDireccion.alias"
                    placeholder="Ej: Casa, Bodega 1, etc." />

                  <!-- Dirección Original -->
                  <label class="form-label">Dirección (Original)</label>
                  <input type="text" class="form-control mb-2" v-model="currentDireccion.direccionOriginal"
                    @change="geocodeAddress" placeholder="Ej: cra 72b #22a-85" />

                  <!-- Dirección Sugerida -->
                  <label class="form-label">Dirección Sugerida</label>
                  <div class="input-group mb-2">
                    <input type="text" class="form-control" v-model="currentDireccion.direccionSugerida"
                      placeholder="(Vacío si no hay sugerencia)" disabled />
                    <button class="btn btn-outline-success" type="button" @click="aplicarSugerencia"
                      :disabled="!currentDireccion.direccionSugerida" title="Aplicar la dirección sugerida">
                      Usar Sugerida
                    </button>
                  </div>

                  <!-- Cliente -->
                  <label class="form-label">Cliente</label>
                  <input type="text" class="form-control mb-2" v-model="clienteFiltro"
                    placeholder="Buscar cliente..." />
                  <select class="form-select" v-model="currentDireccion.clienteId" required>
                    <option disabled value="">Seleccione un cliente</option>
                    <option v-for="cliente in clientesFiltrados" :key="cliente.id" :value="cliente.id">
                      {{ cliente.nombre }} (ID: {{ cliente.id }})
                    </option>
                  </select>
                </div>

                <!-- Columna Derecha: Mapa -->
                <div class="col-md-6">
                  <label class="form-label">Ubicación en el mapa</label>
                  <div id="mapa-direccion" style="
                      width: 100%;
                      height: 300px;
                      border: 1px solid #ced4da;
                      border-radius: 8px;
                    "></div>

                  <!-- Campos ocultos lat/lng (solo si deseas verlos) -->
                  <input type="hidden" :value="currentDireccion.lat" />
                  <input type="hidden" :value="currentDireccion.lng" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                <i class="bx bx-x me-0"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-success" :disabled="isLoading">
                <i :class="isEditing ? 'bx bx-edit-alt me-1' : 'bx bx-save me-1'"></i>
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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Modal } from 'bootstrap';
import apiClient from '@/services/api'; // Ajusta la ruta a tu gusto
import Swal from 'sweetalert2';

export default {
  name: 'DireccionesMap',
  data() {
    return {
      // Listados
      direcciones: [],
      clientes: [],
      // Estados
      loading: false,    // Spinner de la tabla
      isEditing: false,  // Estado de edición en el modal
      isLoading: false,  // Spinner del botón Guardar
      // Filtros
      clienteFiltro: '',         // Filtro del SELECT en el modal
      selectedClientFilter: '',  // Filtro del SELECT en el card-header
      // Modal
      modalInstance: null,
      // Mapa
      map: null,
      marker: null,
      // Direccion actual con 2 campos extra: direccionOriginal y direccionSugerida
      currentDireccion: {
        id: null,
        alias: '',
        direccionOriginal: '',
        direccionSugerida: '',
        clienteId: '',
        lat: null,
        lng: null
      }
    };
  },
  computed: {
    // Filtra los clientes en el modal de acuerdo a "clienteFiltro"
    clientesFiltrados() {
      const query = this.clienteFiltro.toLowerCase();
      return this.clientes.filter(c => c.nombre.toLowerCase().includes(query));
    },
    // Filtra las direcciones que se muestran en la tabla principal
    filteredDirecciones() {
      // Si no se selecciona ningún cliente => mostrar todas
      if (!this.selectedClientFilter) {
        return this.direcciones;
      } else {
        // Filtrar direcciones por clienteId
        // Convierte si es string, ya que clienteId puede ser entero
        const selectedId = parseInt(this.selectedClientFilter, 10);
        return this.direcciones.filter(d => d.clienteId === selectedId);
      }
    }
  },
  methods: {
    /* ========== Cargar datos al montar ========== */
    async loadDirecciones() {
      this.loading = true;
      try {
        const res = await apiClient.get('/api/direcciones');
        this.direcciones = res.data;
      } catch (error) {
        console.error('Error al cargar direcciones:', error);
      } finally {
        this.loading = false;
      }
    },
    async loadClientes() {
      try {
        const res = await apiClient.get('/api/clientes');
        this.clientes = res.data;
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    },

    /* ========== Tabla de direcciones ========== */
    getClienteNombre(clienteId) {
      const cliente = this.clientes.find(c => c.id === clienteId);
      return cliente ? cliente.nombre : '—';
    },
    async deleteDireccion(id) {
      const confirm = await Swal.fire({
        title: '¿Eliminar dirección?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (confirm.isConfirmed) {
        try {
          await apiClient.delete(`/api/direcciones/${id}`);
          await this.loadDirecciones();
          Swal.fire('Eliminada', 'Dirección eliminada correctamente', 'success');
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar la dirección', 'error');
        }
      }
    },

    /* ========== Modal ========== */
    async openModal(direccion = null) {
      this.resetForm();
      if (direccion) {
        // Copia los datos del registro existente
        this.currentDireccion = {
          id: direccion.id,
          alias: direccion.alias || '',
          // Guardamos la dirección como "original" en caso de edición
          direccionOriginal: direccion.direccion || '',
          direccionSugerida: '',
          clienteId: direccion.clienteId,
          lat: direccion.lat,
          lng: direccion.lng
        };
        this.isEditing = true;
      } else {
        this.isEditing = false;
      }
      // Instancia del modal
      if (!this.modalInstance) {
        this.modalInstance = new Modal(this.$refs.direccionModal, { backdrop: 'static' });
      }
      this.modalInstance.show();

      // Espera la animación del modal y luego inicializa/ajusta el mapa
      this.$nextTick(() => {
        setTimeout(this.initMap, 300);
        if (this.currentDireccion.lat && this.currentDireccion.lng) {
          this.setMapMarker(this.currentDireccion.lat, this.currentDireccion.lng);
          this.map.setView([this.currentDireccion.lat, this.currentDireccion.lng], 16);
        }
      });
    },
    closeModal() {
      this.modalInstance?.hide();
    },
    resetForm() {
      this.currentDireccion = {
        id: null,
        alias: '',
        direccionOriginal: '',
        direccionSugerida: '',
        clienteId: '',
        lat: null,
        lng: null
      };
      this.clienteFiltro = '';
      // Limpiar marcador
      if (this.marker) {
        this.map?.removeLayer(this.marker);
        this.marker = null;
      }
    },

    /* ========== Guardar (Crear o Editar) ========== */
    async saveDireccion() {
      this.isLoading = true;
      try {
        // Decisión: la dirección “real” que guardarás en el backend
        // es la “original” (lo que el usuario decidió) o podrías
        // cambiarla a “direccionSugerida”.
        const finalDireccion = this.currentDireccion.direccionOriginal || '';

        // Prepara objeto para enviar al backend:
        const payload = {
          id: this.currentDireccion.id,
          alias: this.currentDireccion.alias,
          direccion: finalDireccion,
          clienteId: this.currentDireccion.clienteId,
          lat: this.currentDireccion.lat,
          lng: this.currentDireccion.lng
        };

        if (this.isEditing && this.currentDireccion.id) {
          // Actualiza
          await apiClient.put(`/api/direcciones/${this.currentDireccion.id}`, payload);
          Swal.fire('Actualizada', 'Dirección actualizada con éxito', 'success');
        } else {
          // Crea
          const res = await apiClient.post('/api/direcciones', payload);
          payload.id = res.data.id;
          Swal.fire('Creada', 'Dirección creada con éxito', 'success');
        }
        // Actualiza tabla y cierra modal
        await this.loadDirecciones();
        this.closeModal();
      } catch (error) {
        console.error('Error al guardar dirección:', error);
        Swal.fire('Error', 'No se pudo guardar la dirección', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    /* ========== Aplicar sugerencia ========== */
    aplicarSugerencia() {
      if (!this.currentDireccion.direccionSugerida) return;
      // Confirmar con SweetAlert si lo deseas
      Swal.fire({
        title: '¿Reemplazar dirección original?',
        text: `Dirección sugerida:\n${this.currentDireccion.direccionSugerida}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reemplazar',
        cancelButtonText: 'No, mantener original'
      }).then(result => {
        if (result.isConfirmed) {
          this.currentDireccion.direccionOriginal = this.currentDireccion.direccionSugerida;
          Swal.fire('Hecho', 'Usarás la dirección sugerida', 'success');
        }
      });
    },

    /* ========== Mapa Leaflet ========== */
    initMap() {
      if (this.map) {
        this.map.invalidateSize();
        return;
      }
      this.map = L.map('mapa-direccion').setView([4.60971, -74.08175], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      // Escuchar clic en el mapa => mover marcador => reverseGeocode
      this.map.on('click', this.onMapClick);
    },
    onMapClick(e) {
      const { lat, lng } = e.latlng;
      this.currentDireccion.lat = lat;
      this.currentDireccion.lng = lng;
      this.setMapMarker(lat, lng);
      this.reverseGeocode(lat, lng);
    },
    setMapMarker(lat, lng) {
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }
      // Marcador arrastrable
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

      // Si arrastran => actualiza lat/lng en tiempo real
      this.marker.on('dragend', () => {
        const pos = this.marker.getLatLng();
        this.currentDireccion.lat = pos.lat;
        this.currentDireccion.lng = pos.lng;
        // Re-geocodifica si quieres
        this.reverseGeocode(pos.lat, pos.lng, false);
      });
    },

    /* ========== Reverse Geocode (coordenadas -> direcciónSugerida) ========== */
    async reverseGeocode(lat, lng, overwrite = true) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          // Ponemos la dirección “sugerida” para que no sobrescriba la original sin confirmación
          this.currentDireccion.direccionSugerida = data.display_name;
          if (overwrite) {
            // Si quisiéramos sobrescribir directamente la original, hazlo:
            // this.currentDireccion.direccionOriginal = data.display_name;
          }
        }
      } catch (error) {
        console.error('Error en reverseGeocode:', error);
      }
    },

    /* ========== Geocodificación (direcciónOriginal -> coordenadas) ========== */
    normalizeDireccion(direccion) {
      return direccion
        .toLowerCase()
        .replace(/\bcra\b/g, 'carrera')
        .replace(/\bcll\b/g, 'calle')
        .replace(/[#$-]/g, ' ')
        .replace(/\bno\.?/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    },
    async geocodeAddress() {
      if (!this.currentDireccion.direccionOriginal) return;
      try {
        let query = this.normalizeDireccion(this.currentDireccion.direccionOriginal);
        if (!query.includes('bogotá')) query += ' bogotá';
        if (!query.includes('colombia')) query += ' colombia';

        console.log('Buscando dirección:', query);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        console.log('Respuesta geocodificación:', data);

        if (data.length > 0) {
          const { lat, lon, display_name } = data[0];
          this.currentDireccion.lat = parseFloat(lat);
          this.currentDireccion.lng = parseFloat(lon);
          this.currentDireccion.direccionSugerida = display_name; // la sugerencia textual
          // Ajustar mapa
          this.map.setView([lat, lon], 16);
          this.setMapMarker(lat, lon);
        } else {
          console.warn('No se encontró ninguna coincidencia');
          this.currentDireccion.direccionSugerida = '';
        }
      } catch (error) {
        console.error('Error al geocodificar dirección:', error);
      }
    }
  },
  mounted() {
    this.loadDirecciones();
    this.loadClientes();
  }
};
</script>

<style scoped>
#mapa-direccion {
  width: 100%;
  height: 300px;
  border: 1px solid #ced4da;
  border-radius: 8px;
}

/* Contenedor del select con estilo redondeado */
.filter-select-container {
  border-radius: 2rem;
  /* esquinas redondeadas */
  overflow: hidden;
  /* oculta bordes internos */
  border: 1px solid #ced4da;
  /* borde exterior */
  background-color: #fff;
  /* fondo */
  transition: all 0.2s ease-in-out;
  width: 300px;
  /* Ajusta el ancho a tu gusto */
}

/* El ícono y su fondo */
.input-group-text {
  background-color: transparent !important;
  /* para que no choque con .bg-white si aplicaste otra clase */
  border: none;
  border-right: 1px solid #ced4da;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  
}

/* El select con fondo transparente */
.form-select-filter {
  border: none;
  outline: none;
  box-shadow: none !important;
  background-color: transparent;
  border-radius: 0;
  /* quita esquinas del select interno */
  
}

/* Quita outline al enfocar */
.form-select-filter:focus {
  box-shadow: none !important;
  outline: none !important;
}

.buttons-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 41px;
  width: 150px;
  padding: 0 1rem;
  margin-top: 0;
  /* quita -10px */
  gap: 0.25rem;
  /* espacio entre icono y texto */
  font-weight: 500;
  font-size: 1rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease-in-out;
}
</style>
