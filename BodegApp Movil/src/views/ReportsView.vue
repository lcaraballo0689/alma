<template>
  <v-app>
    <v-main>
      <v-container class="pa-0 m-0" fluid style="background-color: whitesmoke;">


        <!-- <v-tabs v-model="tab" bg-color="grey-lighten-2" dark color="black" slider-color="red" class="mb-2"
            style="position: fixed; top: 56px; width: 100%; z-index: 10; overflow: hidden;">

            <v-tab value="Scan">
              <Icon icon="ri:qr-scan-line" color="red" width="32" height="32" />
            </v-tab>
            <v-tab value="Pendientes">Asignadas</v-tab>
            <v-tab value="Completadas">Completadas</v-tab>
            <v-tab value="procesar">procesar</v-tab>

          </v-tabs> -->



        <v-tabs-window v-model="tab"
          style="position: fixed;  height: calc(100vh - 56px); width: 100vw; overflow-y: auto; background-color: whitesmoke;">

          <v-tabs-window-item value="Pendientes">
            <v-list style="background-color: whitesmoke; height: calc(100vh - 100px);">

              <v-list-item v-show="loadTranfers && !seeDetails" class="mb-2" v-for="item in skeleton" :key="item.id">
                <v-list-item-content>
                  <v-card outlined width="90vw" class="pa-3">
                    <v-list-item-title class="text-h6 mb-1">
                      <v-skeleton-loader :loading="active" type="heading" class="mb-2" />
                    </v-list-item-title>
                    <v-list-item-subtitle class="mb-1">
                      <v-skeleton-loader :loading="active" type="text" class="mb-2" />
                    </v-list-item-subtitle>
                    <v-list-item-subtitle class="mb-1">
                      <v-skeleton-loader :loading="active" type="text" class="mb-2" />
                    </v-list-item-subtitle>
                  </v-card>
                </v-list-item-content>
              </v-list-item>


                <v-list-item v-show="!loadTranfers && !seeDetails"
                v-for="(item, index) in (transferencias.data || []).filter(item => 
                  allowedStates.includes(item.estado) &&
                  item.transportista && 
                  item.transportista.toLowerCase() === useAuthStore.user.nombre.toLowerCase()
                )"
                :key="item.id">
                <v-list-item-content>
                  <v-card v-show="allowedStates.includes(item.estado)" class="pa-0 elevation-2" style="margin: 10px;">

                    <v-list-item-title
                      class="text-h6 text-truncate text-uppercase font-weight-bold elevation-2 pa-1 mb-4"
                      style="background-color: #E0E0E0; z-index: 2000;">
                      <div>
                        <v-row align="center" justify="space-between" dense>
                          <v-col cols="10" class="pa-0 px-2 pt-2 d-flex align-center">
                            <Icon icon="line-md:briefcase-filled" width="24" height="24" />
                            <span class="text-h6 text-truncate font-weight-medium ml-2">
                              <div :class="{ marquee: isOverflowing }" ref="clienteNombreRef">
                                {{ item.clienteNombre || 'Sin nombre' }}
                              </div>
                            </span>
                          </v-col>
                          <v-col cols="2" class="pa-0 px-2 pt-2 d-flex align-center justify-end">
                            <span class="text-h6  ml-2">
                              ID:
                              {{ item.id }}
                            </span>
                          </v-col>
                        </v-row>
                        <v-divider class="mb-2"></v-divider>
                        <v-row align="center" justify="space-between" dense>
                          <v-col cols="6" class="pa-0 px-2 mb-2 d-flex align-center">
                            <Icon icon="line-md:loading-loop" color="black" width="18" height="18" class="mr-1" />
                            <span class="text-caption">
                              {{ item.estado }}
                            </span>
                          </v-col>
                          <v-col cols="6" class="pa-0 px-2 mb-2 d-flex align-center justify-end">
                            <Icon icon="line-md:my-location-loop" width="24" height="24" />
                            <span class="text-caption text-truncate ml-1">
                              {{ item.direccion || 'Sin Asignar' }}
                            </span>
                          </v-col>
                        </v-row>
                      </div>
                    </v-list-item-title>
                    <div v-show="item.lat !== null && item.lat && item.lng" class="map-wrapper">
                      <div :id="'map-' + index" class="map-container"
                        @mounted="initializeMap('map-' + index, item.lat, item.lng, item.alias)"
                        @update:visible="map.invalidateSize()"></div>
                      <div class="map-buttons">
                        <v-btn color="black" icon @click="openInMaps(item.lat, item.lng)">
                          <Icon icon="mdi:google-maps" width="24" height="24" />
                        </v-btn>
                        <v-btn color="info" class="elevation-4" icon @click="openInWaze(item.lat, item.lng)">
                          <Icon icon="mdi:waze" width="24" height="24" />
                        </v-btn>
                      </div>
                    </div>
                    <div class="ma-4">

                      <div  class="mb-2">
                        <v-card-text>
                          <div class="d-flex align-center">
                            <Icon icon="line-md:alert-circle-twotone-loop" width="24" height="24" />
                            <h3 class="font-weight-bold ml-2">Informacion de la Solicitud:</h3>
                          </div>
                          <v-divider class="my-2"></v-divider>
                          <v-row dense align="center">
                            <v-col cols="6" class="font-weight-bold">Tipo de Solicitud:</v-col>
                            <v-col cols="6">{{ item.modulo }}</v-col>
                          </v-row>
                          <v-divider class="my-2"></v-divider>
                          <v-row dense align="center">
                            <v-col cols="6" class="font-weight-bold">Fecha Solicitud:</v-col>
                            <v-col cols="6">
                              {{ item.fechaSolicitud ? new Date(item.fechaSolicitud).toLocaleDateString() : 'N/A' }}
                            </v-col>
                          </v-row>
                          <v-divider class="my-2"></v-divider>
                            <v-row dense align="center">
                              <v-col cols="12" class="font-weight-bold">Observaciones:</v-col>
                              <v-col cols="12">
                                <v-card outlined style="max-height: 7.5em; overflow-y: auto; background-color: transparent;">
                                  <v-card-text style="white-space: pre-wrap;">
                                    {{ item.observaciones || 'Sin Observaciones' }}
                                  </v-card-text>
                                </v-card>
                              </v-col>
                            </v-row>
                          
                          <br>
                          <br>
                          <div class="d-flex align-center">
                            <Icon icon="line-md:person-filled"  width="24" height="24" />
                            <h3 class="font-weight-bold ml-2">Transportista:</h3>
                          </div>
                          
                          <v-divider class="my-2"></v-divider>
                          <v-row dense align="center">
                            <v-col cols="6" class="font-weight-bold">Asignado a:</v-col>
                            <v-col cols="6">{{ item.transportista || 'Sin Asignar' }}</v-col>
                          </v-row>
                          <v-divider class="my-2"></v-divider>
                          <v-row dense align="center">
                            <v-col cols="6" class="font-weight-bold">N° Documento:</v-col>
                            <v-col cols="6">{{ item.documentoIdentidad || 'Sin Asignar' }}</v-col>
                          </v-row>
                          <v-divider class="my-2"></v-divider>
                          <v-row dense align="center">
                            <v-col cols="6" class="font-weight-bold">Placa:</v-col>
                            <v-col cols="6">{{ item.placa || 'Sin Asignar' }}</v-col>
                          </v-row>
                          
                        </v-card-text>
                      </div>
                    </div>

                    <div class="py-4 pe-4 rounded-2 elevation-2" style="background-color: #EEEEEE;">

                      <v-list-item-action class="d-flex justify-end">
                        <v-btn color="black" variant="tonal" class="elevation-2" style="border-radius: 25px 25px 25px 25px ;"
                          @click="handleDetalle(item.id)"><Icon icon="line-md:watch-loop" width="24" height="24"  class="me-2"/>Detalles</v-btn>
                      </v-list-item-action>
                    </div>



                  </v-card>
                </v-list-item-content>
              </v-list-item>
              <v-list-item v-show="seeDetails">

                <TransferDetail :solicitudId="solicitudQr" @retornar="handleSeeDetails" />
              </v-list-item>
            </v-list>
          </v-tabs-window-item>

          <!-- <v-tabs-window-item value="Completadas">
            <v-list>
              <v-list-item v-for="report in transferencias.filter(r => r.estado === 'en proceso de entrega')"
                :key="report.id">
                <v-list-item-content>
                  <v-list-item-title>{{ report.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ report.description }}</v-list-item-subtitle>
                  <v-list-item-subtitle>{{ report.date }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-tabs-window-item> -->

          <!-- <v-tabs-window-item value="procesar">
              <entregas :solicitudId="solicitudQr" @close="showScan = true" />
            </v-tabs-window-item> -->

          <v-tabs-window-item value="Scan">
            <div class="d-flex flex-column align-center pa-0 text-black">

              <h2 v-if="showScan" class="text-center"> Escanear QR</h2>
              <QrScan v-if="showScan" @qr-detected="onQrDetected" />

              <v-btn v-show="!showScan && !loadingShow" @click="showScan = true" variant="tonal" color="red"
                @nuevo-scan="handleNewScan" class="my-4 mt-6">Escanear otro QR</v-btn>
              <p v-if="showScan" class="text-center mt-2">El código QR esté bien iluminado y enfocado.</p>

              <TransferDetail v-else :solicitudId="solicitudQr" @close="showScan = true"
                @showloader="loadingShow = $event" />
            </div>
          </v-tabs-window-item>
        </v-tabs-window>

        <v-row>




        </v-row>

      </v-container>

    </v-main>
  </v-app>
</template>

<script>

import QrScan from '@/components/scanQr.vue'
import TransferDetail from '@/components/TransferDetail.vue';
import entregas from '../components/entregas.vue';
import apiClient from '../services/api';
import { useAuthStore } from '../stores/auth';
export default {
  name: 'ReportsView',
  components: {
    QrScan,
    TransferDetail,
    entregas  // Aquí puedes importar otros componentes si es necesario 
  },
  data() {
    return {
      useAuthStore: useAuthStore(), // Almacena la tienda de autenticación
      seeDetails: false, // Variable para controlar la visibilidad del componente de detalles
      allowedStates: ['en proceso de entrega', 'asignado a transportador', 'en proceso de recolección', 'recogido'], // Add your allowed states here
      idDetalle: null, // Variable para almacenar el ID del detalle
      loadTranfers: false, // Variable para controlar el estado de carga de las transferencias
      loadingShow: true, // Variable para controlar el estado de carga
      tab: 'Pendientes',
      showScan: true,
      // Variable para controlar la visibilidad del escáner QR

      solicitudQr: 'nada',  // Variable para almacenar el contenido escaneado
      transferencias: [], // Variable para almacenar las transferencias
      reports: [],
      skeleton: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
        { id: 9 },
        { id: 10 }
      ],
      isOverflowing: false

    }
  },
  mounted() {
    this.getTransfers();
    this.checkOverflow();
    document.addEventListener('keydown', this.exitFullscreenOnEscape);
    this.initializeMap('map', this.latitude, this.longitude, this.alias); // Inicializa el mapa al montar el componente
    this.latitude = 0;
    this.longitude = 0;
    this.alias = '';
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.exitFullscreenOnEscape);
  },
  methods: {
    initializeMap(mapId, latitude, longitude, alias) {
      const checkMapElement = () => {
        const mapElement = document.getElementById(mapId);
        if (mapElement) {
          const map = L.map(mapId, {
            center: [latitude || 0, longitude || 0],
            zoom: 15,
            zoomControl: false, // Deshabilitar el control de zoom
            dragging: false, // Deshabilitar el arrastre
            scrollWheelZoom: false, // Deshabilitar el zoom con la rueda del ratón
            doubleClickZoom: false, // Deshabilitar el zoom con doble clic
            boxZoom: false, // Deshabilitar el zoom con caja
            keyboard: false, // Deshabilitar la interacción con el teclado
            touchZoom: false // Deshabilitar el zoom táctil
          });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          map.whenReady(() => {
            map.invalidateSize(); // Ajustar el tamaño del mapa después de la inicialización
          });

          if (latitude && longitude) {
            L.marker([latitude, longitude], {
              icon: L.divIcon({
                html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><mask id="lineMdMapMarkerAltFilledLoop0"><g fill="none" fill-opacity="0" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path fill="#fff" d="M12 20.5C12 20.5 11 19 11 18C11 17.5 11.5 17 12 17C12.5 17 13 17.5 13 18C13 19 12 20.5 12 20.5z"><animate fill="freeze" attributeName="d" dur="1.56s" keyTimes="0;0.7;1" values="M12 20.5C12 20.5 11 19 11 18C11 17.5 11.5 17 12 17C12.5 17 13 17.5 13 18C13 19 12 20.5 12 20.5z;M12 20.5C12 20.5 5 13 5 8C5 4.5 8 1 12 1C16 1 19 4.5 19 8C19 13 12 20.5 12 20.5z;M12 20.5C12 20.5 6 13.5 6 9C6 5.68629 8.68629 3 12 3C15.3137 3 18 5.68629 18 9C18 13.5 12 20.5 12 20.5z"/><animate fill="freeze" attributeName="fill-opacity" begin="1.95s" dur="1.95s" values="0;1"/><animateTransform attributeName="transform" dur="11.7s" keyTimes="0;0.3;0.4;0.54;0.6;0.68;0.7;1" repeatCount="indefinite" type="rotate" values="0 12 20.5;0 12 20.5;-8 12 20.5;0 12 20.5;5 12 20.5;-2 12 20.5;0 12 20.5;0 12 20.5"/></path><circle cx="12" cy="9" r="2.5" fill="#000" stroke="none"><animate fill="freeze" attributeName="fill-opacity" begin="3.9s" dur="1.95s" values="0;1"/></circle></g></mask><rect width="24" height="24" fill="currentColor" mask="url(#lineMdMapMarkerAltFilledLoop0)"/></svg>`,
                className: 'text-red',
                iconSize: [24, 24],
                popupAnchor: [0, -12]
              })
            }).addTo(map)
              .bindPopup(alias || 'Sin alias')
              .openPopup();
          }

          // Forzar actualización del tamaño cuando el contenedor se vuelve visible
          const observer = new MutationObserver(() => {
            if (mapElement.style.display !== 'none') {
              map.invalidateSize();
            }
          });
          observer.observe(mapElement, { attributes: true, attributeFilter: ['style'] });
        } else {
          console.warn(`El contenedor del mapa con ID: ${mapId} no está listo. Reintentando...`);
          setTimeout(checkMapElement, 100);
        }
      };

      checkMapElement();
    },
    async getTransfers() {
      try {
        const payload = {
          clienteId: null,
          estado: ""
        };
        this.loadTranfers = true; // Cambia el estado de carga a verdadero
        const response = await apiClient.post('/api/transferencias/consultar', payload);
        this.loadTranfers = false; // Cambia el estado de carga a falso
        this.transferencias = response.data; // Asigna la respuesta a la variable reports
        console.log(response.data);
      } catch (error) {
        this.loadTranfers = false; // Cambia el estado de carga a falso en caso de error
        console.error('Error al obtener las transferencias:', error);
      }
    },
    handleTransfer() {
      this.getTransfers(); // Llama a la función para obtener las transferencias al hacer clic en el botón
    },
    onQrDetected(code) {
      // code viene como solicitud_27 necesito dejar solo el numero 
      // Extraer solo el número de, por ejemplo, "solicitud_27"
      const match = code.match(/\d+$/);
      const numero = match ? match[0] : '';
      this.solicitudQr = numero;
      this.showScan = false;
      // buscar y mostrar tu reporte...
    },
    handleDetalle(ids) {
      this.seeDetails = true; // Cambia el estado de seeDetails a verdadero
      this.solicitudQr = ids
      this.idDetalle = ids; // Almacena el ID del detalle en la variable idDetalle
    },
    handleSeeDetails() {
      this.seeDetails = false; // Cambia el estado de seeDetails a falso
      this.solicitudQr = 'nada'; // Restablece la variable solicitudQr a su valor inicial
    },
    openInMaps(lat, lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    },
    openInWaze(lat, lng) {
      const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      window.open(url, '_blank');
    },
    exitFullscreenOnEscape(event) {
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    },
    checkOverflow() {
      const el = this.$refs.clienteNombreRef;
      if (el) {
        this.isOverflowing = el.scrollWidth > el.clientWidth;
      }
    }
  },
  watch: {
    transferencias: {
      handler(newVal) {
        this.$nextTick(() => {
          (newVal.data || []).forEach((item, index) => {
            const mapId = 'map-' + index;
            if (item.lat && item.lng) {
              this.initializeMap(mapId, item.lat, item.lng, item.alias);
            }
          });
        });
      },
      deep: true
    }
  },
  updated() {
    this.checkOverflow();
  }
}
</script>

<style scoped>
  @import "@mdi/font/css/materialdesignicons.min.css"; /* Asegurar que los iconos de Material Design estén disponibles */
  @import "https://code.iconify.design/2/2.2.1/iconify.min.js";
  .map-wrapper {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px auto;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
    background: #f9f9f9;
    width: 95%;
    height: 250px;
  }
  .map-container {
    width: 100%;
    height: 100%;
  }
  .map-buttons {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 1000;
  }
  .marquee {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    animation: marquee 12s linear infinite;
  }

  @keyframes marquee {
    0%, 10% {
      transform: translateX(0);
    }
    80% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  .leaflet-div-icon {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
</style>
