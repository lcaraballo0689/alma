import axios from "axios";
import Swal from "sweetalert2";
import router from "@/router";
import { useSessionStore } from "@/stores/sessionStore";

// Función para decodificar un JWT usando atob
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando el JWT:", error);
    return null;
  }
}
const hostname = window.location.hostname;

const envURLs = {
  "localhost": "http://localhost:3001", // Desarrollo local
  "127.0.0.1": "http://localhost:3001", // Alternativa localhost
  "bodegapp.siglo21.com.co": "https://api.siglo21.com.co", // Dominio específico
  "vn9mmqm7-5173.use2.devtunnels.ms": "https://vn9mmqm7-3001.use2.devtunnels.ms", // Dominio específico
  "vn9mmqm7-3000.use2.devtunnels.ms": "https://vn9mmqm7-3001.use2.devtunnels.ms", // Dominio específico
};

// Forzar localhost para desarrollo si no encuentra el hostname
const baseURL = envURLs[hostname] || "http://localhost:3001";

// Configuración del API Client establecida



const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request: agrega el token a cada solicitud
apiClient.interceptors.request.use(
  (config) => {
    const sessionStore = useSessionStore();
    const token = sessionStore.token || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables para evitar múltiples refrescos simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log(
      "[Response Error] Status:",
      error.response?.status,
      "URL:",
      originalRequest.url
    );

    // Si recibimos error 401 o 403 con mensaje "Token inválido" y la solicitud no se ha reintentado
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      error.response.data?.error === "Token inválido" &&
      !originalRequest._retry
    ) {
      console.log("[Interceptor] Token expirado o inválido detectado.");
      const sessionStore = useSessionStore();
      const storedRefreshToken =
        sessionStore.refreshToken || localStorage.getItem("refreshToken");
      console.log("[Interceptor] Refresh token almacenado:", storedRefreshToken);

      if (!storedRefreshToken) {
        sessionStore.expireSession();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log(
          "[Interceptor] Ya se está refrescando el token, agregando a la cola."
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log("[Interceptor] Iniciando proceso de refresco de token...");

      // Mostrar SweetAlert para preguntar si desea continuar la sesión
      const result = await Swal.fire({
        title: "La sesión está por terminar",
        text: "¿Deseas continuar tu sesión?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cerrar sesión",
      });
      console.log("[Interceptor] Resultado de SweetAlert:", result);

      if (!result.isConfirmed) {
        // Si el usuario decide cerrar sesión:
        sessionStore.expireSession();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          { refreshToken: storedRefreshToken }
        );
        console.log("[Interceptor] Nuevo access token recibido:", data.accessToken);

        // Actualizar token en localStorage y en el sessionStore
        localStorage.setItem("token", data.accessToken);
        sessionStore.setToken(data.accessToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("[Interceptor] Error al refrescar token:", refreshError);
        processQueue(refreshError, null);
        sessionStore.expireSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);



export default apiClient;
