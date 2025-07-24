# Nuevo Endpoint: Validar Códigos de Ubicación

## Descripción
Este endpoint simplifica el proceso de validación de códigos de ubicación del Excel. En lugar de procesar todo el flujo de asignaciones, este endpoint se enfoca únicamente en:

1. Validar si los códigos de ubicación existen
2. Verificar si están disponibles
3. Crear nuevas ubicaciones si no existen
4. Retornar los IDs de ubicación para facilitar el armado del payload para `scanQR`

## Endpoint
```
POST /api/transferencias/validarCodigosUbicacion
```

## Autenticación
Requiere token de autenticación en el header:
```
Authorization: Bearer <tu_token>
```

## Request Body
```json
{
  "codigos": ["A1-B2-C3", "D4-E5-F6", "NUEVO-001"]
}
```

## Response
```json
{
  "success": true,
  "message": "Validación de códigos completada",
  "resultados": [
    {
      "codigo": "A1-B2-C3",
      "existe": true,
      "disponible": true,
      "ubicacionId": 123,
      "estado": "DISPONIBLE",
      "ocupado": 0
    },
    {
      "codigo": "D4-E5-F6",
      "existe": true,
      "disponible": false,
      "ubicacionId": 124,
      "estado": "OCUPADO",
      "ocupado": 1
    },
    {
      "codigo": "NUEVO-001",
      "existe": false,
      "disponible": true,
      "ubicacionId": 125,
      "creada": true,
      "estado": "DISPONIBLE",
      "ocupado": 0
    }
  ]
}
```

## Campos de Respuesta

### Por cada código validado:
- `codigo`: El código de ubicación enviado
- `existe`: `true` si la ubicación ya existía, `false` si se creó nueva
- `disponible`: `true` si la ubicación está disponible para asignar
- `ubicacionId`: ID de la ubicación (null si hay error)
- `estado`: Estado actual de la ubicación
- `ocupado`: 0 = disponible, 1 = ocupado
- `creada`: `true` si se creó una nueva ubicación (solo aparece cuando existe=false)
- `error`: Mensaje de error si algo falló (solo aparece si hay error)

## Flujo de Uso Recomendado

1. **Leer Excel**: Extraer todos los códigos de la columna "codigo"
2. **Validar Códigos**: Llamar a este endpoint con todos los códigos
3. **Procesar Resultados**: Filtrar solo las ubicaciones disponibles
4. **Armar Payload**: Crear el payload completo para `scanQR` cruzando con las referencias del Excel
5. **Llamar scanQR**: Enviar el payload completo al endpoint existente

## Ejemplo de Uso en Frontend

```javascript
// 1. Extraer códigos del Excel
const codigos = excelData.map(row => row.codigo).filter(Boolean);

// 2. Validar códigos
const response = await api.post('/api/transferencias/validarCodigosUbicacion', {
  codigos: codigos
});

// 3. Procesar resultados y armar asignaciones
const asignaciones = [];
excelData.forEach(row => {
  const resultado = response.data.resultados.find(r => r.codigo === row.codigo);
  
  if (resultado && resultado.disponible) {
    asignaciones.push({
      referencia2: row.referencia2,
      referencia3: row.referencia3,
      ubicacionId: resultado.ubicacionId,
      codigo: resultado.codigo
    });
  }
});

// 4. Llamar scanQR con el payload completo
const scanQRPayload = {
  qrToken: qrToken,
  accion: 'completado',
  usuarioId: usuarioId,
  clienteId: clienteId,
  asignaciones: asignaciones
};

await api.post('/api/transferencias/qr/scan', scanQRPayload);
```

## Ventajas de este Enfoque

1. **Simplicidad**: Un endpoint específico para una tarea específica
2. **Reutilizable**: Puede usarse desde cualquier parte del frontend
3. **Eficiente**: Valida todos los códigos en una sola llamada
4. **Flexible**: Permite manejar errores por código individual
5. **Separación de responsabilidades**: Validación separada del procesamiento

## Manejo de Errores

- **400**: Array de códigos inválido o vacío
- **500**: Error interno del servidor
- **Errores por código**: Se incluyen en el array de resultados con el campo `error`

## Configuración de Nuevas Ubicaciones

Cuando se crea una nueva ubicación, se usan estos valores por defecto:
- `bodega_id`: 2
- `modulo`: 1
- `entrepano`: 1
- `cara`: 1
- `piso`: 1
- `coordenadaX`: 1
- `coordenadaY`: 1
- `coordenadaZ`: 1
- `ocupado`: 0 (disponible)
- `estado`: "DISPONIBLE"