<template>
    <div class="d-flex flex-column align-center justify-center pa-0" style="">
        <!-- Componente de escaneo -->
        <Entregas v-if="showEntregas" :solicitudIds="solicitudId" :detalle-ids="detalleIdsComputed"
            @nuevo-scan="handleNewScan" @regresar="handleRegresar" class="ma-2 pa-2"/>


        <!-- Loader mientras carga -->
       
        <v-skeleton-loader v-if="loading" type="article, paragraph, article, article, article, article" class="my-6 elevation-2" />
        

        <!-- Mensaje de error
        <div v-else-if="error" class="text-center text-danger">
            {{ error }}
        </div> -->

        <!-- Tarjeta con detalle -->



        <v-card v-if="!showEntregas && !loading" outlined class="pa-0 mt-4"
            style="border-top-left-radius: 8px; border-top-right-radius: 8px; width: 93vw;">
            <v-card-title class="pa-4 elevation-4"
                style="background-color: #E0E0E0; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                <v-row class="w-100" align="center">
                    <v-col cols="6">
                        Solicitud de {{ data.solicitud.modulo }} - #{{ data.solicitud.id }}
                    </v-col>
                    <v-col cols="6" class="text-right pa-0 ma-0">
                        
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider />
            <v-card-subtitle class="d-flex justify-space-between pa-4">
                <span>{{ formatDate(data.solicitud.updatedAt) }}</span>
                <span>{{ data.solicitud.estado }}</span>
            </v-card-subtitle>

            <v-card-text>
                <v-expansion-panels>
                    <!-- Información básica y estado -->
                    <v-expansion-panel title="Información General">
                        <template #text>
                            <v-row dense>
                                <v-col cols="6">
                                    <strong>ID:</strong> {{ data.solicitud.id }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Cliente ID:</strong> {{ data.solicitud.clienteId }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Consecutivo:</strong> {{ data.solicitud.consecutivo }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Tipo:</strong> {{ data.solicitud.modulo }}
                                </v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Detalles de entrega -->
                    <v-expansion-panel title="Detalles de Entrega">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12">
                                    <strong>Dirección:</strong> {{ data.solicitud.direccion }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Placa:</strong> {{ data.solicitud.placa || '—' }}
                                </v-col>
                                <v-col cols="6">
                                    <strong>Transportista:</strong> {{ data.solicitud.transportista || '—' }}
                                </v-col>
                                <v-col cols="12">
                                    <strong>Documento ID:</strong> {{ data.solicitud.documentoIdentidad || '—' }}
                                </v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Fechas -->
                    <v-expansion-panel title="Trazabilidad de Fechas">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12" md="4">
                                    <strong>Solicitud:</strong> {{ formatDate(data.solicitud.fechaSolicitud) }}
                                </v-col>
                                <v-col cols="12" md="4">
                                    <strong>Verificación:</strong>
                                    {{
                                        data.solicitud.fechaVerificacion
                                            ? formatDate(data.solicitud.fechaVerificacion)
                                            : '—'
                                    }}
                                </v-col>
                                <v-col cols="12" md="4">
                                    <strong>Carga:</strong>
                                    {{ data.solicitud.fechaCarga ? formatDate(data.solicitud.fechaCarga) : '—' }}
                                </v-col>
                                <v-col cols="12" md="4">
                                    <strong>Asignación:</strong>
                                    {{ data.solicitud.fechaAsignacion ? formatDate(data.solicitud.fechaAsignacion) : '—'
                                    }}
                                </v-col>
                                <v-col cols="12" md="4">
                                    <strong>Recogida:</strong>
                                    {{ data.solicitud.fechaRecogida ? formatDate(data.solicitud.fechaRecogida) : '—' }}
                                </v-col>
                                <v-col cols="12" md="4">
                                    <strong>Entrega:</strong>
                                    {{ data.solicitud.fechaEntrega ? formatDate(data.solicitud.fechaEntrega) : '—' }}
                                </v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Usuarios -->
                    <v-expansion-panel title="Usuarios Involucrados">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12">
                                    <strong>Solicitante:</strong> {{ data.solicitud.usuarioSolicitante }}
                                </v-col>
                                <v-col cols="12">
                                    <strong>Verifica:</strong>
                                    {{ data.solicitud.usuarioVerifica || '—' }}
                                </v-col>
                                <v-col cols="12">
                                    <strong>Carga:</strong>
                                    {{ data.solicitud.usuarioCarga || '—' }}
                                </v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Información adicional -->
                    <v-expansion-panel title="Información Adicional">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12">
                                    <strong>Observaciones:</strong> {{ data.solicitud.observaciones || '—' }}
                                </v-col>

                                <v-col cols="12">
                                    <strong>Sticker:</strong> {{ data.solicitud.stickerSeguridad || '—' }}
                                </v-col>
                                <v-col cols="12">
                                    <strong>Creado:</strong> {{ formatDate(data.solicitud.createdAt) }}
                                </v-col>
                                <v-col cols="12">
                                    <strong>Actualizado:</strong> {{ formatDate(data.solicitud.updatedAt) }}
                                </v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>
                </v-expansion-panels>

            </v-card-text>
        </v-card>

        <v-card v-if="!showEntregas && !loading" outlined class="pa-0 mt-4"
            style="border-top-left-radius: 8px; border-top-right-radius: 8px; width: 93vw;">
            <!-- Sección Registros -->
            <v-card-title class="d-flex align-center pa-0 ma-0 elevation-4"
                style="background-color: #E0E0E0; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                <v-col cols="6" md="6" class="d-flex align-center">
                    <span class="text-h6">Registros</span>
                </v-col>
                <v-col cols="6" md="6">
                    <v-select 
                        v-model="selectedStatus"
                        :items="['Entregado', 'Pendiente']"
                        label="Estado"
                        hide-details
                        density="compact"
                        class="bg-white"
                        style="border-radius: 50px;"
                    >
                        <template #prepend-inner>
                            <Icon icon="line-md:filter" width="24" height="24" />
                        </template>
                    </v-select>
                </v-col>
            </v-card-title>
            <v-card-text class="pa-4" style="margin-bottom: 100px;">
                <v-row dense>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="search" label="Buscar Referencia" variant="outlined" hide-details
                            dense />
                    </v-col>

                </v-row>

                <v-data-table v-model="selected" :headers="detalleHeaders" :items="filteredItems" :search="search" dense
                     return-object show-select :item-selectable="item => item.procesado !== true"
                    :items-per-page="100" fixed-header height="400"
                    :footer-props="{ 'items-per-page-options': [5, 10, 25, { text: 'Todos', value: -1 }] }"
                    class="elevation-1 rounded bordered striped" style="white-space: nowrap;">

                    <template #item.id="{ item }">
                        <span style="white-space: nowrap;">
                            {{ item.id || '—' }}
                        </span>
                    </template>

                    <template #item.entregaId="{ item }">
                        <span style="white-space: nowrap; border-radius: 8px;" class="px-2 py-1"
                            :class="item.procesado !== false ? 'bg-green' : 'bg-red'">
                            {{ item.procesado ? 'Entregado' : 'Pendiente' }}
                        </span>
                    </template>

                    <template #item.referencia1="{ item }">
                        <span :class="{ 'text--disabled': item.procesado }" style="white-space: nowrap;">
                            {{ item.referencia1 || '—' }}
                        </span>
                    </template>
                    <template #item.referencia2="{ item }">
                        <span style="white-space: nowrap;">
                            {{ item.referencia2 || '—' }}
                        </span>
                    </template>
                    <template #item.referencia3="{ item }">
                        <span style="white-space: nowrap;">
                            {{ item.referencia3 || '—' }}
                        </span>
                    </template>
                    <template #item.estado="{ item }">
                        <span style="white-space: nowrap;">
                            {{ item.estado }}
                        </span>
                    </template>

                    <template #no-data>
                        No hay registros para mostrar.
                    </template>
                    <template #no-results>
                        No se encontraron resultados para "{{ search }}".
                    </template>
                </v-data-table>
            </v-card-text>

            <v-div class="d-flex justify-space-between align-center pa-0 px-2 elevation-9" style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: #BDBDBD; z-index: 1000; height: 56px;">
                <v-btn @click="handleRegresar" color="grey-lighten-2" variant="elevated" style="border-radius: 25px 25px 25px 25px ;" class="ma-0 pa-0 px-2 text-center">
                    <Icon icon="ri:arrow-left-s-line" color="red" width="24" height="24" /> 
                    <span class="pe-2">Volver</span>
                </v-btn>
                <v-btn v-if="selected.length > 0" @click="showEntregas = !showEntregas" class="ma-0 text-center" style="border-radius: 25px 25px 25px 25px ;"
                    color="green-darken-1" variant="elevated" :disabled="selected.length === 0">
                    <Icon icon="line-md:confirm-circle-twotone" width="24" height="24" class="me-2"/>procesar {{ selected.length }} {{ selected.length > 1 ? 'items' : 'item' }}
                </v-btn>
            </v-div>
        </v-card>
    </div>
</template>

<script>
import apiClient from '@/services/api'
import Entregas from './entregas.vue'

export default {
    name: 'TransferDetail',
    emits: ['location-updated'],
    props: {
        solicitudId: {
            type: [String, Number],
            required: true
        }
    },
    components: { Entregas },
    data() {
        return {
            showScan: false,
            showEntregas: false,
            loading: false,
            error: '',
            data: { solicitud: {}, detalle: [] },
            selected: [],
            selectedStatus: 'Pendiente',
            search: '',
            filteredItems: [],
            location: { latitude: null, longitude: null },
            detalleHeaders: [
                { key: 'id', title: 'ID' },
                { key: 'entregaId', title: 'Entrega' },
                { key: 'referencia1', title: 'Ref. 1', align: 'center', sortable: true },
                { key: 'referencia2', title: 'Ref. 2' },
                { key: 'referencia3', title: 'Ref. 3' },
                { key: 'estado', title: 'Estado' }
            ],
            metrics: [],
            pendingTasks: []
        }
    },
    computed: {
        detalleIdsComputed() {
            return this.selected
        }

    },
    watch: {
        solicitudId: {
            immediate: true,
            handler() {
                this.fetchDetalle()
            }
        },
        search() {
            this.applyFilters()
        },
        selectedStatus() {
            this.applyFilters()
        },
        loading() {
            this.$emit('showloader', false)
        }
    },
    mounted() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    this.location.latitude = pos.coords.latitude
                    this.location.longitude = pos.coords.longitude
                    this.$emit('location-updated', { latitude: this.location.latitude, longitude: this.location.longitude })
                },
                err => console.error('Error obteniendo ubicación:', err)
            )
        }
    },
    methods: {
        async fetchDetalle() {
            this.loading = true
            this.error = ''
            try {
                const res = await apiClient.post('/api/transferencias/detalleCompleto/', {
                    solicitudId: this.solicitudId
                })
                this.data = res.data
                this.applyFilters()
            } catch {
                this.error = 'No se pudo obtener el detalle de la solicitud.'
            } finally {
                this.loading = false
                this.selected = []
                this.$emit('showload', true)
            }
        },
        async fetchTransferencias() {
            this.loading = true;
            try {
                const response = await apiClient.post('/api/transferencias/consultar', {});
                const transferencias = response.data.data;

                // Actualizar métricas
                const resumen = {
                    Transferencias: transferencias.filter(t => t.modulo === 'Devolucion').length,
                    Prestamos: transferencias.filter(t => t.modulo === 'Prestamo').length,
                    Entregados: transferencias.filter(t => t.estado === 'entregado por transportador').length,
                    EnProceso: transferencias.filter(t => t.estado === 'en proceso de entrega').length
                };

                this.metrics = [
                    { icon: 'mdi-archive-marker', color: 'blue', value: resumen.Transferencias, label: 'Devoluciones' },
                    { icon: 'mdi-archive-arrow-up', color: 'green', value: resumen.Prestamos, label: 'Préstamos' },
                    { icon: 'mdi-check-circle', color: 'orange', value: resumen.Entregados, label: 'Entregados' },
                    { icon: 'mdi-truck-delivery', color: 'red', value: resumen.EnProceso, label: 'En Proceso' }
                ];

                // Actualizar tareas pendientes
                this.pendingTasks = transferencias.map(t => ({
                    id: t.id,
                    type: t.modulo,
                    details: t.direccion || t.alias || 'Sin dirección',
                    status: t.estado
                }));
            } catch (error) {
                console.error('Error al obtener las transferencias:', error);
                this.error = 'No se pudo cargar la información de transferencias.';
            } finally {
                this.loading = false;
            }
        },
        applyFilters() {
            let items = [...(this.data.detalle || [])]
            if (this.selectedStatus) {
                const isEntregado = this.selectedStatus === 'Entregado'
                items = items.filter(i => i.procesado === isEntregado)
            }
            if (this.search) {
                const term = this.search.toLowerCase()
                items = items.filter(i =>
                    [i.referencia1, i.referencia2, i.referencia3, String(i.id), i.estado]
                        .some(f => f && f.toLowerCase().includes(term))
                )
            }
            this.filteredItems = items
        },
        formatDate(dateStr) {
            return dateStr ? new Date(dateStr).toLocaleString() : '—'
        },
        handleNewScan() {
            this.showScan = true
            this.selected = []
        },
        handleRegresar() {
            this.showEntregas = false
            this.$emit('retornar', true)
            //this.selected = []
        },
        getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        this.location.latitude = pos.coords.latitude
                        this.location.longitude = pos.coords.longitude
                        this.$emit('location-updated', { latitude: this.location.latitude, longitude: this.location.longitude })
                    },
                    err => console.error('Error obteniendo ubicación:', err)
                )
            }
        }
    }
}
</script>

<style scoped>
.pa-4 {
    padding: 16px !important;
}
.v-input__control {
    border-radius: 50px !important;
    background-color: transparent !important;
    border: 1px solid #ccc !important;
    box-shadow: none !important;
    padding: 10px !important;    
    margin: 0 !important;
    height: 40px !important;
}
</style>