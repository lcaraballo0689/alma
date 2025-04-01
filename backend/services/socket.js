/**
 * services/socket.js
 * Configuración de Socket.io en el backend.
 */
const socketIo = require("socket.io");

// Asegúrate de que logger esté definido; en caso de no tenerlo, se puede usar console.log como fallback.
const logger = console; // o reemplázalo por tu módulo de logging

let ioInstance = null;

/**
 * Inicializa Socket.io con el servidor HTTP.
 * @param {object} server - La instancia del servidor HTTP (obtenida con http.createServer).
 */
function initSocket(server) {
  const io = socketIo(server, {
    cors: { origin: "*" },
  });

  // Evento global de conexión
  io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Escucha el evento "Notificaciones" para unir al socket a una sala específica.
    socket.on("Notificaciones", (data) => {
      if (data && data.clienteId) {
        const sala = `usuario_${data.clienteId}`;
        socket.join(sala);
        console.log(`Socket ${socket.id} se unió a la sala: ${sala}`);
        console.log("Notificación recibida por WS:", data);
      } else {
        console.log("Datos insuficientes para unirse a la sala");
      }
    });

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  ioInstance = io;
}

/**
 * Emite una notificación a una sala específica usando el evento "notify".
 * @param {string} sala - El nombre de la sala a la que se envía el mensaje (ej: "usuario_2").
 * @param {object} data - Los datos que se enviarán con el evento (ej: { mensaje: "Hola", estado: "nuevo" }).
 */
function emitirNotificacion(sala, data) {
  //logger.info(`Emitiendo notificación vía WS al canal ${sala} con datos: ${JSON.stringify(data)}`);

  if (ioInstance) {
    ioInstance.to(sala).emit("notify", data);
  } else {
    console.error("Socket.io no ha sido inicializado.");
  }
}

module.exports = { initSocket, emitirNotificacion };
