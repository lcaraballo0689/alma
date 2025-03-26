<template>
  <!-- Contenedor principal con altura completa, aplicando clases dark si corresponde -->
  <div
    class="container-fluid vh-100"
    :class="{ 'bg-dark text-light': themeStore.theme === 'dark' }"
  >
    <div class="row g-0 h-100">
      <!-- Columna del formulario: ocupa 100% en móvil y 33% en pantallas grandes -->
      <div
        class="col-12 col-lg-4 d-flex flex-column justify-content-center align-items-center"
      >
        <!-- Se aplica un fondo oscuro y estilos de padding/redondeado al formulario si el tema es dark -->
        <div
          class="w-100"
          style="max-width: 400px"
          :class="{
            'bg-dark text-light p-4 rounded': themeStore.theme === 'dark',
          }"
        >
          <form
            class="needs-validation"
            @submit.prevent="handleLogin"
            novalidate
          >
            <!-- Logo -->
            <div class="text-center mb-4">
              <img :src="Logo" alt="Logo" style="max-width: 200px" />
            </div>
            <div class="mb-3 fw-bold fs-4">
              <label for="input-1" class="form-label">Correo</label>
              <input
                type="email"
                id="input-1"
                v-model="email"
                class="form-control"
                placeholder="Correo"
                required
              />
              <div class="invalid-feedback">
                Por favor, ingresa un correo válido.
              </div>
            </div>
            <div class="mb-3 fw-bold fs-4">
              <label for="input-2" class="form-label">Contraseña</label>
              <input
                type="password"
                id="input-2"
                v-model="password"
                class="form-control"
                placeholder="Contraseña"
                required
              />
              <div class="invalid-feedback">
                Por favor, ingresa tu contraseña.
              </div>
            </div>
            <div class="form-footer">
              <button
                type="submit"
                class="btn btn-dark w-100"
                :disabled="loading"
              >
                <div v-if="loading">
                  <i class="fa fa-spinner fa-spin fa-fw me-1"></i>
                  <span>Iniciando sesión...</span>
                </div>
                <span v-else>Iniciar sesión</span>
              </button>
            </div>
            <div v-if="error" class="text-danger mt-2" style="font-size: small">
              <i class="bi bi-x-circle text-danger"></i> {{ error }}
            </div>
          </form>
        </div>
      </div>

      <!-- Columna de la imagen: se muestra solo en pantallas grandes -->
      <div class="col-12 col-lg-8 d-none d-lg-block">
        <img
          :src="loginBg"
          class="w-100 h-100"
          style="object-fit: cover"
          alt="Imagen de fondo para el login"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import apiClient from "@/services/api";
import loginBg from "@/assets/img/01.jpg";
import Logo from "../assets/img/siglo.png";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import socket from "@/socket"; // Importa el módulo de socket (configurado en el backend)
import { useNotificationStore } from "@/stores/notificationStore";

export default {
  name: "Login",
  data() {
    return {
      loginBg,
      Logo,
      email: "",
      password: "",
      error: "",
      loading: false,
      themeStore: useThemeStore(), // Store del tema para estilos dinámicos
    };
  },
  methods: {
    async handleLogin() {
      this.error = "";
      this.loading = true;

      if (!this.email || !this.password) {
        this.error = "Debes ingresar el Correo y la Contraseña.";
        this.loading = false;
        return;
      }

      try {
        const response = await apiClient.post("/api/auth/login", {
          email: this.email,
          password: this.password,
        });

        // Extraer tokens y demás datos
        const token = response.data.token;
        const refreshToken = response.data.refreshToken;
        const permisos = response.data.permisos;

        const authStore = useAuthStore();
        authStore.setToken(token);
        authStore.setRefreshToken && authStore.setRefreshToken(refreshToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Decodificar el token para extraer datos del usuario
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(atob(base64));
        authStore.setUser(decoded);

        // Mostrar mensaje de éxito
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "success",
          title: "Inicio de sesión exitoso",
          timer: 5000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // Recuperar notificaciones históricas para el usuario
        const notificationStore = useNotificationStore();
        try {
          const notifResponse = await apiClient.get(
            "/api/notificaciones/historico",
            {
              headers: { Authorization: `${token}` },
            }
          );
          // Se asume que la respuesta tiene una propiedad 'notifications'
          notificationStore.setNotifications(notifResponse.data.notifications);
        } catch (error) {
          console.error("Error al obtener notificaciones:", error);
        }

        // Emitir el evento para unirse a la sala. Se usa el evento "Notificaciones"
        // Según nuestro socket, este evento une al cliente a la sala "usuario_<clienteId>"
        socket.emit("Notificaciones", {
          clienteId: decoded.clienteId,
          usuarioId: decoded.id,
        });
        console.log(
          "Usuario se ha unido a la sala: usuario_" + decoded.clienteId
        );


        // Redirigir según el tipo de usuario
        if (decoded.tipoUsuarioId === 1) {
          this.$router.push({ name: "AdminDashboard" });
        } else {
          this.$router.push({ name: "ClientHome" });
        }
      } catch (err) {
        console.error(
          "Error en login:",
          err.response ? err.response.data : err
        );
        const errorMsg =
          err.response?.data?.error ||
          "Error al iniciar sesión. Verifica tus credenciales.";
        this.error = errorMsg;
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "error",
          title: errorMsg,
          timer: 5000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
img {
  object-fit: cover;
}
</style>
