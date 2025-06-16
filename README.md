# Proyecto Alma

Sistema de administración y gestión.

## Requisitos previos

- Node.js (versión 14 o superior)
- NPM (versión 6 o superior)

## Estructura del proyecto

```
alma/
├── backend/       # API REST con Node.js
├── frontend/      # Aplicación frontend con Vue.js
├── scripts/       # Scripts de utilidad
└── docs/          # Documentación
```

## Instalación

### 1. Instalación de dependencias

Para instalar todas las dependencias necesarias tanto en el backend como en el frontend:

#### Windows:
```
install-deps.bat
```

#### Linux/Mac:
```
chmod +x install-deps.sh
./install-deps.sh
```

O manualmente con Node.js:
```
node install-deps.js
```

### 2. Configuración

#### Backend:

- Crea un archivo `.env` en la carpeta `backend` con la siguiente configuración:

```
PORT=3001
DB_SERVER=tu_servidor_sql
DB_DATABASE=tu_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_clave_secreta_jwt
```

#### Frontend:

- El frontend se configurará automáticamente para conectarse con el backend en el puerto 3001.

## Ejecución

Para iniciar tanto el backend como el frontend en modo desarrollo:

#### Windows:
```
start-dev.bat
```

#### Linux/Mac:
```
chmod +x start-dev.sh
./start-dev.sh
```

O manualmente con Node.js:
```
node start-dev.js
```

### Acceso a la aplicación

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173

## Ejecutar individualmente

### Backend:
```
cd backend
npm run dev   # Desarrollo con hot-reload
npm start     # Producción
```

### Frontend:
```
cd frontend
npm run dev   # Desarrollo con hot-reload
npm run build # Compilar para producción
npm run preview # Previsualizar la versión compilada
```