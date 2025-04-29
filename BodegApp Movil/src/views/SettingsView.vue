<template>
  <v-app>
    <v-main>
      <v-container>
        <h1>Configuración de Usuario</h1>

        <!-- Mostrar información del perfil -->
        <v-card class="mb-6">
          <v-card-title>Perfil</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item
                v-for="field in profileFields"
                :key="field.key"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ field.label }}</v-list-item-title>
                  <v-list-item-subtitle>{{ useAuthStore.user[field.key] }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Sección: Contraseña -->
        <h6 class="mb-2 fw-bold">Cambiar Contraseña</h6>
        <div class="row row-cols-1 row-cols-md-2 g-3">
          <div class="col">
            <label class="form-label">Nueva Contraseña</label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control"
                v-model="password" placeholder="Ingrese la nueva contraseña" @input="validatePassword" />
              <button type="button" class="btn btn-outline-secondary" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'bx bx-show' : 'bx bx-hide'"></i>
              </button>
            </div>
            <!-- Lista dinámica de validación de requisitos -->
            <ul class="list-unstyled mt-2" v-if="password">
              <li v-for="check in passwordChecks" :key="check.text">
                <i :class="check.valid ? 'bx bx-check text-success' : 'bx bx-x text-danger'"></i>
                <small class="ms-1">{{ check.text }}</small>
              </li>
            </ul>
            <div v-if="passwordError" class="text-danger small">
              {{ passwordError }}
            </div>
          </div>
          <div class="col">
            <label class="form-label">Confirmar Contraseña</label>
            <div class="input-group">
              <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control"
                v-model="confirmPassword" placeholder="Repita la nueva contraseña" @input="validateConfirmPassword" />
              <button type="button" class="btn btn-outline-secondary"
                @click="showConfirmPassword = !showConfirmPassword">
                <i :class="showConfirmPassword ? 'bx bx-show' : 'bx bx-hide'"></i>
              </button>
            </div>
            <div v-if="confirmPasswordError" class="text-danger small mt-1">
              {{ confirmPasswordError }}
            </div>
          </div>
        </div>

        <div class="mt-4">
          <button class="btn btn-success" :disabled="!isFormValid" @click="updatePassword">
            <i class="bx bx-save me-1"></i> Guardar Cambios
          </button>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'SettingsView',
  data() {
    return {
      profileFields: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'email', label: 'Correo electrónico' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'direccion', label: 'Dirección' }
      ],
      useAuthStore: useAuthStore(),
      password: '',
      confirmPassword: '',
      passwordError: '',
      confirmPasswordError: '',
      showPassword: false,
      showConfirmPassword: false
    };
  },
  computed: {
    passwordChecks() {
      const pwd = this.password || '';
      return [
        { text: 'Al menos 8 caracteres', valid: pwd.length >= 8 },
        { text: 'Contiene letra minúscula', valid: /[a-z]/.test(pwd) },
        { text: 'Contiene letra mayúscula', valid: /[A-Z]/.test(pwd) },
        { text: 'Contiene número', valid: /\d/.test(pwd) },
        { text: 'Contiene símbolo', valid: /[\W_]/.test(pwd) }
      ];
    },
    isFormValid() {
      return !this.passwordError && !this.confirmPasswordError;
    }
  },
  methods: {
    validatePassword() {
      const pwd = this.password || '';
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (pwd && !regex.test(pwd)) {
        this.passwordError = 'La contraseña no cumple todos los requisitos.';
      } else {
        this.passwordError = '';
      }
    },
    validateConfirmPassword() {
      if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
        this.confirmPasswordError = 'Las contraseñas no coinciden.';
      } else {
        this.confirmPasswordError = '';
      }
    },
    async updatePassword() {
      if (!this.isFormValid) return;
      try {
        // Lógica para actualizar la contraseña en el servidor
        await this.$api.put('/api/usuarios/cambiar-password', { password: this.password });
        this.$notify({ title: 'Éxito', text: 'Contraseña actualizada correctamente.', type: 'success' });
        this.password = '';
        this.confirmPassword = '';
      } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        this.$notify({ title: 'Error', text: 'No se pudo actualizar la contraseña.', type: 'error' });
      }
    }
  }
};
</script>

<style scoped>
.input-group {
  display: flex;
  align-items: center;
}
</style>