<template>
    <v-card outlined class="pa-0" style=" border-top-left-radius: 20px; border-top-right-radius: 20px;">
        
        <v-card-title class="d-flex align-center pa-4 elevation-4" style="background-color:  #BDBDBD; border-top-left-radius: 20px; border-top-right-radius: 20px;">
            <Icon icon="fluent:new-16-regular" width="24" height="24" class="mr-2" />
            <span class="text-h6 font-weight-medium">
            Solicitud de {{ data.solicitud.modulo }} #{{ solicitudId }}
            </span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-subtitle class="d-flex justify-space-between">
            <span>{{ formatDate(data.solicitud.updatedAt) }}</span>
            <span>{{ data.solicitud.estado }}</span>
        </v-card-subtitle>
        
        <v-card-text>

            <v-skeleton-loader v-if="loading" type="card, list-item-avatar, list-item-two-line" />

            <div v-else-if="error" class="text-center text-danger">
                {{ error }}
            </div>

            <div v-else>
                <v-expansion-panels>
                    <!-- Información básica y estado -->
                    <v-expansion-panel title="Información General">
                        <template #text>
                            <v-row dense>
                                <v-col cols="6"><strong>ID:</strong> {{ data.solicitud.id }}</v-col>
                                <v-col cols="6"><strong>Cliente ID:</strong> {{ data.solicitud.clienteId }}</v-col>
                                <v-col cols="6"><strong>Consecutivo:</strong> {{ data.solicitud.consecutivo }}</v-col>
                                <v-col cols="6"><strong>Tipo:</strong> {{ data.solicitud.modulo }}</v-col>
                                
                                <!-- <v-col cols="6"><strong>Prioridad:</strong> {{ data.solicitud.prioridad || '—'
                                    }}</v-col> -->
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Detalles de entrega -->
                    <v-expansion-panel title="Detalles de Entrega">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12"><strong>Dirección:</strong> {{ data.solicitud.direccion }}</v-col>
                                <v-col cols="6"><strong>Placa:</strong> {{ data.solicitud.placa || '—' }}</v-col>
                                <v-col cols="6"><strong>Transportista:</strong> {{ data.solicitud.transportista || '—'
                                    }}</v-col>
                                <v-col cols="12"><strong>Documento ID:</strong> {{ data.solicitud.documentoIdentidad ||
                                    '—' }}</v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Fechas -->
                    <v-expansion-panel title="Trazabilidad de Fechas">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12" md="4"><strong>Solicitud:</strong> {{
                                    formatDate(data.solicitud.fechaSolicitud) }}</v-col>
                                <v-col cols="12" md="4"><strong>Verificación:</strong> {{
                                    data.solicitud.fechaVerificacion ? formatDate(data.solicitud.fechaVerificacion) :
                                    '—' }}</v-col>
                                <v-col cols="12" md="4"><strong>Carga:</strong> {{ data.solicitud.fechaCarga ?
                                    formatDate(data.solicitud.fechaCarga) : '—' }}</v-col>
                                <v-col cols="12" md="4"><strong>Asignación:</strong> {{ data.solicitud.fechaAsignacion ?
                                    formatDate(data.solicitud.fechaAsignacion) : '—' }}</v-col>
                                <v-col cols="12" md="4"><strong>Recogida:</strong> {{ data.solicitud.fechaRecogida ?
                                    formatDate(data.solicitud.fechaRecogida) : '—' }}</v-col>
                                <v-col cols="12" md="4"><strong>Entrega:</strong> {{ data.solicitud.fechaEntrega ?
                                    formatDate(data.solicitud.fechaEntrega) : '—' }}</v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Usuarios -->
                    <v-expansion-panel title="Usuarios Involucrados">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12"><strong>Solicitante:</strong> {{ data.solicitud.usuarioSolicitante
                                    }}</v-col>
                                <v-col cols="12"><strong>Verifica:</strong> {{ data.solicitud.usuarioVerifica || '—'
                                    }}</v-col>
                                <v-col cols="12"><strong>Carga:</strong> {{ data.solicitud.usuarioCarga || '—'
                                    }}</v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>

                    <!-- Información adicional -->
                    <v-expansion-panel title="Información Adicional">
                        <template #text>
                            <v-row dense>
                                <v-col cols="12"><strong>Observaciones:</strong> {{ data.solicitud.observaciones || '—'
                                    }}</v-col>
                                <v-col cols="12"><strong>Detalles:</strong> {{ data.solicitud.detallesAdicionales || '—'
                                    }}</v-col>
                                <v-col cols="12"><strong>Motivo:</strong> {{ data.solicitud.motivo || '—' }}</v-col>
                                <v-col cols="12"><strong>QR Token:</strong> {{ data.solicitud.qrToken || '—' }}</v-col>
                                <v-col cols="12"><strong>Sticker:</strong> {{ data.solicitud.stickerSeguridad || '—'
                                    }}</v-col>
                                <v-col cols="12"><strong>Creado:</strong> {{ formatDate(data.solicitud.createdAt)
                                    }}</v-col>
                                <v-col cols="12"><strong>Actualizado:</strong> {{ formatDate(data.solicitud.updatedAt)
                                    }}</v-col>
                            </v-row>
                        </template>
                    </v-expansion-panel>
                </v-expansion-panels>

                <v-data-table :headers="detalleHeaders" :items="data.detalle" class="elevation-1 mt-4">
                    <thead>
                        <tr>
                            <th class="text-left">
                                ID
                            </th>
                            <th class="text-left">
                                Ref. 1
                            </th>
                            <th class="text-left">
                                Ref. 2
                            </th>
                            <th class="text-left">
                                Ref. 3
                            </th>
                            <th class="text-left">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in data.detalle" :key="item.id">
                            <td>{{ item.id }}</td>
                            <td>{{ item.referencia1 || '—' }}</td>
                            <td>{{ item.referencia2 || '—' }}</td>
                            <td>{{ item.referencia3 || '—' }}</td>
                            <td>{{ item.estado }}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" class="text-center">
                                Total: {{ data.detalle.length }} Referencias
                            </td>
                        </tr>
                    </tfoot>
                </v-data-table>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import apiClient from '@/services/api'

export default {
    name: 'TransferDetail',
    props: {
        solicitudId: {
            type: [String, Number],
            required: true
        }
    },
    data() {
        return {
            loading: false,
            error: '',
            data: null,
            detalleHeaders: [
                { text: 'ID', value: 'id', },
                { text: 'Tipo', value: 'tipo' },
                { text: 'Ref. 1', value: 'referencia1' },
                { text: 'Ref. 2', value: 'referencia2' },
                { text: 'Estado', value: 'estado' }
            ]
        }
    },
    watch: {
        solicitudId: {
            immediate: true,
            handler() {
                this.fetchDetalle()
            }
        }
    },
    methods: {
        async fetchDetalle() {
            this.loading = true
            this.error = ''
            try {
                const res = await apiClient.post("/api/transferencias/detalleCompleto/",
                    { solicitudId: this.solicitudId }
                )
                this.data = res.data
            } catch (err) {
                console.error('Error al cargar detalle:', err)
                this.error = 'No se pudo obtener el detalle de la solicitud.'
            } finally {
                this.loading = false
            }
        },
        formatDate(dateStr) {
            const d = new Date(dateStr)
            return d.toLocaleString()
        }
    }
}
</script>

<style scoped>
.pa-4 {
    padding: 16px !important;
}
</style>