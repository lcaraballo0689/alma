{/**
 * @fileoverview Archivo principal del servidor, donde se configuran middlewares, conexión a la base de datos y rutas.
 */

require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const { connectDB } = require("./config/db");
const path = require("path");
const fs = require("fs");

// Rutas
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const custodiaRoutes = require("./routes/custodiaRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const direccionesRoutes = require("./routes/direccionRoutes");
const prestamosRoutes = require("./routes/prestamosRoutes");
const devolucionRoutes = require("./routes/devolucionRoutes");
const EntregaRoutes = require("./routes/EntregasRoutes");
const correoRoutes = require("./routes/correoRoutes");
const correo2Routes = require("./routes/correo2Routes");
const confirmarRecepcionRoutes = require("./routes/confirmarRecepcionRoutes");
const excelRoutes = require("./routes/excelRoutes");
const prestamosReporteRoutes = require("./routes/reports/prestamosReportsRoutes");
const devolucionesReportesRoutes = require("./routes/reports/devolucionesReportsRoutes");
const downloadReportsPdfRoutes = require("./routes/reports/downloadRoutes");
const transferenciasRoutes = require("./routes/transferenciasRoutes");
const desarchivarRoutes = require("./routes/desarchivarRoutes");
const globalStates = require("./routes/globalStatesRoutes");
const notificaciones = require("./routes/notificacioneSRoutes");
const nomenclaturas = require('./routes/referenciaRoutes');
const obtenerHistorialSolicitudes = require('./routes/auditoriaRoutes')
const estadoTransicionesRoutes = require('./routes/estadoTransicionesRoutes');
const obtenerDetalleSolicitud  = require("./routes/obtenerDetalleSolicitudRoutes");
const cargarFirma = require("./routes/firmaRoutes");
const horariosRouter = require('./routes/horariosRoutes');
const dashboardRouter = require('./routes/dashboard');
//const Bodega  = require("./routes/bodegaRoutes");  

const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const rolePermissionRoutes = require("./routes/rolePermissionRoutes");
const entregaRoutes = require('./routes/entregaRoute');
const apkRoutes = require('./routes/apkRoutes');
const bulkRoutes = require('./routes/bulk');


const app = express();
const port = process.env.PORT || 3001;

// Crear el servidor HTTP a partir de la app Express
const server = http.createServer(app);

// Importar la configuración de Socket.io desde socket.js
const { initSocket, emitirNotificacion } = require("./services/socket");

// Inicializar Socket.io utilizando el servidor HTTP
initSocket(server);

// Middlewares globales
app.use(express.json({limit: "900mb"}));
app.use(morgan("dev"));
app.use(cors());

// Rutas de la API
app.use("/api/notificaciones", notificaciones);
app.use("/api/estados", globalStates);
app.use("/api/desarchive", desarchivarRoutes);
app.use("/api/transferencias", transferenciasRoutes);
app.use("/api/prestamosReports", prestamosReporteRoutes);
app.use("/api/devolucionesReports", devolucionesReportesRoutes);
app.use("/api/downloadReportsPdf", downloadReportsPdfRoutes);
app.use('/api/nomenclatura', nomenclaturas);
app.use('/api/auditoria', obtenerHistorialSolicitudes);
app.use('/api/estados', estadoTransicionesRoutes);
app.use("/api/detalleSolicitud", obtenerDetalleSolicitud);
app.use("/api/cargarFirma", cargarFirma);
app.use('/api/horarios', horariosRouter);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use('/api', dashboardRouter);
app.use('/api/pwa/entregas', entregaRoutes);
app.use('/api/apk', apkRoutes);
app.use('/api/bulk', bulkRoutes);

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Configurar la ruta para acceder a las firmas (útil en producción)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Crear directorios necesarios si no existen
const uploadsPath = path.join(__dirname, 'uploads');
const firmasPath = path.join(uploadsPath, 'firmas');
const entregasPath = path.join(uploadsPath, 'entregas');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Directorio uploads creado');
}
if (!fs.existsSync(firmasPath)) {
  fs.mkdirSync(firmasPath, { recursive: true });
  console.log('✅ Directorio uploads/firmas creado');
}
if (!fs.existsSync(entregasPath)) {
  fs.mkdirSync(entregasPath, { recursive: true });
  console.log('✅ Directorio uploads/entregas creado');
}

//app.use("/api/bodega", Bodega); // Rutas de bodegas


app.get("/api", (req, res) => {
  res.json({ message: "Bienvenido a la API" });
});

app.use("/api/usuarios", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api/custodias", custodiaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/direcciones", direccionesRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/devoluciones", devolucionRoutes);
app.use("/api/entregas", EntregaRoutes);
app.use("/api/sendCorreo", correoRoutes);
app.use("/api/correo2", correo2Routes);
app.use("/api/confirmarRecepcion", confirmarRecepcionRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/auth", authRoutes);

// Conectar a la base de datos e iniciar el servidor
connectDB()
  .then(() => {
    server.listen(process.env.PORT, "0.0.0.0", () => {
      console.log(`Servidor en marcha en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Error al conectar a la base de datos:", err);
    process.exit(1);
  });

// Exportar la aplicación, el servidor y la función de notificaciones
module.exports = { app, server, emitirNotificacion };
}