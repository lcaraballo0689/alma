<template>
  <transition 
    name="modal-fade"
    @enter="modalEnter"
    @leave="modalLeave"
  >
    <div 
      v-if="visible" 
      class="modal-backdrop" 
      @click.self="$emit('close')"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
    >
      <div class="modal-modern">
        <div class="modal-header-modern">
          <div class="modal-title-section">
            <i class="bi bi-shield-lock modal-icon" aria-hidden="true"></i>
            <h3 id="password-modal-title">Cambiar Contraseña</h3>
          </div>
          <button 
            class="close-button" 
            @click="$emit('close')"
            aria-label="Cerrar modal de cambio de contraseña"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <form 
          @submit.prevent="handleChangePassword" 
          class="modal-form"
          novalidate
        >
          <div class="modal-body-modern">
            <!-- Campo nueva contraseña -->
            <div class="form-group-modern">
              <label class="form-label-modern">Nueva Contraseña</label>
              <div class="input-group-modern">
                <i class="bi bi-lock input-icon"></i>
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  class="input-modern"
                  v-model="newPassword" 
                  @input="validatePassword"
                  placeholder="Ingrese su nueva contraseña"
                  required 
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>

              <!-- Validación de requisitos -->
              <div class="password-requirements">
                <div 
                  v-for="check in passwordChecks" 
                  :key="check.text" 
                  class="requirement-item"
                  :class="{ valid: check.valid }"
                >
                  <i :class="check.valid ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
                  <span>{{ check.text }}</span>
                </div>
              </div>
            </div>

            <!-- Campo confirmar contraseña -->
            <div class="form-group-modern">
              <label class="form-label-modern">Confirmar Contraseña</label>
              <div class="input-group-modern">
                <i class="bi bi-lock-fill input-icon"></i>
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  class="input-modern"
                  v-model="confirmPassword" 
                  @input="validateConfirmPassword"
                  placeholder="Confirme su nueva contraseña"
                  required 
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
              <div v-if="confirmPasswordError" class="error-message">
                <i class="bi bi-exclamation-circle"></i>
                {{ confirmPasswordError }}
              </div>
            </div>
          </div>

          <div class="modal-footer-modern">
            <button type="button" class="btn-modern btn-secondary" @click="$emit('close')">
              <i class="bi bi-x-circle"></i>
              Cancelar
            </button>
            <button type="submit" class="btn-modern btn-minimal" :disabled="!isFormValid">
              <i class="bi bi-check-circle"></i>
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script>
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import Swal from "sweetalert2";

export default {
  name: "PasswordChangeModal",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      passwordChecks: [
        { text: "Al menos 8 caracteres", valid: false },
        { text: "Contiene al menos una letra mayúscula", valid: false },
        { text: "Contiene al menos una letra minúscula", valid: false },
        { text: "Contiene al menos un número", valid: false },
        { text: "Contiene al menos un carácter especial", valid: false }
      ],
      passwordError: '',
      confirmPasswordError: '',
      isFormValid: false
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    }
  },
  methods: {
    async handleChangePassword() {
      // Validar la contraseña antes de enviar
      this.validatePassword();
      this.validateConfirmPassword();
      
      if (!this.isFormValid) {
        return Swal.fire({ 
          icon: 'warning', 
          title: 'Validación Fallida', 
          text: 'Por favor, asegúrese de que la contraseña cumpla con todos los requisitos y que ambas contraseñas coincidan.',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false
        });
      }
      
      try {
        await apiClient.put(`/api/users/${this.authStore.user.id}/password`, { password: this.newPassword });
        // El éxito se maneja automáticamente por el interceptor
        this.$emit('close');
        this.resetForm();
        Swal.fire({
          icon: 'success',
          title: 'Contraseña Actualizada',
          text: 'Su contraseña ha sido actualizada exitosamente.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      } catch (error) {
        // Los errores se manejan automáticamente por el interceptor
        console.error('Error al actualizar contraseña:', error);
      }
    },
    
    validatePassword() {
      const pwd = this.newPassword || '';
      
      // Actualizar los checks de validación
      this.passwordChecks = [
        { text: 'Al menos 8 caracteres', valid: pwd.length >= 8 },
        { text: 'Contiene letra minúscula', valid: /[a-z]/.test(pwd) },
        { text: 'Contiene letra mayúscula', valid: /[A-Z]/.test(pwd) },
        { text: 'Contiene número', valid: /\d/.test(pwd) },
        { text: 'Contiene símbolo', valid: /[\W_]/.test(pwd) }
      ];

      // Validar con regex completo
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (pwd && !regex.test(pwd)) {
        this.passwordError = 'La contraseña no cumple todos los requisitos.';
        this.isFormValid = false;
      } else {
        this.passwordError = '';
        this.validateConfirmPassword(); // Validar también la confirmación
      }
    },
    
    validateConfirmPassword() {
      if (this.newPassword && this.confirmPassword && this.newPassword !== this.confirmPassword) {
        this.confirmPasswordError = 'Las contraseñas no coinciden.';
        this.isFormValid = false;
      } else {
        this.confirmPasswordError = '';
        // Solo es válido si la contraseña cumple los requisitos y coinciden
        this.isFormValid = !this.passwordError && this.newPassword === this.confirmPassword && this.newPassword !== '';
      }
    },
    
    resetForm() {
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordError = '';
      this.confirmPasswordError = '';
      this.isFormValid = false;
      this.passwordChecks.forEach(check => check.valid = false);
    },
    
    modalEnter(el) {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9)';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
      }, 10);
    },
    
    modalLeave(el) {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9)';
    }
  },
  watch: {
    visible(val) {
      if (!val) {
        this.resetForm();
      }
    }
  }
};
</script>

<style scoped>
/* Modal moderno */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  padding: 1rem;
  transition: opacity 0.3s ease;
}

.modal-modern {
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  transition: transform 0.3s ease;
  border: 1px solid #e9ecef;
  width: 95%;
  margin: 1rem;
}

@keyframes modalSlide {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #ffffff;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  font-size: 2rem;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-title-section h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #f8f9fa;
  color: #1a1a1a;
}

.modal-body-modern {
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
  background: #ffffff;
}

.modal-form {
  margin: 0;
}

/* Form groups modernos */
.form-group-modern {
  margin-bottom: 1.5rem;
}

.form-label-modern {
  display: block;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  font-weight: 600;
  font-size: 0.95rem;
}

.input-group-modern {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.input-group-modern:focus-within {
  border-color: #4CAF50;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #6c757d;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.input-group-modern:focus-within .input-icon {
  color: #4CAF50;
}

.input-modern {
  width: 100%;
  padding: 1rem 3rem;
  background: transparent;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
  outline: none;
}

.input-modern::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #6c757d;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
}

.toggle-password:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #4CAF50;
}

/* Password requirements */
.password-requirements {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  color: #6c757d;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.requirement-item.valid {
  color: #4CAF50;
  font-weight: 500;
}

.requirement-item i {
  font-size: 1rem;
}

/* Error messages */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #dc3545;
  font-size: 0.875rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal footer */
.modal-footer-modern {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background: #ffffff;
}

/* Botones modernos */
.btn-modern {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
}

.btn-minimal {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-minimal::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  transition: left 0.5s ease;
}

.btn-minimal:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-minimal:hover:not(:disabled)::before {
  left: 100%;
}

.btn-minimal:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
}

.btn-minimal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #e0e0e0;
  box-shadow: none;
}

.btn-secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 2px solid #e9ecef;
  padding: 0 1.25rem;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #dee2e6;
  transform: translateY(-1px);
}

/* Transiciones para modales */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-modern {
    width: 95%;
    margin: 1rem;
  }
}
</style> 