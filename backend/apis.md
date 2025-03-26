# Lista de Endpoints para el Sistema de Gestión de Bodegas

> **Nota:**  
> Todas las peticiones se realizarán mediante **POST** (incluso las que usualmente serían GET) para enviar obligatoriamente el `clienteId` en el body, ya que el sistema es multi-tenant.

---

## Módulo de Cliente

Estos endpoints son accesibles para usuarios con rol de **cliente** y están diseñados para operaciones de consulta, gestión de información personal y visualización de movimientos.

### Autenticación y Perfil
- [x] **POST /api/auth/login**  
      *Autentica al usuario y devuelve un token JWT.*  
      **Notas:** Validar formato de email, contraseña y que el usuario esté activo.
- [ ] **POST /api/auth/logout**  
      *Finaliza la sesión del usuario.*  
      **Notas:** Invalida el token actual.
- [ ] **POST /api/usuarios/detalle**  
      *Obtiene el detalle del perfil del usuario.*  
      **Body:** `{ "clienteId": number, "usuarioId": number }`  
      **Notas:** Asegurarse de que el `clienteId` corresponda a la sesión.

### Gestión de Cliente
- [ ] **POST /api/clientes/detalle**  
      *Obtiene el detalle del cliente.*  
      **Body:** `{ "clienteId": number }`  
- [ ] **POST /api/clientes/actualizar**  
      *Actualiza la información del cliente.*  
      **Body:** `{ "clienteId": number, "nuevosDatos": { ... } }`  
      **Notas:** Validar campos obligatorios y formatos.

### Consultas de Movimientos
- [x] **POST /api/desarchivo/listar**  
      *Lista los desarchivos del cliente con filtros opcionales (fecha, custodia, etc.).*  
      **Body:** `{ "clienteId": number, "filtros": { ... } }`
- [x] **POST /api/desarchivo/consultar-detalle**  
      *Consulta el detalle de un desarchivo específico.*  
      **Body:** `{ "clienteId": number, "desarchivoId": number }`
- [x] **POST /api/desarchivo/pdf**  
        
      *Descarga o visualiza el PDF de constancia de un desarchivo.*
      **Body:** `{ "clienteId": number, "desarchivoId": number }`

      NOTAS:
      pendiente validar informacion de como debe generar el reporte e informacion relevante que debe llevar 

      
- [x] **POST /api/prestamos/listar**  
      *Lista los préstamos del cliente con filtros.*  
      **Body:** `{ "clienteId": number, "filtros": { ... } }`
- [ ] **POST /api/prestamos/detalle**  

      *Consulta el detalle de un préstamo.*  
      
      **Body:** `{ "clienteId": number, "prestamoId": number }`

      no se ha hecho


- [x] **POST /api/devoluciones/listar**  
      *Lista las devoluciones del cliente con filtros.*  
      **Body:** `{ "clienteId": number, "filtros": { ... } }`
- [ ] **POST /api/devoluciones/detalle**  
      *Consulta el detalle de una devolución.*  
      **Body:** `{ "clienteId": number, "devolucionId": number }`
- [ ] **POST /api/entregas/listar**  
      *Lista las entregas registradas para el cliente.*  
      **Body:** `{ "clienteId": number, "filtros": { ... } }`
- [ ] **POST /api/solicitud-transporte/listar**  
      *Lista las solicitudes de transporte del cliente.*  
      **Body:** `{ "clienteId": number, "filtros": { ... } }`
- [ ] **POST /api/punteo-recogida/listar**  
      *Lista los punteos de recogida del cliente.*  
      **Body:** `{ "clienteId": number, "filtros": { ... } }`

### Reportes (Cliente)
- [ ] **POST /api/reportes/movimientos**  
      *Genera reportes de movimientos en PDF/Excel.*  
      **Body:** `{ "clienteId": number, "parametros": { ... } }`
- [ ] **POST /api/reportes/estado**  
      *Genera reportes sobre la distribución de estados (auditoría).*  
      **Body:** `{ "clienteId": number, "parametros": { ... } }`

---

## Módulo de Administrador

> **Nota:**  
> Los endpoints de administrador permiten gestionar usuarios, clientes, bodegas, ubicaciones y configurar movimientos. Estos requieren permisos especiales (por ejemplo, rol "admin" o `tipoUsuarioId` = 1).

### Gestión de Usuarios y Clientes
- [ ] **POST /api/usuarios/listar**  
      *Lista todos los usuarios, con filtros opcionales.*  
      **Body:** `{ "clienteId": number, ... }`
- [ ] **POST /api/usuarios/detalle**  
      *Obtiene el detalle completo de un usuario.*  
      **Body:** `{ "clienteId": number, "usuarioId": number }`
- [ ] **POST /api/clientes/listar**  
      *Lista todos los clientes.*  
      **Body:** `{ "clienteId": number, ... }`

### Gestión de Bodegas y Ubicaciones
- [ ] **POST /api/bodegas/listar**  
      *Lista todas las bodegas.*  
      **Body:** `{ "clienteId": number, ... }`
- [ ] **POST /api/bodegas/detalle**  
      *Obtiene el detalle de una bodega.*  
      **Body:** `{ "clienteId": number, "bodegaId": number }`
- [ ] **POST /api/bodegas**  
      *Crea una nueva bodega.*  
- [ ] **PUT /api/bodegas/:id**  
      *Actualiza la información de una bodega.*
- [ ] **DELETE /api/bodegas/:id**  
      *Elimina o marca como inactiva una bodega.*
- [ ] **POST /api/ubicaciones/listar**  
      *Lista todas las ubicaciones.*  
      **Body:** `{ "clienteId": number, ... }`
- [ ] **POST /api/ubicaciones/detalle**  
      *Obtiene el detalle de una ubicación.*  
      **Body:** `{ "clienteId": number, "ubicacionId": number }`
- [ ] **POST /api/ubicaciones**  
      *Crea una nueva ubicación.*
- [ ] **PUT /api/ubicaciones/:id**  
      *Actualiza una ubicación.*
- [ ] **DELETE /api/ubicaciones/:id**  
      *Elimina o libera una ubicación.*

### Gestión de Custodia y Carpeta
- [ ] **POST /api/custodias/listar**  
      *Lista todas las cajas en custodia.*  
      **Body:** `{ "clienteId": number, ... }`
- [ ] **POST /api/custodias/detalle**  
      *Obtiene el detalle de una custodia.*  
      **Body:** `{ "clienteId": number, "custodiaId": number }`
- [ ] **POST /api/custodias**  
      *Crea una nueva custodia.*
- [ ] **PUT /api/custodias/:id**  
      *Actualiza una custodia.*
- [ ] **DELETE /api/custodias/:id**  
      *Elimina o desactiva una custodia.*
- [ ] **POST /api/carpetas/listar**  
      *Lista todas las carpetas.*  
      **Body:** `{ "clienteId": number, ... }`
- [ ] **POST /api/carpetas/detalle**  
      *Obtiene el detalle de una carpeta.*  
      **Body:** `{ "clienteId": number, "carpetaId": number }`
- [ ] **POST /api/carpetas**  
      *Crea una nueva carpeta.*
- [ ] **PUT /api/carpetas/:id**  
      *Actualiza una carpeta.*
- [ ] **DELETE /api/carpetas/:id**  
      *Elimina o marca como inactiva una carpeta.*

### Movimientos y Solicitudes (Administrador)
#### Desarchivos
- [ ] **POST /api/desarchivo/iniciar**  
      Inicia el proceso de desarchivo.
- [ ] **POST /api/desarchivo/confirmar**  
      Confirma un desarchivo.
- [ ] **POST /api/desarchivo/confirmar-masivo**  
      Confirma múltiples desarchivos.
- [ ] **POST /api/desarchivo/consultar-detalle**  
      Consulta el detalle de un desarchivo.
- [ ] **POST /api/desarchivo/listar**  
      Lista los desarchivos.
- [ ] **POST /api/desarchivo/actualizar**  
      Actualiza la información o estado de un desarchivo.
- [ ] **POST /api/desarchivo/cancelar**  
      Cancela un desarchivo (actualizando el estado a “CANCELADO”).
- [ ] **POST /api/desarchivo/pdf**  
      Genera/descarga el PDF de constancia.

#### Préstamos
- [ ] **POST /api/prestamos/crear**  
      Crea un préstamo.
- [ ] **POST /api/prestamos/actualizar-estado**  
      Actualiza el estado de un préstamo (validando transiciones desde la BD).
- [ ] **POST /api/prestamos/listar**  
      Lista los préstamos.
- [ ] **POST /api/prestamos/detalle**  
      Consulta el detalle de un préstamo.

#### Devoluciones
- [ ] **POST /api/devoluciones/crear**  
      Crea una devolución.
- [ ] **POST /api/devoluciones/actualizar-estado**  
      Actualiza el estado de una devolución.
- [ ] **POST /api/devoluciones/listar**  
      Lista las devoluciones.
- [ ] **POST /api/devoluciones/detalle**  
      Consulta el detalle de una devolución.

#### Entrega
- [ ] **POST /api/entregas/crear**  
      Registra una entrega.
- [ ] **POST /api/entregas/listar**  
      Lista las entregas.

#### Solicitud de Transporte
- [ ] **POST /api/solicitud-transporte/crear**  
      Crea una solicitud de transporte.
- [ ] **POST /api/solicitud-transporte/actualizar-estado**  
      Actualiza el estado de una solicitud de transporte.
- [ ] **POST /api/solicitud-transporte/listar**  
      Lista las solicitudes de transporte.
- [ ] **POST /api/solicitud-transporte/detalle**  
      Consulta el detalle de una solicitud de transporte.
- [ ] **POST /api/detalle-solicitud-transporte/crear**  
      Crea el detalle de una solicitud de transporte.
- [ ] **PUT /api/detalle-solicitud-transporte/:id**  
      Actualiza el detalle de una solicitud de transporte.

#### Punteo de Recogida
- [ ] **POST /api/punteo-recogida/crear**  
      Crea un registro de punteo de recogida.
- [ ] **POST /api/punteo-recogida/listar**  
      Lista los punteos de recogida.
- [ ] **POST /api/detalle-punteo-recogida/crear**  
      Crea el detalle del punteo de recogida.
- [ ] **PUT /api/detalle-punteo-recogida/:id**  
      Actualiza el detalle del punteo de recogida.

### Gestión de Catálogos de Estados y Transiciones (Administrador)
- [ ] **POST /api/estados-movimiento/listar**  
      Lista los estados disponibles para cada módulo.  
      **Body:** `{ "clienteId": number, "modulo": string (opcional) }`
- [ ] **POST /api/estado-transiciones/listar**  
      Lista las transiciones permitidas por módulo y tipo de usuario.  
      **Body:** `{ "clienteId": number, "modulo": string (opcional) }`
- [ ] **POST /api/estado-transiciones/actualizar**  
      Permite actualizar o configurar las transiciones.  
      **Body:** `{ "clienteId": number, "datosTransiciones": { ... } }`

### Reportes y Consultas (Administrador)
- [ ] **POST /api/reportes/movimientos**  
      Genera reportes de movimientos en PDF/Excel.  
      **Body:** `{ "clienteId": number, "parametros": { ... } }`
- [ ] **POST /api/reportes/estado**  
      Genera reportes sobre la distribución de estados.  
      **Body:** `{ "clienteId": number, "parametros": { ... } }`
