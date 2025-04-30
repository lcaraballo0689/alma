import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://vn9mmqm7-3001.use2.devtunnels.ms/',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de request: agrega el token a cada solicitud y muestra información del token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Solo muestra logs en desarrollo
      // if (process.env.NODE_ENV === "development") {
      //   try {
      //     const decoded = parseJwt(token);
      //     if (decoded) {
      //       const currentTime = Date.now() / 1000; // Tiempo actual en segundos
      //       const timeLeft = decoded.exp - currentTime;
      //       if (timeLeft <= 0) {
      //         console.log("[Token Info] El token ha expirado.");
      //         // Opcional: marcar la sesión como expirada
      //         sessionStore.expireSession();
      //       } else {
      //         console.log(
      //           `[Token Info] Token válido. Tiempo restante: ${Math.floor(timeLeft)} segundos.`
      //         );
      //       }
      //     }
      //   } catch (e) {
      //     console.error("[Token Info] Error al decodificar el token:", e);
      //   }
      // }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
