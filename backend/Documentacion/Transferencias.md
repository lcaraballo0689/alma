Documentación API – Módulo de Transferencias
Esta documentación describe los endpoints disponibles para gestionar el proceso de transferencia de cajas/custodias. El flujo completo abarca desde la creación de la solicitud hasta la actualización final del estado y la asignación de ubicaciones.

Flujo General

Creación de la Solicitud: Se crea la solicitud de transferencia con estado PENDIENTE.
Asignación de Transportador: Se asigna un transportador a la solicitud, cambiando el estado a ASIGNADO.
Recogida en Origen: El transportador recoge las cajas en la ubicación del cliente; el estado se actualiza a RECOGIDO.
Recepción en Bodega: Se confirma la llegada de los ítems en la bodega; se actualiza a RECIBIDO.
Asignación de Ubicaciones: Se asignan ubicaciones a los ítems, generando una referencia de ubicación.
Actualización Final: Se actualiza el estado final a COMPLETADO o CANCELADO.
Eliminación: Solo se permite eliminar solicitudes en estado PENDIENTE.
Consultas: Se pueden consultar solicitudes y sus detalles.
Endpoints
1. Crear Solicitud de Transferencia
URL:
POST /api/client/transferencias/crear

Descripción:
Crea una nueva solicitud de transferencia. La solicitud se inserta en la tabla SolicitudTransporte con estado PENDIENTE y se registran los detalles de cada ítem en la tabla DetalleSolicitudTransporte.

Body de Ejemplo:

json
Copiar código
{
  "clienteId": 2,
  "usuarioId": 3,
  "observaciones": "Entrega urgente",
  "items": [
    {
      "referencia2": "REF-001",
      "referencia3": "OPCIONAL",
      "descripcion": "Caja de documentos"
    },
    {
      "referencia2": "REF-002",
      "descripcion": "Caja de archivos"
    }
  ]
}
Respuesta Exitosa (201):

json
Copiar código
{
  "message": "Solicitud de transferencia creada con éxito",
  "solicitudId": 14,
  "consecutivo": 7
}
2. Consultar Solicitudes de Transferencia
URL:
POST /api/client/transferencias/consultar

Descripción:
Permite listar las solicitudes de transferencia de un cliente, con filtros opcionales por estado y rango de fechas.

Body de Ejemplo:

json
Copiar código
{
  "clienteId": 2,
  "estado": "PENDIENTE",
  "fechaInicio": "2025-03-01T00:00:00Z",
  "fechaFin": "2025-03-31T23:59:59Z"
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Transferencias consultadas exitosamente",
  "data": [
    {
      "id": 14,
      "clienteId": 2,
      "consecutivo": 7,
      "estado": "PENDIENTE",
      "fechaSolicitud": "2025-03-18T03:43:01.636Z",
      "observaciones": "",
      "createdAt": "2025-03-18T03:43:01.636Z",
      "updatedAt": "2025-03-18T03:43:01.636Z"
    },
    { ... }
  ]
}
3. Consultar Detalle de una Solicitud
URL:
POST /api/client/transferencias/detalle

Descripción:
Devuelve la cabecera de la solicitud y el detalle (items) asociados a la misma.

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 14
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Consulta exitosa",
  "solicitud": {
    "id": 14,
    "clienteId": 2,
    "consecutivo": 7,
    "estado": "PENDIENTE",
    "fechaSolicitud": "2025-03-18T03:43:01.636Z",
    "observaciones": "",
    "createdAt": "2025-03-18T03:43:01.636Z",
    "updatedAt": "2025-03-18T03:43:01.636Z"
  },
  "detalle": [
    {
      "id": 10,
      "solicitudTransporteId": 14,
      "tipo": "CAJA",
      "referencia1": "",
      "referencia2": "REF-001",
      "referencia3": "OPCIONAL",
      "descripcion": "Caja de documentos",
      "estado": "PENDIENTE",
      "createdAt": "2025-03-18T03:43:01.636Z",
      "updatedAt": "2025-03-18T03:43:01.636Z"
    },
    { ... }
  ]
}
4. Asignar Transportador a la Solicitud
URL:
PUT /api/client/transferencias/asignarTransportador

Descripción:
Asigna un transportador a la solicitud. Se actualiza la solicitud cambiando el estado a ASIGNADO y registrando el usuario que recoge la carga (usuarioCarga) y la fecha (fechaCarga).

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 14,
  "usuarioCarga": 5
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Solicitud asignada a transportador correctamente.",
  "solicitudId": 14,
  "usuarioCarga": 5,
  "fechaCarga": "2025-03-19T08:30:00.000Z",
  "estado": "ASIGNADO"
}
5. Registrar Recogida en el Origen
URL:
PUT /api/client/transferencias/recoger

Descripción:
Registra que el transportador ha recogido las cajas en la ubicación del cliente. Actualiza el estado a RECOGIDO y registra la fecha de recogida (fechaRecogida).

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 14
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Solicitud marcada como RECOGIDO.",
  "solicitudId": 14,
  "fechaRecogida": "2025-03-19T09:00:00.000Z",
  "estado": "RECOGIDO"
}
6. Registrar Recepción en la Bodega
URL:
PUT /api/client/transferencias/recepcionar

Descripción:
Una vez que los ítems llegan a la bodega, se actualiza la solicitud a estado RECIBIDO.

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 14
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Solicitud de transferencia marcada como RECIBIDO",
  "solicitudId": 14,
  "estado": "RECIBIDO"
}
7. Asignar Ubicaciones en la Bodega
URL:
PUT /api/client/transferencias/asignarUbicaciones

Descripción:
Asigna ubicaciones a los ítems de la solicitud. Por cada asignación, se verifica la disponibilidad de la ubicación, se busca (o crea) la custodia y se genera la referencia de ubicación (por ejemplo, B2M1E1C1P1X1Y1Z3).

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 14,
  "asignaciones": [
    { "detalleId": 10, "ubicacionId": 5 },
    { "detalleId": 11, "ubicacionId": 6 }
  ]
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Ubicaciones asignadas correctamente."
}
8. Actualizar el Estado Final de la Solicitud
URL:
PUT /api/client/transferencias/actualizarEstado

Descripción:
Permite actualizar el estado de la solicitud a un estado final, como COMPLETADO o CANCELADO, y registrar observaciones.

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 14,
  "estado": "COMPLETADO",
  "observaciones": "Proceso finalizado correctamente."
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Estado de la transferencia actualizado exitosamente.",
  "solicitudId": 14,
  "estado": "COMPLETADO"
}
9. Eliminar una Solicitud de Transferencia
URL:
DELETE /api/client/transferencias/eliminar

Descripción:
Elimina una solicitud de transferencia. Solo se permite eliminar si la solicitud se encuentra en estado PENDIENTE.

Body de Ejemplo:

json
Copiar código
{
  "solicitudId": 22
}
Respuesta Exitosa (200):

json
Copiar código
{
  "message": "Solicitud de transferencia eliminada exitosamente.",
  "solicitudId": 22
}
Resumen del Flujo
Creación (PENDIENTE):
El cliente crea la solicitud mediante POST /crear.

Asignación de Transportador (ASIGNADO):
Se asigna un transportador a la solicitud usando PUT /asignarTransportador.

Recogida en Origen (RECOGIDO):
El transportador recoge las cajas en el punto de origen, usando PUT /recoger.

Recepción en Bodega (RECIBIDO):
Se confirma la llegada en bodega a través de PUT /recepcionar.

Asignación de Ubicaciones:
Se asignan ubicaciones a cada ítem usando PUT /asignarUbicaciones.

Actualización Final:
Se puede actualizar el estado final a COMPLETADO o CANCELADO mediante PUT /actualizarEstado.

Eliminación:
La solicitud se elimina (si está en estado PENDIENTE) mediante DELETE /eliminar.

Consultas:
Se consultan solicitudes y sus detalles mediante POST /consultar y POST /detalle.

