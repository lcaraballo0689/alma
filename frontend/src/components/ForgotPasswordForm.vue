<template>
  <div class="forgot-password-form">
    <!-- Paso 1: Solicitar código OTP -->
    <form 
      v-if="currentStep === 1" 
      @submit.prevent="requestOTP" 
      class="login-form-minimal" 
      novalidate
    >
      <div class="form-header">
        <i class="bi bi-shield-lock text-icon"></i>
        <h2 class="login-title">{{ $t('forgotPassword') }}</h2>
        <p class="form-description">{{ $t('forgotPasswordDescription') }}</p>
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('emailPlaceholder') }}</label>
        <div class="input-wrapper">
          <i class="bi bi-envelope input-icon"></i>
          <input
            type="email"
            v-model="email"
            :placeholder="$t('emailExample')"
            required
            class="input-minimal"
            :disabled="loading"
            @input="validateEmail"
          />
        </div>
        <transition name="fade">
          <span v-if="emailError" class="error-minimal">
            <i class="bi bi-exclamation-circle"></i>
            {{ $t('invalidEmail') }}
          </span>
        </transition>
      </div>

      <div class="buttons-group">
        <button 
          type="button" 
          class="btn-minimal btn-secondary" 
          @click="$emit('cancel')"
          :disabled="loading"
        >
          <i class="bi bi-arrow-left"></i>
          {{ $t('backToLogin') }}
        </button>
        <button 
          type="submit" 
          class="btn-minimal btn-primary" 
          :disabled="loading || !isEmailValid"
        >
          <i class="bi bi-send" v-if="!loading"></i>
          <span v-if="!loading">{{ $t('sendOTPCode') }}</span>
          <span v-else class="loader-minimal"></span>
        </button>
      </div>

      <transition name="fade-slide">
        <div v-if="error" class="error-minimal-main">
          <i class="bi bi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
      </transition>
    </form>

    <!-- Paso 2: Validar código OTP -->
    <form 
      v-if="currentStep === 2" 
      @submit.prevent="validateOTP" 
      class="login-form-minimal" 
      novalidate
    >
      <div class="form-header">
        <i class="bi bi-shield-check text-icon"></i>
        <h2 class="login-title">{{ $t('verifyOTPCode') }}</h2>
        <p class="form-description">
          {{ $t('otpSentToEmail', { email: email }) }}
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('otpCodePlaceholder') }}</label>
        <div class="input-wrapper">
          <i class="bi bi-key input-icon"></i>
          <input
            type="text"
            v-model="otpCode"
            :placeholder="$t('otpCodeExample')"
            required
            class="input-minimal otp-input"
            :disabled="loading"
            maxlength="6"
            @input="formatOTPInput"
          />
        </div>
        <transition name="fade">
          <span v-if="otpError" class="error-minimal">
            <i class="bi bi-exclamation-circle"></i>
            {{ otpError }}
          </span>
        </transition>
      </div>

      <div class="form-group">
        <div class="resend-section">
          <p class="resend-text">{{ $t('didNotReceiveCode') }}</p>
          <button 
            type="button" 
            class="btn-link" 
            @click="resendOTP"
            :disabled="loading || resendCooldown > 0"
          >
            <span v-if="resendCooldown > 0">
              {{ $t('resendCodeIn', { seconds: resendCooldown }) }}
            </span>
            <span v-else>{{ $t('resendCode') }}</span>
          </button>
        </div>
      </div>

      <div class="buttons-group">
        <button 
          type="button" 
          class="btn-minimal btn-secondary" 
          @click="goBackToEmail"
          :disabled="loading"
        >
          <i class="bi bi-arrow-left"></i>
          {{ $t('backToEmail') }}
        </button>
        <button 
          type="submit" 
          class="btn-minimal btn-primary" 
          :disabled="loading || otpCode.length !== 6"
        >
          <i class="bi bi-check-circle" v-if="!loading"></i>
          <span v-if="!loading">{{ $t('verifyCode') }}</span>
          <span v-else class="loader-minimal"></span>
        </button>
      </div>

      <transition name="fade-slide">
        <div v-if="error" class="error-minimal-main">
          <i class="bi bi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
      </transition>
    </form>

    <!-- Paso 3: Nueva contraseña -->
    <form 
      v-if="currentStep === 3" 
      @submit.prevent="resetPassword" 
      class="login-form-minimal" 
      novalidate
    >
      <div class="form-header">
        <i class="bi bi-lock-fill text-icon success-icon"></i>
        <h2 class="login-title">{{ $t('newPassword') }}</h2>
        <p class="form-description">{{ $t('newPasswordDescription') }}</p>
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('newPasswordPlaceholder') }}</label>
        <div class="input-wrapper">
          <i class="bi bi-lock input-icon"></i>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="newPassword"
            :placeholder="$t('passwordPlaceholder')"
            required
            class="input-minimal"
            :disabled="loading"
            @input="validatePassword"
          />
          <button 
            type="button" 
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <transition name="fade">
          <span v-if="passwordError" class="error-minimal">
            <i class="bi bi-exclamation-circle"></i>
            {{ passwordError }}
          </span>
        </transition>
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('confirmPasswordPlaceholder') }}</label>
        <div class="input-wrapper">
          <i class="bi bi-lock input-icon"></i>
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            :placeholder="$t('confirmPasswordPlaceholder')"
            required
            class="input-minimal"
            :disabled="loading"
            @input="validatePasswordMatch"
          />
          <button 
            type="button" 
            class="toggle-password"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <transition name="fade">
          <span v-if="confirmPasswordError" class="error-minimal">
            <i class="bi bi-exclamation-circle"></i>
            {{ confirmPasswordError }}
          </span>
        </transition>
      </div>

      <div class="password-strength" v-if="newPassword">
        <div class="strength-label">{{ $t('passwordStrength') }}:</div>
        <div class="strength-bars">
          <div 
            v-for="n in 4" 
            :key="n"
            class="strength-bar"
            :class="{ 
              'weak': passwordStrength >= 1 && n <= 1,
              'fair': passwordStrength >= 2 && n <= 2,
              'good': passwordStrength >= 3 && n <= 3,
              'strong': passwordStrength >= 4 && n <= 4
            }"
          ></div>
        </div>
        <span class="strength-text">{{ getPasswordStrengthText() }}</span>
      </div>

      <div class="buttons-group">
        <button 
          type="button" 
          class="btn-minimal btn-secondary" 
          @click="goBackToOTP"
          :disabled="loading"
        >
          <i class="bi bi-arrow-left"></i>
          {{ $t('backToCode') }}
        </button>
        <button 
          type="submit" 
          class="btn-minimal btn-primary" 
          :disabled="loading || !isPasswordValid"
        >
          <i class="bi bi-check-circle" v-if="!loading"></i>
          <span v-if="!loading">{{ $t('updatePassword') }}</span>
          <span v-else class="loader-minimal"></span>
        </button>
      </div>

      <transition name="fade-slide">
        <div v-if="error" class="error-minimal-main">
          <i class="bi bi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
      </transition>
    </form>

    <!-- Paso 4: Éxito -->
    <div v-if="currentStep === 4" class="success-form">
      <div class="form-header">
        <i class="bi bi-check-circle-fill text-icon success-icon"></i>
        <h2 class="login-title">{{ $t('passwordUpdated') }}</h2>
        <p class="form-description">{{ $t('passwordUpdatedDescription') }}</p>
      </div>

      <button 
        class="btn-minimal btn-primary" 
        @click="$emit('success')"
      >
        <i class="bi bi-box-arrow-in-right"></i>
        {{ $t('backToLogin') }}
      </button>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";

export default {
  name: "ForgotPasswordForm",
  
  data() {
    return {
      currentStep: 1,
      
      // Paso 1: Email
      email: "",
      emailError: false,
      
      // Paso 2: OTP
      otpCode: "",
      otpError: null,
      resendCooldown: 0,
      
      // Paso 3: Nueva contraseña
      newPassword: "",
      confirmPassword: "",
      passwordError: null,
      confirmPasswordError: null,
      showPassword: false,
      showConfirmPassword: false,
      passwordStrength: 0,
      
      // Estados generales
      error: null,
      loading: false
    };
  },

  computed: {
    isEmailValid() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(this.email) && !this.emailError;
    },

    isPasswordValid() {
      return this.newPassword && 
             this.confirmPassword && 
             !this.passwordError && 
             !this.confirmPasswordError &&
             this.newPassword === this.confirmPassword &&
             this.passwordStrength >= 2;
    }
  },

  methods: {
    // Validaciones
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.emailError = this.email && !emailRegex.test(this.email);
    },

    formatOTPInput() {
      // Solo permitir números y limitar a 6 dígitos
      this.otpCode = this.otpCode.replace(/\D/g, '').substring(0, 6);
      this.otpError = null;
    },

    validatePassword() {
      const password = this.newPassword;
      this.passwordStrength = this.calculatePasswordStrength(password);
      
      if (password.length < 8) {
        this.passwordError = this.$t('passwordTooShort');
      } else if (this.passwordStrength < 2) {
        this.passwordError = this.$t('passwordTooWeak');
      } else {
        this.passwordError = null;
      }
      
      // Revalidar confirmación si ya hay texto
      if (this.confirmPassword) {
        this.validatePasswordMatch();
      }
    },

    validatePasswordMatch() {
      if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
        this.confirmPasswordError = this.$t('passwordsDontMatch');
      } else {
        this.confirmPasswordError = null;
      }
    },

    calculatePasswordStrength(password) {
      let strength = 0;
      
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;
      
      return Math.min(strength, 4);
    },

    getPasswordStrengthText() {
      const texts = [
        this.$t('passwordVeryWeak'),
        this.$t('passwordWeak'),
        this.$t('passwordFair'),
        this.$t('passwordGood'),
        this.$t('passwordStrong')
      ];
      return texts[this.passwordStrength] || texts[0];
    },

    // Pasos del flujo
    async requestOTP() {
      if (!this.isEmailValid) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await apiClient.post('/api/password-reset/request', {
          email: this.email
        });

        this.currentStep = 2;
        this.startResendCooldown();
      } catch (error) {
        console.error('Error al solicitar código OTP:', error);
        this.error = error.response?.data?.error || this.$t('errors.generalError');
      } finally {
        this.loading = false;
      }
    },

    async validateOTP() {
      if (this.otpCode.length !== 6) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await apiClient.post('/api/password-reset/validate-otp', {
          email: this.email,
          otp: this.otpCode
        });

        this.currentStep = 3;
      } catch (error) {
        console.error('Error al validar código OTP:', error);
        this.otpError = error.response?.data?.error || this.$t('errors.invalidOTP');
        this.error = this.otpError;
      } finally {
        this.loading = false;
      }
    },

    async resetPassword() {
      if (!this.isPasswordValid) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await apiClient.post('/api/password-reset/reset', {
          email: this.email,
          otp: this.otpCode,
          password: this.newPassword
        });

        this.currentStep = 4;
      } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        this.error = error.response?.data?.error || this.$t('errors.generalError');
      } finally {
        this.loading = false;
      }
    },

    async resendOTP() {
      if (this.resendCooldown > 0) return;
      
      await this.requestOTP();
    },

    startResendCooldown() {
      this.resendCooldown = 60;
      const interval = setInterval(() => {
        this.resendCooldown--;
        if (this.resendCooldown <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    },

    // Navegación
    goBackToEmail() {
      this.currentStep = 1;
      this.otpCode = "";
      this.otpError = null;
      this.error = null;
    },

    goBackToOTP() {
      this.currentStep = 2;
      this.newPassword = "";
      this.confirmPassword = "";
      this.passwordError = null;
      this.confirmPasswordError = null;
      this.error = null;
    }
  }
};
</script>

<style scoped>
.forgot-password-form {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
}

.login-form-minimal, .success-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.text-icon {
  font-size: 2.5rem;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
  transition: all 0.3s ease;
}

.success-icon {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.text-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(76, 175, 80, 0.3);
}

.login-title {
  color: #1a1a1a;
  font-size: 1.75rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.form-description {
  color: #6c757d;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto;
}

.form-label {
  color: #495057;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: block;
  font-weight: 600;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #4CAF50;
  background: white;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
}

.input-icon {
  position: absolute;
  left: 1.25rem;
  color: #6c757d;
  z-index: 1;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.input-wrapper:focus-within .input-icon {
  color: #4CAF50;
}

.input-minimal {
  width: 100%;
  padding: 1rem 1.25rem 1rem 3rem;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.otp-input {
  text-align: center;
  letter-spacing: 0.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  padding: 1.25rem;
}

.input-minimal::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.input-minimal:focus {
  outline: none;
}

.input-minimal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: 1.25rem;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  font-size: 1.1rem;
  z-index: 2;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #4CAF50;
}

.toggle-password:active {
  transform: scale(0.95);
}

.resend-section {
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
}

.resend-text {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

.btn-link {
  background: none;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  position: relative;
}

.btn-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.btn-link:hover::after {
  width: 100%;
}

.btn-link:hover {
  background: rgba(76, 175, 80, 0.05);
}

.btn-link:disabled {
  color: #adb5bd;
  cursor: not-allowed;
  background: none;
}

.btn-link:disabled::after {
  display: none;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
}

.strength-label {
  color: #6c757d;
  font-size: 0.875rem;
  min-width: fit-content;
  font-weight: 600;
}

.strength-bars {
  display: flex;
  gap: 0.3rem;
  flex: 1;
}

.strength-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  flex: 1;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.strength-bar.weak {
  background: linear-gradient(90deg, #ff6b6b, #ff5252);
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
}

.strength-bar.fair {
  background: linear-gradient(90deg, #ffc107, #ff9800);
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
}

.strength-bar.good {
  background: linear-gradient(90deg, #4CAF50, #45a049);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.strength-bar.strong {
  background: linear-gradient(90deg, #2196F3, #1976D2);
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
}

.strength-text {
  color: #495057;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.buttons-group {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  margin-top: 1rem;
  width: 100%;
}

.btn-minimal {
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  min-height: 48px;
  position: relative;
  overflow: hidden;
}

.btn-minimal i {
  font-size: 1.1rem;
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

.btn-primary {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
  padding: 0 2rem;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.btn-primary:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
}

.btn-minimal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-minimal {
  color: #dc3545;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.error-minimal-main {
  background: #fee;
  color: #dc3545;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgba(220, 53, 69, 0.2);
  font-weight: 500;
  margin-top: 1rem;
  animation: slideIn 0.3s ease;
}

.loader-minimal {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Animaciones de entrada para los formularios */
.login-form-minimal > *,
.success-form > * {
  animation: fadeIn 0.6s ease backwards;
}

.login-form-minimal > *:nth-child(1) { animation-delay: 0.1s; }
.login-form-minimal > *:nth-child(2) { animation-delay: 0.2s; }
.login-form-minimal > *:nth-child(3) { animation-delay: 0.3s; }
.login-form-minimal > *:nth-child(4) { animation-delay: 0.4s; }
.login-form-minimal > *:nth-child(5) { animation-delay: 0.5s; }
</style> 