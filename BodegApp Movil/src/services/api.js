import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.siglo21.com.co',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error('No autorizado. Redirigiendo al login.');
      // Aquí puedes redirigir al login o manejar el token
    } else {
      console.error('Error en la solicitud:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
