<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Mostrar información del perfil -->
        <v-card class="mb-6">
          <v-card-title>Perfil</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item v-for="field in profileFields" :key="field.key">
                <v-list-item-content>
                  <v-list-item-title>{{ field.label }}</v-list-item-title>
                  <v-list-item-subtitle>{{
                    useAuthStore.user[field.key]
                  }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Sección: Contraseña -->
        <v-card class="">
          <v-card-title>Actualizar Contraseña</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Nueva Contraseña"
                @input="validatePassword"
              />

              <!-- Lista dinámica de validación de requisitos -->
              <ul
                class="list-unstyled mt-2"
                v-if="password"
                style="list-style: none"
              >
                <li v-for="check in passwordChecks" :key="check.text">
                  <i
                    :class="
                      check.valid
                        ? 'bx bx-check text-success'
                        : 'bx bx-x text-danger'
                    "
                  ></i>
                  <small class="ms-1">{{ check.text }}</small>
                </li>
              </ul>
              <div v-if="passwordError" class="text-danger small">
                {{ passwordError }}
              </div>
              <v-text-field
                class="mt-2"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirmar Contraseña"
                @input="validateConfirmPassword"
              />
            </v-form>

            <v-btn
              color="success"
              :disabled="!isFormValid"
              @click="updatePassword"
              >Actualizar</v-btn
            >
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from "@/stores/auth";
import apiClient from "@/services/api";

export default {
  name: "SettingsView",
  data() {
    return {
      profileFields: [
        { key: "nombre", label: "Nombre" },
        { key: "email", label: "Correo electrónico" },
        { key: "telefono", label: "Teléfono" },
        { key: "direccion", label: "Dirección" },
      ],
      useAuthStore: useAuthStore(),
      password: "",
      confirmPassword: "",
      passwordError: "",
      confirmPasswordError: "",
      showPassword: false,
      showConfirmPassword: false,
    };
  },
  computed: {
    passwordChecks() {
      const pwd = this.password || "";
      return [
        { text: "Al menos 8 caracteres", valid: pwd.length >= 8 },
        { text: "Contiene letra minúscula", valid: /[a-z]/.test(pwd) },
        { text: "Contiene letra mayúscula", valid: /[A-Z]/.test(pwd) },
        { text: "Contiene número", valid: /\d/.test(pwd) },
        { text: "Contiene símbolo", valid: /[\W_]/.test(pwd) },
      ];
    },
    isFormValid() {
      return !this.passwordError && !this.confirmPasswordError;
    },
  },
  methods: {
    validatePassword() {
      const pwd = this.password || "";
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (pwd && !regex.test(pwd)) {
        this.passwordError = "La contraseña no cumple todos los requisitos.";
      } else {
        this.passwordError = "";
      }
    },
    validateConfirmPassword() {
      if (
        this.password &&
        this.confirmPassword &&
        this.password !== this.confirmPassword
      ) {
        this.confirmPasswordError = "Las contraseñas no coinciden.";
      } else {
        this.confirmPasswordError = "";
      }
    },
    async updatePassword() {
      if (!this.isFormValid) return;
      try {
        // Lógica para actualizar la contraseña en el servidor
        await apiClient.post(
          "/api/usuarios/updatepass/" + this.useAuthStore.user.id,
          { password: this.password }
        );
        this.password = "";
        this.confirmPassword = "";
        this.passwordError = "";
        this.confirmPasswordError = "";
      } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        this.passwordError =
          "Error al actualizar la contraseña. Inténtalo de nuevo.";
      }
    },
  },
};
</script>

<style scoped>
.input-group {
  display: flex;
  align-items: center;
}
</style>
