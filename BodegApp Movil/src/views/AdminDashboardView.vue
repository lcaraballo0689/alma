<template>
    <v-app>
        <!-- ───── Barra superior ───── -->
        <v-app-bar app color="whitesmoke" elevation="6" density="comfortable" class="d-flex align-center"
            style="height: 56px; width: 100%; position: fixed; top: 0; z-index: 10000;">
            <!-- Menú hamburguesa controla el v-window -->
            <v-menu v-model="menuOpen">
                <template #activator="{ props }">
                    <v-btn v-bind="props" icon variant="plain" @click="handleMenuOpen(); menuOpen = !menuOpen"
                        :class="{ 'text-black': !menuOpen, 'text-red': menuOpen }">
                        <Icon v-bind="props" v-if="!menuOpen" icon="line-md:close-to-menu-alt-transition" width="24"
                            height="24" />
                        <Icon v-bind="props" v-else icon="line-md:menu-to-close-alt-transition" width="24"
                            height="24" />
                            
                    </v-btn>
                </template>


                <v-list class="pa-0 elevation-0 d-flex flex-column mt-auto" width="100vw"
                    style="position: fixed; top: 4px; left: 0; height: calc(100vh - 56px); background: whitesmoke; color: white; overflow-y: auto;">
                    <v-list class="pa-0 elevation-0 d-flex flex-column mt-auto " width="100vw" style="
                            position: fixed;
                            top: 4px;
                            left: -12px;
                            height: calc(100vh - 56px);
                            background: whitesmoke;
                            color: white;
                            overflow-y: auto;
                            ;
                        ">

                        <!-- Menu -->
                        <v-row class="d-flex flex-wrap px-4 pt-2 pb-2" style="max-height: 160px; ">
                            <v-col cols="4" v-for="item in menuItems" :key="item.value"
                                class="d-flex justify-center align-center flex-column">
                                <v-list-item variant="tonal" ripple @click="handleMenu(item)" class="elevation-2"
                                    :class="[
                                        'my-2 rounded-lg d-flex flex-column align-center text-center',
                                        panel === item.value
                                            ? 'bg-red text-white'
                                            : 'text-black hover:bg-white/10'
                                    ]" style="cursor: pointer; width: 100%;">
                                    <v-list-item-icon>
                                        <v-icon :class="item.icon" class="mb-2" style="font-size: 35px;" />
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        <v-list-item-title class="font-weight-medium text-uppercase">

                                            <span style="font-size: 12px;">{{ item.title }}</span>
                                        </v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-col>
                        </v-row>

                        <v-divider class="my-0 text-black mx-4" />

                        <!-- Notificaciones -->
                        <v-menu v-model="notificacionsOpen" offset-y origin="top right" transition="slide-y-transition"
                            max-width="auto" min-width="auto" :close-on-content-click="false">
                            <!-- Activador -->
                            <template #activator="{ props }">
                                <v-div class="text-start  text-black  d-flex align-center ms-4 mt-1">
                                    <Icon icon="line-md:bell-alert" width="22" height="22" class="me-2" />
                                    {{ notifications.detalle.length }}
                                    Notificaciones
                                </v-div>

                                <v-list dense class="pa-2" style="overflow-y: auto; ">
                                    <v-list-item v-for="n in notifications.detalle" :key="n.id"
                                        class="notification-item">
                                        <v-list-item-avatar size="36">
                                            <v-img :src="n.avatar" />
                                        </v-list-item-avatar>

                                        <v-list-item-content>
                                            <v-list-item-title class="subtitle-2">
                                                {{ n.title }}
                                            </v-list-item-title>
                                            <v-list-item-subtitle class="caption text--secondary">
                                                {{ n.message }}
                                            </v-list-item-subtitle>
                                        </v-list-item-content>

                                        <v-list-item-action-text class="caption text--disabled text-end ">
                                            {{ n.time }}
                                        </v-list-item-action-text>
                                    </v-list-item>

                                    <v-list-item v-if="notifications.detalle.length === 0">
                                        <v-list-item-content>
                                            <v-list-item-title class="caption text-center">
                                                No hay notificaciones
                                            </v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                </v-list>




                            </template>


                        </v-menu>
                        <v-divider class="my-2" />



                    </v-list>
                </v-list>
            </v-menu>

            <!-- Un solo v-menu para móvil y escritorio -->
            <!-- Logo a la derecha -->
            <v-img :src="logo" class="mx-0 px-0" />
            <v-spacer />
            <!-- <NotificationDropdown class="me-4"  :show="notificacionsOpen" /> -->
            <v-div v-bind="props" icon variant="text" class="ms-4 text-black"
                style="pointer-events: none; margin-top: 15px;">
                <v-badge :content="notifications.detalle.length" color="red" overlap style="margin-right: 20px;">
                    <Icon icon="line-md:bell-alert" width="22" height="22" />
                </v-badge>
            </v-div>
            <v-btn icon variant="text" @click="logout" class="text-red">
                <Icon icon="line-md:log-out" width="24" height="24" />
            </v-btn>
        </v-app-bar>

        <v-main class="scrollable-container">

            <v-window v-model="panel" class=" m-0 p-0" :touch="false">
                <!-- Un item del window por cada opción -->
                <v-window-item v-for="item in menuItems" :key="item.value" :value="item.value">
                    <!-- Aquí se pinta el componente especificado -->
                    <keep-alive class=" p-0 m-0"  style="width: 100%; height: calc(100vh - 56px); overflow-y: auto; ">
                        <component :is="item.component" style="height: calc(100vh - 56px);" />
                    </keep-alive>
                </v-window-item>
            </v-window>
        </v-main>
    </v-app>
</template>


<script>
import logo from '@/assets/logo.png'
import { defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NotificationDropdown from '@/components/NotificationDropdown.vue'

export default {
    name: 'AdminDashboardView',

    components: {
        // Lazy-load para reducir bundle inicial
        DashboardView: defineAsyncComponent(() => import('@/views/DashboardView.vue')),
        ReportesView: defineAsyncComponent(() => import('@/views/ReportsView.vue')),
        SettingsView: defineAsyncComponent(() => import('@/views/SettingsView.vue')),
        NotificationDropdown
    },

    data() {
        return {

            useAuthStore: useAuthStore(),    // store de Pinia
            logo,
            panel: 'dashboard',          // pantalla inicial
            menuOpen: false,
            notificacionsOpen: false,
            menuItems: [
                { title: 'Dashboard', value: 'dashboard', icon: 'bx bx-library', component: 'DashboardView' },
                { title: 'Solicitudes', value: 'Solicitudes', icon: 'bx bx-line-chart', component: 'ReportesView' },
                { title: 'Ajustes', value: 'Ajustes', icon: 'bx bx-cog', component: 'SettingsView' }
            ],
            notifications: {
                detalle:[]
                // detalle: [
                //     { id: 1, title: 'Nueva solicitud', message: 'Tienes una nueva solicitud de pedido.', time: 'Hace 5 minutos', avatar: 'https://via.placeholder.com/40' },
                //     { id: 2, title: 'Actualización de inventario', message: 'El inventario ha sido actualizado.', time: 'Hace 10 minutos', avatar: 'https://via.placeholder.com/40' },
                //     { id: 3, title: 'Nuevo mensaje', message: 'Tienes un nuevo mensaje de soporte.', time: 'Hace 15 minutos', avatar: 'https://via.placeholder.com/40' },
                //     { id: 4, title: 'Mantenimiento programado', message: 'El sistema estará en mantenimiento el sábado.', time: 'Hace 1 hora', avatar: 'https://via.placeholder.com/40' },
                //     { id: 5, title: 'Nueva función disponible', message: 'Una nueva función ha sido añadida.', time: 'Hace 2 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 6, title: 'Recordatorio de reunión', message: 'No olvides la reunión a las 3 PM.', time: 'Hace 3 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 7, title: 'Nueva actualización', message: 'Una nueva actualización está disponible.', time: 'Hace 4 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 8, title: 'Nuevo comentario', message: 'Tienes un nuevo comentario en tu publicación.', time: 'Hace 5 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 9, title: 'Nueva tarea asignada', message: 'Se te ha asignado una nueva tarea.', time: 'Hace 6 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 10, title: 'Nuevo pedido', message: 'Tienes un nuevo pedido pendiente.', time: 'Hace 7 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 11, title: 'Nuevo cliente', message: 'Un nuevo cliente se ha registrado.', time: 'Hace 8 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 12, title: 'Nueva revisión', message: 'Tienes una nueva revisión de producto.', time: 'Hace 9 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 13, title: 'Nuevo producto', message: 'Un nuevo producto ha sido añadido.', time: 'Hace 10 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 14, title: 'Nueva promoción', message: 'Una nueva promoción está disponible.', time: 'Hace 11 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 15, title: 'Nuevo informe', message: 'Un nuevo informe ha sido generado.', time: 'Hace 12 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 16, title: 'Nueva encuesta', message: 'Una nueva encuesta ha sido creada.', time: 'Hace 13 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 17, title: 'Nuevo evento', message: 'Un nuevo evento ha sido programado.', time: 'Hace 14 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 18, title: 'Nueva tarea completada', message: 'Una tarea ha sido completada.', time: 'Hace 15 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 19, title: 'Nuevo archivo compartido', message: 'Un nuevo archivo ha sido compartido contigo.', time: 'Hace 16 horas', avatar: 'https://via.placeholder.com/40' },
                //     { id: 20, title: 'Nueva alerta de seguridad', message: 'Se ha detectado una alerta de seguridad.', time: 'Hace 17 horas', avatar: 'https://via.placeholder.com/40' }

                // ]
            },          // notificaciones
        }
    },

    methods: {
        // Obtener IP del cliente
        getIp() {
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    this.ip = data.ip
                })
                .catch(error => console.error('Error fetching IP:', error))
        },
        handleMenu(item) {
            this.panel = item.value   // cambia v-window
            this.menuOpen = false        // cierra menú
            notificacionsOpen = false // cierra notificaciones
        },

        logout() {
            localStorage.removeItem('token')
            sessionStorage.clear()
            this.$router.replace({ name: 'Login' })
        },
        handleMenuOpen(){
            this.menuOpen = !this.menuOpen;
            this.getIp();
            const oldPanel = this.panel; // Guardar el panel actual
            if (this.menuOpen) {
                this.panel = 'none' // vuelve a dashboard
            }
            this.panel = oldPanel;
        }
    }
}
</script>
<style scoped>
.scrollable-container {
  overflow-y: auto;
  height: calc(100vh - 64px); /* Ajusta según la altura del app-bar */
}
.notification-item {
    cursor: pointer;
    transition: background-color 0.3s ease;
    padding: 10px;
    border-radius: 8px;
    margin: 5px 0;
    background-color: #f9f9f9;
}
</style>
