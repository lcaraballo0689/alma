// src/socket.js
import { io } from 'socket.io-client';

// Conecta al backend que corre en el puerto 3001
const socket = io('http://localhost:3001', {
  // Puedes incluir opciones adicionales aquí, como credenciales o configuración CORS
});

socket.on('connect', () => {
  console.log(`Conectado a Socket.io con id: ${socket.id}`);
});

socket.on('disconnect', () => {
  console.log('Desconectado de Socket.io');
});

export default socket;
