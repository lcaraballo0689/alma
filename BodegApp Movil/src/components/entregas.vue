<template>
    <div class="entrega-form d-flex flex-colum align-center pa-0 text-black ma-0 pa-0">
        <div v-if="!showCamera" class="step-content ma-0 pa-0">



            <div v-if="currentStep === 1">
                <!-- Paso 1: Datos -->
                <v-container class="entrega-form ma-0 pa-3" fluid>
                    <img v-if="grupo.detalleIdsText.length === 0" :src="emptyIcon" alt="Logo" style="width: 50vw"
                        :class="grupo.detalleIdsText.length ? '' : 'custom-image'" class="shape-shadow" />
                    <span v-if="grupo.detalleIdsText.length === 0" class="custom-image-text">Sin Registros!</span>

                    <v-card v-if="grupo.detalleIdsText.length > 0" class="elevation-2 ma-2 pa-0">
                        <v-card-title class="elevation-2 m-0 p-0">Resumen</v-card-title>

                        <v-card-text class="m-0 p-0">

                            <v-data-table v-model="selected" :headers="[
                                { key: 'ID', title: 'id', value: 'id' },
                                { key: 'Referencia', title: 'referencia1', value: 'referencia1' },
                                { key: 'Referencia2', title: 'referencia2', value: 'referencia2' },
                                { key: 'Referencia3', title: 'referencia3', value: 'referencia3' },
                            ]" :items="details" :search="search" dense :items-per-page="100" fixed-header
                                height="calc(100vh - 365px)"
                                :footer-props="{ 'items-per-page-options': [5, 10, 25, { text: 'Todos', value: -1 }] }"
                                class="mt-2 mx-0 p-0 elevation-1 rounded bordered striped" style="white-space: nowrap;">
                                <template #item.id="{ item }">
                                    <span style="white-space: nowrap;">
                                        {{ item.id || '—' }}
                                    </span>
                                </template>

                                <template #item.referencia1="{ item }">
                                    <span style="white-space: nowrap;">
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

                                <template #no-data>
                                    No hay registros para mostrar.
                                </template>
                                <template #no-results>
                                    No se encontraron resultados para "{{ search }}".
                                </template>
                            </v-data-table>
                        </v-card-text>
                    </v-card>
                </v-container>
            </div>
            <div v-else-if="currentStep === 2">
                <!-- Paso 2: Fotos -->
                <v-card class="mb-4 " style="width: 100vw; height: calc(100vh - 235px) ">

                    <v-card-text class="text-center">




                        <div class="back-fab elevation-9 flex-column align-center justify-start pt-2"
                            @click="openCamera">

                            <Icon icon="heroicons:camera" color="white" width="32" />
                        </div>
                        <span v-if="grupo.photosData.length === 0" class="custom-image-text"> Capturar Evidencia</span>



                        <div class="text-center mt-4">

                            <img v-if="grupo.photosData.length === 0" :src="plantsIcon" alt="Logo" style="width: 50vw"
                                :class="grupo.photosData.length ? '' : 'custom-image'" class="shape-shadow" />


                        </div>

                        <div v-if="grupo.photosData.length > 0"
                            style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 280px);">

                            <v-row class="mt-4 mx-0 p-0" dense>
                                <v-col v-for="(src, i) in grupo.photosData" :key="i" cols="6" md="0" class="p-0">
                                    <v-img :src="src" aspect-ratio="16:9" class="photo-thumb p-0">
                                        <div class="w-100 bar-image pa-1 d-flex align-items-center justify-content-end "
                                            @click.stop="removePhoto(i)">

                                            <Icon icon="line-md:trash" color="red" width="18" class="ms-1 me-2" />
                                            <span class="text-white ">Eliminar</span>
                                        </div>
                                        
                                    </v-img>
                                </v-col>
                            </v-row>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
            <div v-else-if="currentStep === 3">
                <!-- Paso 3: Firma -->
                <v-card class="mb-4" style="width: 100vw; height: calc(100vh - 235px)">
                    <v-card-title>Datos del Cliente</v-card-title>
                    <v-card-text>
                        <v-text-field label=" Nombre y Apellido" v-model="grupo.receptorNombre" required></v-text-field>
                        <v-text-field label="Documento de Identidad" v-model="grupo.receptorIdentificacion"
                            required></v-text-field>

                        <div class="mt-4">
                            <v-img v-if="grupo.firma" :src="grupo.firma" class="signature-img" height="200" contain />
                            <div v-else class="signature-placeholder">
                                <Icon icon="mdi-pencil" /> Firma no capturada
                            </div>
                        </div>
                        <div class="row d-flex justify-content-between mt-4">
                            <div class="col-auto">
                                <v-btn color="red" @click="grupo.firma = ''">
                                    <Icon icon="mdi:delete" width="24" height="24" /> Borrar Firma
                                </v-btn>
                            </div>
                            <div class="col-auto">
                                <v-btn color="primary" @click=" grupo.firma = '', openPad()">
                                    <Icon icon="ph:signature" width="24" height="24" /> Firmar
                                </v-btn>
                            </div>
                        </div>

                    </v-card-text>
                </v-card>
            </div>


            <!-- navegación fija en footer con botones nativos -->
            <div class="d-flex justify-space-between align-center mt-2 w-100 px-2 py-4"
                style="position: fixed; bottom: 0; left: 0; z-index: 1000; background: #E0E0E0;">
                <!-- Botón "Anterior" a la izquierda -->
                <div>
                    <v-btn v-if="currentStep > 1" rounded="xl" class="btn-footer rounded" @click="prevStep">
                        Anterior
                    </v-btn>
                    <v-btn v-if="currentStep === 1" rounded="xl" class="btn-footer rounded"
                        @click="$emit('regresar', true)">
                        Regresar
                    </v-btn>
                </div>

                <!-- Botones "Siguiente" / "Enviar" a la derecha -->
                <div>
                    <v-btn rounded="xl" v-if="currentStep <= 2" class="btn-footer" @click="nextStep">
                        Siguiente
                    </v-btn>
                    <v-btn :disabled="isSubmitting" rounded="xl" v-if="currentStep === 3" class="btn-footer-success" @click="handleSubmit">
                        <template v-if="isSubmitting">
                            <v-icon>mdi-loading</v-icon> Enviando...
                        </template>
                        <template v-else>
                            Guardar
                        </template>
                    </v-btn>
                </div>
            </div>


        </div>
        <div v-else class="camera-overlay">
            <div class="camera-gallery-container">
                <Camara :photosData="grupo.photosData" @capture="handleCapture" @close="closeCamera"
                    @remove-photo="removePhoto" />
                <div class="gallery-thumbs">
                    <div v-for="(src, i) in grupo.photosData" :key="i" class="thumb-item">
                        <img :src="src" class="thumb-img" />
                    </div>
                </div>
            </div>
        </div>
        <!-- overlay firma -->
        <v-dialog v-model="showPad" fullscreen hide-overlay>
            <v-sheet class="fill-height d-flex flex-column pa-0 overlay-backdrop" elevation="0"
                style="background: rgba(0,0,0,0.8);">





                <Pad ref="pad" v-model="grupo.firma" style="width: 90%; max-width: 800px; max-height: 80%;" />

                <v-card-actions class="mt-4 justify-end">
                    <v-btn text @click="showPad = false">Cancelar</v-btn>
                    <v-btn :disabled="isSubmitting" color="primary" @click="confirmSave">
                        <template v-if="isSubmitting">
                            <v-icon>mdi-loading</v-icon> Enviando...
                        </template>
                        <template v-else>
                            Guardar
                        </template>
                    </v-btn>
                </v-card-actions>
            </v-sheet>
        </v-dialog>
    </div>
</template>

<script>

import Pad from './Pad.vue';
import Camara from './Camara.vue';
import apiClient from '../services/api';
import plants from "@/assets/gallery.png";
import empty from "@/assets/empty.png";
import { useAuthStore } from '../stores/auth';
import { sassNull } from 'sass';
import Swal from 'sweetalert2';
import router from '../router';

export default {
    name: 'EntregaForm',
    components: { Camara, Pad },
    props: {
        solicitudIds: { type: Number, required: true, },
        usuarioId: { type: Number, required: true, },
        detalleIds: { type: Array, default: () => [] }

    },
    data() {
        return {
            useAuthStore: useAuthStore(),
            details: this.detalleIds,
            plantsIcon: plants,
            emptyIcon: empty,
            progress: 0,
            grupo: {
                detalleIdsText: this.detalleIds.join(','),
                receptorNombre: '',
                receptorIdentificacion: '',
                photosData: [],
                firma: ''
            },
            registros: [],
            solicitudId: this.solicitudIds,
            usuarioId: sassNull,
            response: null,
            error: null,
            showCamera: false,
            showGallery: false,
            selectedPhotoIndex: 0,
            showPad: false,
            stepInfo: [
                { num: 1, label: 'Datos' },
                { num: 2, label: 'Fotos' },
                { num: 3, label: 'Firma' }
            ],
            currentStep: 1,
            isSubmitting: false
        };
    },

    // Si tienes 3 pasos fijos:
    computed: {
        progress() {
            const totalSteps = this.stepInfo.length;
            if (totalSteps <= 1) return 100;
            // Calcula el porcentaje en función del paso actual y la cantidad de pasos
            return ((this.currentStep - 1) / (totalSteps - 1)) * 100;
        },
        stepLabel() {
            return this.stepInfo[this.currentStep - 1]?.label || '';
        }
    },
    watch: {
        detalleIds(newVal) {
            this.details = newVal;
            this.grupo.detalleIdsText = newVal.join(',');
        },
        solicitudIds(newVal) {
            this.solicitudId = newVal;
        },
        usuarioId(newVal) {
            this.usuarioId = newVal;
        }
    },
    methods: {
        addPhoto(photo) {
            this.grupo.photosData.push(photo);
        },
        removePhoto(i) {
            this.grupo.photosData.splice(i, 1);
        },
        fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        },
        openCamera() {
            this.showCamera = true;
        },
        closeCamera() {
            this.showCamera = false;
        },
        handleCapture(photo) {
            this.addPhoto(photo);
        },
        openGallery(index) {
            this.selectedPhotoIndex = index;
            this.showGallery = true;
        },
        closeGallery() {
            this.showGallery = false;
        },
        prevPhoto() {
            if (this.selectedPhotoIndex > 0) this.selectedPhotoIndex--;
        },
        nextPhoto() {
            if (this.selectedPhotoIndex < this.grupo.photosData.length - 1) this.selectedPhotoIndex++;
        },
        openPad() {
            this.showPad = true;
        },
        closePad() {
            // guardar firma antes de cerrar
            if (this.$refs.pad && typeof this.$refs.pad.savePad === 'function') {
                this.$refs.pad.savePad();
            }
            this.showPad = false;
        },
        onPadSave(data) {
            this.grupo.firma = data;
            this.closePad();
        },
        confirmSave() {
            const padComp = this.$refs.pad;
            let dataURL = '';
            if (padComp && padComp.sigPad) {
                dataURL = padComp.sigPad.toDataURL();
            }
            this.grupo.firma = dataURL;
            console.log('Firma guardada:', dataURL);
            this.showPad = false;
        },
        nextStep() {
            if (this.currentStep < 4) this.currentStep++;
        },
        prevStep() {
            if (this.currentStep > 1) this.currentStep--;
        },
        async handleSubmit() {
            this.response = null;
            this.error = null;
            this.isSubmitting = true;
            try {
                console.log('Firma base64 al enviar:', this.grupo.firma);
                if (!this.grupo.firma) throw new Error('Capture la firma');

                const detalleIds = this.details.map(detail => detail.id);
                const payload = {
                    solicitudId: this.solicitudId,
                    usuarioId: this.useAuthStore.user.id,
                    entregas: [
                        {
                            detalleIds,
                            receptor: {
                                nombre: this.grupo.receptorNombre,
                                identificacion: this.grupo.receptorIdentificacion
                            },
                            firma: this.grupo.firma,
                            fotos: this.grupo.photosData
                        }
                    ]
                };

                const res = await apiClient.post('/api/pwa/entregas/realizar', payload);
                this.response = JSON.stringify(res.data, null, 2);

                // Mostrar notificación de éxito
                Swal.fire({
                    title: 'Éxito',
                    text: 'La entrega se ha procesado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
                
                this.$emit('regresar', true);
            } catch (err) {
                // Procesar el error para extraer el mensaje relevante
                const errorMessage = err.response?.data || err.message;
                const parsedError = /Error: (.*?)(<br>|\|$)/.exec(errorMessage)?.[1] || 'Ocurrió un error inesperado';

                this.error = parsedError;

                // Mostrar notificación de error
                Swal.fire({
                    title: 'Error',
                    text: this.error,
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            } finally {
                this.isSubmitting = false;
            }
        }
    }
};
</script>

<style scoped>
.entrega-form {
    width: 100vw;
    height: calc(100vh - 210px);


    margin: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 0rem;
}

.signature-canvas {
    width: 100%;
    height: 100%;
}

.delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
}

.video-wrapper {
    border: 1px solid #ccc;
    width: 300px;
    height: 200px;
    margin-bottom: 10px;
}

.video-camera {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}

.photo-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.photo-item {
    position: relative;
    width: 100px;
    height: 100px;
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.camera-overlay {
    position: fixed;
    top: 0;

    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
}

.back-icon {
    position: absolute;
    top: 16px;
    left: 16px;
    cursor: pointer;
}

.camera-gallery-container {
    display: flex;
    align-items: center;
    gap: 16px;
}

.gallery-thumbs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 80%;
    overflow-y: auto;
}

.thumb-item {
    width: 64px;
    height: 64px;
}

.thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid #fff;
}

.close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    color: #fff;
}

.gallery-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.gallery-img {
    max-width: 80%;
    max-height: 80%;
}

.prev-btn,
.next-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 2rem;
    color: #fff;
    background: transparent;
    border: none;
}

.prev-btn {
    left: 16px;
}

.next-btn {
    right: 16px;
}

.gallery-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    color: #fff;
    background: transparent;
    border: none;
    font-size: 1rem;
}

.signature-preview img {
    max-width: 200px;
    border: 1px solid #ccc;
    margin-top: 4px;
}

.photo-thumb {
    border-radius: 5px;
    overflow: hidden;
    ;
}

.signature-img {
    border: 2px solid #ccc;
    border-radius: 8px;
}

.signature-placeholder {
    width: 100%;
    height: 200px;
    border: 2px dashed #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    font-style: italic;
}

.custom-stepper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.step {
    display: flex;
    align-items: center;
    flex: 1;
}

.circle {
    width: 32px;
    height: 32px;
    border: 2px solid #ccc;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
    background: #fff;
    font-weight: bold;
}

.circle.active {
    border-color: #1976D2;
    background: #1976D2;
    color: #fff;
}

.label {
    margin-left: 8px;
    color: #757575;
    font-size: 14px;
}

.label.active {
    color: #0a9b16;
}

.line {
    flex: 1;
    height: 2px;
    background: #ccc;
    margin: 0 12px;
}

.line.active {
    color: #0a9b16;
    background: #1976D2;
}

.step-footer {
    position: fixed;
    bottom: calc(-100vh + 120px);
    left: 0;
    width: 100%;
    padding: 10px;
    background: #fff;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #ddd;
    box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.1);
    z-index: 200000;
}

.btn-footer {
    padding: 10px 20px;
    background: #b6b6b6;
    color: #272727;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.btn-footer-success {
    background: #4CAF50;
    padding: 10px 20px;

    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.btn-footer:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.step-content {
    padding-bottom: 80px;
}

.v-sheet.overlay-backdrop {
    /* Pad signature backdrop */
    background: rgb(226, 226, 226) !important;

}






.custom-image {
    width: 70vw;
    height: auto;
    max-width: 800px;
    position: fixed;
    top: 45vh;
    left: 50vw;
    transform: translate(-50%, -50%);
}

.custom-image-text {
    position: fixed;
    top: 60vh;
    left: 50vw;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    color: #333;
    text-align: center;
}

.custom-fab {
    position: fixed;
    top: 86.5vh;
    left: 50vw;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    color: #333;
    text-align: center;
    z-index: 1000;
}

.back-fab {
    /* ubicación y dimensiones tal como las tenías */
    position: fixed;
    top: 80vh;
    left: 94vw;
    transform: translate(-50%, -50%);
    width: 70px;
    height: 50px;

    /* estilo de fondo, borde y desenfoque */
    background-color: rgba(48, 47, 47, 0.534);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: none;
    border-radius: 25px 0px 0px 25px;


    /* texto, alineación, etc */
    font-size: 1.2rem;
    color: #333;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;

    /* muy importante para que el ::before pueda “sacar” la joroba */
    overflow: visible;
    z-index: 1000;
}



.bar-image {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(43, 43, 43, 0.801);
    color: white;
    padding: 8px;
    text-align: center;
    text-justify: center;
    font-size: 16px;

    border-radius: 0 0 8px 8px;
}

.custom-chevron {
    font-size: 34px;
    animation: bounce 1s infinite ease-in-out;
    color: rgb(255, 255, 255) !important;
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-10px);
    }

    60% {
        transform: translateY(-5px);
    }
}

.shape-shadow {
    /* desplaza 0px en X, 5px en Y, difumina 10px y usa un negro semitransparente */
    filter: drop-shadow(0 5px 50px rgba(0, 0, 0, 0.5));
    /* si necesitas compatibilidad extra */
    -webkit-filter: drop-shadow(10px 15px 8px rgba(0, 0, 0, 0.5));
}
</style>