<template>
    <v-app>

        <v-container fluid fill-height class="pa-0">
            <v-row align="center" justify="center" class="ma-0">
                <v-col cols="12" sm="8" md="5" lg="4" xl="3">
                    <v-card elevation="0" class="pa-6 rounded-lg">
                        <v-img :src="loginBg" height="80" class="mx-auto my-12"></v-img>

                        <v-alert v-if="error" type="error" class="mb-4" dense border="left" colored-border dismissible>
                            {{ error }}
                        </v-alert>


                        <v-form @submit.prevent="handleLogin">
                            <v-text-field v-model="username" label="Correo electrónico" hide-details="auto" outlined
                                dense class="mb-4" required>
                                <template #prepend-inner>
                                    <div class="me-2 d-flex align-center">
                                        <i class="bx bx-envelope"></i>
                                    </div>
                                </template>
                            </v-text-field>

                            <v-text-field v-model="password" type="password" label="Contraseña" hide-details="auto"
                                outlined dense class="mb-6" required>
                                <template v-slot:prepend-inner>
                                    <div class="me-2 d-flex align-center">
                                        <i class="bx bx-lock"></i>
                                    </div>

                                </template>
                            </v-text-field>

                            <v-checkbox v-model="rememberMe" label="Recordarme" class="mb-4"></v-checkbox>

                            <v-btn type="submit" color="black" class="py-3 font-weight-medium" block
                                :loading="isLoading">
                                Iniciar sesión
                            </v-btn>
                             
                            <v-divider class="my-4"></v-divider>
                            <!-- <div class="text-center">
                                <p class="text-sm"><router-link to="/reset-password" class="text-primary">Recuperar contraseña</router-link></p>
                            </div> -->
                        </v-form>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
        <v-footer  padless app class="white--text custom-bg" style="position: fixed; bottom: 0; width: 100%; height: 64px;" >
            <v-container>
                <v-row align="center" justify="space-between" class="mx-0 px-0">
                    <v-col cols="12" sm="5" class="text-sm-left text-center mb-2 mb-sm-0 " style="font-size: 12px;">
                        © {{ new Date().getFullYear() }} BodegApp
                        <br> Todos los derechos reservados.
                    </v-col>                    
                </v-row>
            </v-container>
        </v-footer>
        
    </v-app>
</template>

<script>
import loginBg from '@/assets/logo.png'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import socket from "@/socket";

export default {
    data() {
        return {
            username: '',
            password: '',
            isLoading: false,
            loginBg,
            error: '',
            rememberMe: false,
            socket
        }
    },
    created() {
        const rm = localStorage.getItem('rememberMe');
        if (rm === 'true') {
            this.rememberMe = true;
            this.username = localStorage.getItem('username') || '';
            this.password = localStorage.getItem('password') || '';
        }
    },
    methods: {
        
        async handleLogin() {
            try {
                this.isLoading = true;
                const response = await apiClient.post('/api/auth/login', {
                    email: this.username,
                    password: this.password
                });
                // guardar o limpiar credenciales según Recordarme
                if (this.rememberMe) {
                    localStorage.setItem('username', this.username);
                    localStorage.setItem('password', this.password);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                    localStorage.setItem('rememberMe', 'false');
                }
                const authStore = useAuthStore()
                authStore.setAuth({
                    token: response.data.token,
                    refreshToken: response.data.refreshToken,
                    user: response.data.user
                })
                const redirectRoute = response.data.route || 'AdminDashboard';
                this.$router.push({ name: redirectRoute });
            } catch (err) {
                console.error('Error al loguear:', err.response?.data || err);
                this.error = err.response?.data?.error || 'Error al iniciar sesión.';
            } finally {
                this.isLoading = false;
            }
        }
    }
}
</script>

<style scoped>

</style>
