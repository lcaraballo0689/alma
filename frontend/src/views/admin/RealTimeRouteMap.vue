<template>
    <div>
      <!-- Contenedor del mapa -->
      <div ref="mapContainer" style="height: 500px;"></div>
  
      <!-- ETA (tiempo estimado de llegada) -->
      <div class="mt-2" v-if="etaSeconds !== null">
        <strong>Tiempo estimado de llegada:</strong>
        {{ formatETA(etaSeconds) }}
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
    name: 'RealTimeRouteMap',
    props: {
      /** URL base del servidor Traccar o tu backend */
      baseApiUrl: {
        type: String,
        required: true,
        default: 'https://demo4.traccar.org'
      },
      /** Credenciales básicas: { username: '', password: '' } */
      auth: {
        type: Object,
        required: true,
        default: { username: 'lecmbogota@gmail.com', password: '960782506041989Sa.' }
      },
      /** ID del dispositivo a rastrear */
      deviceId: {
        type: Number,
        required: true,
        default: 5173
      },
      /** Latitud del destino */
      destinationLat: {
        type: Number,
        required: true,
        default: 4.6
      },
      /** Longitud del destino */
      destinationLon: {
        type: Number,
        required: true,
        default: -74.08
      },
      /** Intervalo de refresco en ms para actualizar la posición */
      refreshInterval: {
        type: Number,
        default: 100
      }
    },
    data() {
      return {
        map: null,
        routingControl: null,
        deviceMarker: null,
        devicePosition: null,
        etaSeconds: null, // Para almacenar la ETA (en segundos)
        refreshTimer: null
      };
    },
    methods: {
      /** Crea una instancia de axios con autenticación básica */
      axiosInstance() {
        return axios.create({
          baseURL: this.baseApiUrl,
          auth: this.auth
        });
      },
  
      /** Inicializa el mapa con Leaflet */
      initMap() {
        // Referencia al div del template con ref="mapContainer"
        const container = this.$refs.mapContainer;
        this.map = L.map(container).setView([4.6, -74.08], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
      },
  
      /** Obtiene la última posición del dispositivo desde la API de Traccar */
      loadDevicePosition() {
        this.axiosInstance().get('/api/positions', {
          params: {
            deviceId: this.deviceId,
            sort: 'id:desc',
            limit: 1
          }
        })
        .then(response => {
          if (response.data && response.data.length > 0) {
            const pos = response.data[0];
            const lat = pos.latitude;
            const lon = pos.longitude;
            this.devicePosition = { lat, lon };
            this.updateDeviceMarker(lat, lon);
            this.calculateRoute(); // Recalcula la ruta y la ETA
          }
        })
        .catch(error => {
          console.error(`Error obteniendo posición del deviceId=${this.deviceId}:`, error);
        });
      },
  
      /** Crea o actualiza el marcador del vehículo */
      updateDeviceMarker(lat, lon) {
        if (!this.map) return;
        const carIcon = L.divIcon({
          html: '<i class="bi bi-truck-front-fill text-success" style="font-size: 24px;"></i>',
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        });
  
        if (this.deviceMarker) {
          this.deviceMarker.setLatLng([lat, lon]);
        } else {
          this.deviceMarker = L.marker([lat, lon], { icon: carIcon }).addTo(this.map);
        }
      },
  
      /** Usa Leaflet Routing Machine para calcular la ruta y ETA */
      calculateRoute() {
        if (!this.devicePosition || this.destinationLat == null || this.destinationLon == null) {
          return;
        }
        const { lat, lon } = this.devicePosition;
  
        // Elimina el routingControl previo si existe
        if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
        }
  
        // Crea un nuevo control de ruteo
        this.routingControl = L.Routing.control({
          waypoints: [
            L.latLng(lat, lon),
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
            // Podrías personalizar los iconos de origen/destino
            return L.marker(waypoint.latLng, { draggable: false });
          },
          addWaypoints: false,
          draggableWaypoints: false,
          routeWhileDragging: false
        })
        .on('routesfound', (e) => {
          // Cuando se encuentra la ruta, se puede extraer la duración (seconds)
          const route = e.routes[0];
          if (route && route.summary) {
            // route.summary.totalTime está en segundos
            this.etaSeconds = route.summary.totalTime;
          }
        })
        .addTo(this.map);
      },
  
      /** Formatea la ETA en formato HH:MM:SS o similar */
      formatETA(seconds) {
        if (seconds <= 0) return '0 min';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
          return `${h}h ${m}m ${s}s`;
        } else if (m > 0) {
          return `${m}m ${s}s`;
        } else {
          return `${s}s`;
        }
      }
    },
    watch: {
      // Si cambian las props (destinationLat/destinationLon), recalculamos la ruta
      destinationLat() {
        this.calculateRoute();
      },
      destinationLon() {
        this.calculateRoute();
      }
    },
    mounted() {
      // Inicializamos el mapa
      this.initMap();
  
      // Cargamos la posición del dispositivo
      this.loadDevicePosition();
  
      // Refrescamos la posición cada X milisegundos
      this.refreshTimer = setInterval(() => {
        this.loadDevicePosition();
      }, this.refreshInterval);
    },
    beforeUnmount() {
      // Limpiamos el intervalo
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
    }
  };
  </script>
  
  <style scoped>
  /* Ajusta el estilo según tus preferencias */
  #mapContainer {
    width: 100%;
    height: 500px;
  }
  </style>
  