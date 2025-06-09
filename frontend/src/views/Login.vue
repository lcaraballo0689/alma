<template>
  <div class="login-bg">
    <div 
      class="background-image"
      :style="{ backgroundImage: `url(${backgroundImage})` }"
    ></div>
    <div class="background-overlay"></div>
    
    <!-- Selector de idioma -->
    <div class="language-selector">
      <button 
        v-for="lang in languages" 
        :key="lang.code"
        @click="changeLanguage(lang.code)"
        :class="['lang-btn', { active: currentLang === lang.code }]"
        :title="lang.name"
      >
        {{ lang.shortName }}
      </button>
    </div>

    <div class="flip-container" :class="{ 'flipped': isFlipped }">
      <div class="flipper">
        <!-- Frente - Login Form -->
        <div class="front">
          <div class="login-card">
      <img :src="Logo" alt="Logo" class="login-logo" />
      
      <form @submit.prevent="handleLogin" class="login-form-minimal" novalidate>
        <h2 class="login-title">{{ $t('login') }}</h2>
        
        <!-- Email Input -->
        <div class="form-group">
          <div class="input-wrapper">
            <i class="bi bi-envelope input-icon"></i>
            <input
              type="email"
              v-model="email"
              :placeholder="$t('emailPlaceholder')"
              @input="validateEmail"
              required
              class="input-minimal"
              autocomplete="username"
            />
          </div>
          <span v-if="emailError" class="error-minimal">
            <i class="bi bi-exclamation-circle"></i>
            {{ emailError }}
          </span>
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <div class="input-wrapper">
            <i class="bi bi-lock input-icon"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              :placeholder="$t('passwordPlaceholder')"
              @input="validatePassword"
              required
              class="input-minimal"
              autocomplete="current-password"
            />
            <button 
              type="button" 
              class="showpass-btn" 
              @click="showPassword = !showPassword"
              :aria-label="$t('accessibility.showPassword')"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <span v-if="passwordError" class="error-minimal">
            <i class="bi bi-exclamation-circle"></i>
            {{ passwordError }}
          </span>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="login-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe">
            <span>{{ $t('rememberMe') }}</span>
          </label>
          <a href="#" @click.prevent="handleForgotPassword" class="forgot-link">
            {{ $t('forgotPassword') }}
          </a>
        </div>

        <!-- Login Button -->
        <button type="submit" class="btn-minimal" :disabled="loading || !isFormValid">
          <i class="bi bi-box-arrow-in-right" v-if="!loading"></i>
          <span v-if="!loading">{{ $t('login') }}</span>
          <span v-else class="loader-minimal"></span>
        </button>

        <!-- Error Messages -->
        <transition name="fade-slide">
          <div v-if="error" class="error-minimal-main">
            <i class="bi bi-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
        </transition>

        <!-- Versión -->
        <div class="version-info">
          <small>v{{ version }}</small>
        </div>
      </form>
          </div>
        </div>

        <!-- Parte posterior - Forgot Password Form -->
        <div class="back">
          <div class="login-card">
            <ForgotPasswordForm 
              @cancel="handleCancelForgotPassword"
              @success="handleForgotPasswordSuccess"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n';
import Swal from "sweetalert2";
import apiClient from "@/services/api";
import Logo from "@/assets/img/siglo.png";
import { useAuthStore } from "@/stores/authStore";
import pkg from '../../package.json';
import { getRandomDocumentImage } from '@/services/unsplash';
import ForgotPasswordForm from '@/components/ForgotPasswordForm.vue';

export default {
  name: "Login",
  components: {
    ForgotPasswordForm
  },

  data() {
    const { t, locale } = useI18n();
    
    return {
      t,
      Logo,
      email: "",
      password: "",
      error: "",
      emailError: "",
      passwordError: "",
      loading: false,
      showPassword: false,
      rememberMe: false,
      version: pkg.version,
      loginAttempts: 0,
      lastLoginAttempt: null,
      languages: [
        { code: 'es', name: 'Español', shortName: 'ES' },
        { code: 'en', name: 'English', shortName: 'EN' }
      ],
      currentLang: 'es',
      backgroundImage: '/images/backgrounds/milad-fakurian-tGTa40GKSRI-unsplash.jpg',
      imageError: false,
      isFlipped: false
    };
  },

  computed: {
    isFormValid() {
      return this.email && 
             this.password && 
             !this.emailError && 
             !this.passwordError;
    }
  },

  mounted() {
    this.loadBackgroundImage();
  },

  methods: {
    loadBackgroundImage() {
      try {
        const imagePath = getRandomDocumentImage();
        if (imagePath) {
          const img = new Image();
          img.onload = () => {
            this.backgroundImage = imagePath;
            this.imageError = false;
          };
          img.onerror = () => {
            console.error('Error loading background image:', imagePath);
            this.imageError = true;
          };
          img.src = imagePath;
        }
      } catch (error) {
        console.error('Error setting background image:', error);
        this.imageError = true;
      }
    },

    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.email) {
        this.emailError = this.$t('errors.emailRequired');
      } else if (!emailRegex.test(this.email)) {
        this.emailError = this.$t('errors.emailInvalid');
      } else {
        this.emailError = "";
      }
    },

    validatePassword() {
      if (!this.password) {
        this.passwordError = this.$t('errors.passwordRequired');
      } else if (this.password.length < 6) {
        this.passwordError = this.$t('errors.passwordLength');
      } else {
        this.passwordError = "";
      }
    },

    checkLoginThrottle() {
      const now = Date.now();
      const timeSinceLastAttempt = now - (this.lastLoginAttempt || 0);
      
      if (this.loginAttempts >= 3 && timeSinceLastAttempt < 300000) {
        throw new Error(this.$t('errors.tooManyAttempts'));
      }
      
      if (timeSinceLastAttempt > 300000) {
        this.loginAttempts = 0;
      }
    },

    async handleLogin() {
      try {
        this.error = "";
        this.validateEmail();
        this.validatePassword();
        
        if (!this.isFormValid) {
          return;
        }

        this.checkLoginThrottle();
        this.loading = true;

        const authStore = useAuthStore();
        const result = await authStore.login({
          email: this.email,
          password: this.password,
          remember: this.rememberMe
        });

        // Redirigir según el tipo de usuario
        if (result.success) {
          if (result.tipoUsuarioId === 1) {
            this.$router.push('/Admin');
          } else if (result.tipoUsuarioId === 2) {
            this.$router.push('/User');
          } else {
            this.$router.push('/');
          }
        }

      } catch (err) {
        console.error("Error en login:", err);
        this.loginAttempts++;
        this.lastLoginAttempt = Date.now();
        
        let errorMsg;
        if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.message) {
          errorMsg = err.message;
        } else {
          errorMsg = this.$t('errors.loginError');
        }
        
        this.error = errorMsg;
        
        // Mostrar toast de error
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "error",
          title: this.$t('errors.accessError'),
          text: errorMsg,
          timer: 5000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } finally {
        this.loading = false;
      }
    },

    handleForgotPassword() {
      this.isFlipped = true;
    },

    handleCancelForgotPassword() {
      this.isFlipped = false;
    },

    handleForgotPasswordSuccess(message) {
      Swal.fire({
        icon: 'success',
        title: this.$t('checkYourEmail'),
        text: message,
        confirmButtonText: this.$t('ok')
      });
      this.isFlipped = false;
    },

    changeLanguage(lang) {
      this.currentLang = lang;
      this.$i18n.locale = lang;
      localStorage.setItem('lang', lang);
    }
  }
};
</script>

<style scoped>
.login-bg {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.5s ease;
  z-index: 1;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0);
  z-index: 2;
}

.flip-container {
  perspective: 1000px;
  width: 100%;
  max-width: 400px;
  z-index: 3;
}

.flipper {
  position: relative;
  width: 100%;
  min-height: 600px; /* Altura mínima para el contenedor */
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.flip-container.flipped .flipper {
  transform: rotateY(180deg);
}

.front, .back {
  position: absolute;
  width: 100%;
  min-height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden; /* Safari */
}

.front {
  transform: rotateY(0deg);
}

.back {
  transform: rotateY(180deg);
}

.login-card {
  width: 100%;
  min-height: 100%;
  padding: 3rem 2.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4CAF50, #2196F3, #4CAF50);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.login-logo {
  width: 120px;
  height: auto;
  margin: 0 0 2.5rem 0;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.login-logo:hover {
  transform: scale(1.05);
}

.login-form-minimal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-title {
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.form-group {
  position: relative;
  margin-bottom: 1.5rem;
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

.input-minimal::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.input-minimal:focus {
  outline: none;
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

.error-minimal {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6c757d;
  margin: 1rem 0;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  transition: color 0.3s ease;
}

.remember-me:hover {
  color: #4CAF50;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #4CAF50;
  cursor: pointer;
}

.forgot-link {
  color: #4CAF50;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.forgot-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.forgot-link:hover::after {
  width: 100%;
}

.version-info {
  text-align: center;
  color: #9ca3af;
  font-size: 0.75rem;
  margin-top: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.language-selector {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.25rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.lang-btn {
  background: transparent;
  border: none;
  color: #6c757d;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.lang-btn:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.lang-btn.active {
  background: #4CAF50;
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loader-minimal {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.showpass-btn {
  position: absolute;
  right: 1.25rem;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.showpass-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #4CAF50;
}

.showpass-btn:active {
  transform: scale(0.95);
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

/* Responsive Design */
@media (max-width: 640px) {
  .flip-container {
    max-width: calc(100% - 2rem);
    margin: 0 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-logo {
    width: 100px;
    margin-bottom: 2rem;
  }

  .language-selector {
    top: 1rem;
    right: 1rem;
  }

  .lang-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
}

/* Animación de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form-minimal > * {
  animation: fadeInUp 0.6s ease backwards;
}

.login-form-minimal > *:nth-child(1) { animation-delay: 0.1s; }
.login-form-minimal > *:nth-child(2) { animation-delay: 0.2s; }
.login-form-minimal > *:nth-child(3) { animation-delay: 0.3s; }
.login-form-minimal > *:nth-child(4) { animation-delay: 0.4s; }
.login-form-minimal > *:nth-child(5) { animation-delay: 0.5s; }
.login-form-minimal > *:nth-child(6) { animation-delay: 0.6s; }

/* Mejora para el campo de contraseña con botón mostrar/ocultar */
.input-wrapper:has(.showpass-btn) .input-minimal {
  padding-right: 3rem;
}

/* Efecto de brillo suave en el logo */
@keyframes logoGlow {
  0%, 100% {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }
  50% {
    filter: drop-shadow(0 6px 12px rgba(76, 175, 80, 0.2));
  }
}

.login-logo {
  animation: logoGlow 3s ease-in-out infinite;
}
</style>
