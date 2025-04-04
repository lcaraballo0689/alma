// src/socket.js
import { io } from 'socket.io-client';



let socket;

if (window.location.hostname === "localhost") {
  socket = io('http://localhost:3001', {
    // Opciones adicionales si las necesitas
  });
} else if (window.location.hostname === "bodegapp.siglo21.com.co") {
  socket = io('https://api.siglo21.com.co', {
    // Opciones adicionales si las necesitas
  });
} else {
  // Opcional: Configuración por defecto o mensaje de error
  console.warn("Hostname no reconocido, configurando socket por defecto");
  socket = io('https://api.siglo21.com.co', {
    // Opciones adicionales
  });
}

// else {
//   socket = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"; // URL por defecto (puedes ajustarla)
// }


socket.on('connect', () => {
  console.log(`Conectado a Socket.io con id: ${socket.id}`);
});

socket.on('disconnect', () => {
  console.log('Desconectado de Socket.io');
});

export default socket;
