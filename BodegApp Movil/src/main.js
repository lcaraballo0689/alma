import { createApp } from 'vue'
import { createPinia } from 'pinia';
import router from './router'
import './style.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Icon } from '@iconify/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import '@mdi/font/css/materialdesignicons.css'
import 'boxicons/css/boxicons.min.css'
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({ immediate: true });

const app = createApp(App)
  .use(createPinia())
  .use(VueSweetalert2)
  .use(router)
  .use(vuetify)
  .component('Icon', Icon)
  .mount('#app');
