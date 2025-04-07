<template>
  <div class="container my-4">
    <!-- Navegación por pestañas -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="tab in tabs" :key="tab">
        <a 
          class="nav-link" 
          :class="{ active: selectedTab === tab }" 
          href="#" 
          @click.prevent="selectedTab = tab"
        >
          {{ tab }}
        </a>
      </li>
    </ul>

    <div>
      <!-- Pestaña: Mapa en Tiempo Real -->
      <div v-show="selectedTab === 'Mapa en Tiempo Real'">
        <div id="map" style="height: 500px;"></div>
      </div>
      
      <!-- Pestaña: Ruta Asignada -->
      <div v-show="selectedTab === 'Ruta Asignada'">
        <h2 class="mb-3">Ruta Asignada</h2>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="deviceSelect" class="form-label">Seleccione Dispositivo:</label>
            <select id="deviceSelect" class="form-select" v-model="selectedDeviceForRoute">
              <option disabled value="">Seleccione</option>
              <option v-for="device in devices" :key="device.id" :value="device.id">
                {{ device.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Destino Lat:</label>
            <input
              type="number"
              class="form-control"
              v-model.number="destinationLat"
              placeholder="Lat destino"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label">Destino Lon:</label>
            <input
              type="number"
              class="form-control"
              v-model.number="destinationLon"
              placeholder="Lon destino"
            />
          </div>
        </div>
        <button class="btn btn-primary mb-3" @click="showRoute">Mostrar Ruta</button>
        <div id="routeMap" style="height: 500px;"></div>
      </div>

      <!-- Pestaña: Enviar SMS -->
      <div v-show="selectedTab === 'Enviar SMS'">
        <h2 class="mb-3">Enviar SMS</h2>
        <div class="mb-3">
          <label class="form-label">Teléfono:</label>
          <input type="text" class="form-control" v-model="smsPhone" placeholder="Número de teléfono" />
        </div>
        <div class="mb-3">
          <label class="form-label">Mensaje:</label>
          <textarea class="form-control" v-model="smsMessage" placeholder="Escriba su mensaje"></textarea>
        </div>
        <button class="btn btn-success" @click="sendSms">Enviar SMS</button>
        <div v-if="smsResponse" class="mt-3">
          <strong>Respuesta:</strong> {{ smsResponse }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

export default {
  name: "TrackingComponent",
  data() {
    return {
      // Configuración de API y autenticación básica
      baseApiUrl: 'https://demo4.traccar.org',
      auth: {
        username: 'lecmbogota@gmail.com',
        password: '960782506041989Sa.'
      },
      // Pestañas disponibles
      tabs: ['Mapa en Tiempo Real', 'Ruta Asignada', 'Enviar SMS'],
      selectedTab: 'Mapa en Tiempo Real',

      // Dispositivos y sus marcadores
      devices: [],
      markers: {},

      // Mapa en Tiempo Real
      map: null,

      // Datos para la pestaña de Ruta Asignada
      selectedDeviceForRoute: '',
      destinationLat: null,
      destinationLon: null,
      routeMap: null,
      routingControl: null,

      // Datos para enviar SMS
      smsPhone: '',
      smsMessage: '',
      smsResponse: '',

      refreshInterval: null
    };
  },
  methods: {
    axiosInstance() {
      return axios.create({
        baseURL: this.baseApiUrl,
        auth: this.auth
      });
    },
    // Cargar la lista de dispositivos
    loadDevices() {
      this.axiosInstance().get('/api/devices', { params: { all: true } })
        .then(response => {
          this.devices = response.data;
          // Para cada dispositivo, cargar su última posición y crear marcador
          this.devices.forEach(device => {
            this.loadDevicePosition(device);
          });
        })
        .catch(error => {
          console.error("Error cargando dispositivos:", error);
        });
    },
    // Obtener la última posición de un dispositivo y actualizar su marcador
    loadDevicePosition(device) {
      this.axiosInstance().get('/api/positions', {
        params: {
          deviceId: device.id,
          sort: 'id:desc',
          limit: 1
        }
      }).then(response => {
        if (response.data && response.data.length > 0) {
          const pos = response.data[0];
          this.updateMarker(device, pos.latitude, pos.longitude);
        }
      }).catch(error => {
        console.error(`Error obteniendo posición para deviceId=${device.id}:`, error);
      });
    },
    // Obtener icono de vehículo usando Bootstrap Icons
    getCarIcon() {
      return L.divIcon({
        html: '<i class="bi bi-truck-front-fill text-primary" style="font-size: 24px;"></i>',
        className: '',
        iconSize: [30, 0],
        iconAnchor: [24, 28]
      });
    },
    updateMarker(device, lat, lon) {
      if (!this.map) return;
      const carIcon = this.getCarIcon();
      if (this.markers[device.id]) {
        this.markers[device.id].setLatLng([lat, lon]);
      } else {
        const marker = L.marker([lat, lon]).addTo(this.map);
        marker.bindPopup(`<strong>${device.name}</strong>`);
        this.markers[device.id] = marker;
      }
    },
    refreshPositions() {
      this.devices.forEach(device => this.loadDevicePosition(device));
    },
    // Inicializar mapa en Tiempo Real
    initRealTimeMap() {
      this.map = L.map('map').setView([4.6, -74.08], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    },
    // Inicializar mapa para Ruta Asignada
    initRouteMap() {
      if (document.getElementById('routeMap')) {
        this.routeMap = L.map('routeMap').setView([4.6, -74.08], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.routeMap);
      }
    },
    // Iconos para origen y destino (Bootstrap Icons)
    getOriginIcon() {
      return L.divIcon({
        html: '<i class="bi bi-geo-alt-fill text-success" style="font-size: 24px;"></i>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
    },
    getDestinationIcon() {
      return L.divIcon({
        html: '<i class="bi bi-geo-alt text-danger" style="font-size: 24px;"></i>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
    },
    // Mostrar la ruta calculada usando Leaflet Routing Machine (con perfil 'driving')
    showRoute() {
      if (!this.selectedDeviceForRoute || this.destinationLat == null || this.destinationLon == null) {
        alert("Seleccione un dispositivo y especifique las coordenadas de destino");
        return;
      }
      const marker = this.markers[this.selectedDeviceForRoute];
      if (!marker) {
        alert("No se encontró la posición actual del dispositivo seleccionado");
        return;
      }
      const currentPos = marker.getLatLng();
      if (!this.routeMap) {
        this.initRouteMap();
      }
      if (this.routingControl) {
        this.routeMap.removeControl(this.routingControl);
      }
      this.routingControl = L.Routing.control({
        waypoints: [
          L.latLng(currentPos.lat, currentPos.lng),
          L.latLng(this.destinationLat, this.destinationLon)
        ],
        lineOptions: {
          styles: [{ color: 'red', opacity: 0.8, weight: 5 }]
        },
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
          steps: true
        }),
        createMarker: (i, waypoint, n) => {
          if (i === 0) {
            return L.marker(waypoint.latLng, { icon: this.getOriginIcon(), draggable: false });
          } else if (i === n - 1) {
            return L.marker(waypoint.latLng, { icon: this.getDestinationIcon(), draggable: false });
          } else {
            return L.marker(waypoint.latLng, { draggable: false });
          }
        },
        addWaypoints: false,
        draggableWaypoints: false,
        routeWhileDragging: false
      }).addTo(this.routeMap);
    },
    // Enviar SMS usando la API HTTP SMS de Traccar
    sendSms() {
      if (!this.smsPhone || !this.smsMessage) {
        alert("Ingrese el número de teléfono y el mensaje");
        return;
      }
      // Se asume que la API SMS de Traccar se invoca mediante una petición GET
      this.axiosInstance().get('/api/sms', {
        params: {
          phone: this.smsPhone,
          message: this.smsMessage
        }
      })
      .then(response => {
        this.smsResponse = "SMS enviado correctamente";
      })
      .catch(error => {
        console.error("Error enviando SMS:", error);
        this.smsResponse = "Error al enviar SMS";
      });
    }
  },
  watch: {
    selectedTab(newTab) {
      if (newTab === 'Mapa en Tiempo Real' && this.map) {
        this.$nextTick(() => {
          this.map.invalidateSize();
        });
      }
      if (newTab === 'Ruta Asignada') {
        this.$nextTick(() => {
          this.initRouteMap();
          if (this.routeMap) {
            this.routeMap.invalidateSize();
          }
        });
      }
    }
  },
  mounted() {
    this.initRealTimeMap();
    this.loadDevices();
    this.refreshInterval = setInterval(this.refreshPositions, 10000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
};
</script>

<style scoped>
.nav-tabs .nav-link {
  cursor: pointer;
}
#map, #routeMap {
  height: 500px;
}
</style>
