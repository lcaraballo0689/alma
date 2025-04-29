<template>
  <v-app>
    <v-container fluid fill-height>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="pa-6 rounded-lg">
            <v-card-title>Recuperar Contraseña</v-card-title>
            <v-form @submit.prevent="handleReset">
              <v-text-field v-model="email" label="Correo electrónico" outlined :rules="[rules.required, rules.email]" class="mb-4">
                <template #prepend-inner>
                  <i class="bx bx-envelope"></i>
                </template>
              </v-text-field>
              <v-btn type="submit" color="primary" block :loading="isLoading">Enviar enlace</v-btn>
            </v-form>
            <v-alert v-if="success" type="success" class="mt-4">{{ success }}</v-alert>
            <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import apiClient from '@/services/api'

export default {
  name: 'ResetPasswordView',
  data() {
    return {
      email: '',
      isLoading: false,
      success: '',
      error: '',
      rules: {
        required: v => !!v || 'Campo obligatorio',
        email: v => /\S+@\S+\.\S+/.test(v) || 'Email inválido'
      }
    }
  },
  methods: {
    async handleReset() {
      try {
        this.isLoading = true
        const response = await apiClient.post('/api/auth/reset-password', { email: this.email })
        this.success = response.data.message || 'Se envió el enlace de recuperación.'
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al enviar el enlace.'
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
