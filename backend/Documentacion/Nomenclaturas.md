Documentación del Sistema de Generación de Nomenclatura
1. Objetivo
El sistema de nomenclatura se utiliza para generar de forma dinámica una referencia única y legible para cada registro en la tabla Custodia (o similar) al asignar una ubicación a una caja. Esta referencia se construye en función de una configuración flexible que se define a través de componentes (placeholders y valores fijos) y un consecutivo (número secuencial).

2. Estructura de la Base de Datos
2.1 Tabla NomenclaturaComponentes
Esta tabla almacena cada uno de los componentes que formarán parte de la plantilla de la referencia. Permite definir:

clienteId: Para manejar la multi-tenencia (cada cliente puede tener su propia configuración).
modulo: El contexto o módulo (por ejemplo, "transferencia").
componente: El nombre del componente o placeholder (ej., prefijo, ubicacionId, anio, mes, dia, secuencia).
orden: La posición en la cual aparecerá este componente en la referencia final.
separador: El carácter o cadena que se agrega después de este componente (por ejemplo, un guion "-").
valorFijo: Si el componente es de tipo fijo, se almacena aquí el valor a utilizar.
esPlaceholder: Un indicador (1 o 0) que define si el componente es un placeholder (valor a reemplazar) o un valor fijo.
Ejemplo de definición:

sql
Copiar
CREATE TABLE NomenclaturaComponentes (
  id INT IDENTITY(1,1) PRIMARY KEY,
  clienteId INT NOT NULL,              -- Identifica al cliente (multi-tenant)
  modulo NVARCHAR(50) NOT NULL,        -- Ejemplo: 'transferencia'
  componente NVARCHAR(50) NOT NULL,    -- Ej: 'prefijo', 'ubicacionId', 'anio', 'mes', 'dia', 'secuencia'
  orden INT NOT NULL,                  -- Orden de aparición en la referencia
  separador NVARCHAR(10) NOT NULL DEFAULT '-',  -- Separador a utilizar
  valorFijo NVARCHAR(50) NULL,         -- Valor fijo (si es que no es placeholder)
  esPlaceholder BIT NOT NULL DEFAULT 1 -- 1: valor a reemplazar, 0: valor fijo
);
Restricciones y Consideraciones:

Todos los campos requeridos deben ser provistos; de lo contrario, la generación de la plantilla podría fallar.
La combinación de clienteId y modulo define el conjunto de componentes aplicable para un cliente específico y para ese módulo.
Se debe mantener el orden y los separadores consistentes para lograr una referencia legible.
2.2 Tabla CorrelativosReferencia
Esta tabla lleva el control del consecutivo o número secuencial para cada plantilla (o grupo de componentes). Se relaciona con la configuración de la plantilla mediante el campo plantillaId.

Ejemplo de definición:

sql
Copiar
CREATE TABLE CorrelativosReferencia (
  id INT IDENTITY(1,1) PRIMARY KEY,
  plantillaId INT NOT NULL,  -- Relacionado con NomenclaturaComponentes (por ejemplo, el id del primer componente o una clave identificadora de la plantilla)
  ultimoNumero INT NOT NULL, -- Último número asignado para esta plantilla
  fechaActualizacion DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Correlativos_Nomenclatura FOREIGN KEY (plantillaId)
      REFERENCES NomenclaturaComponentes(id)
);
Restricciones y Consideraciones:

Se debe garantizar la integridad del consecutivo mediante transacciones para evitar duplicados.
Cada cliente y cada módulo pueden tener secuencias independientes.
2.3 Tabla Custodia
Esta tabla registra las cajas o ítems asignados a una ubicación. Aquí se almacena la referencia generada en un campo (por ejemplo, referencia1).

Ejemplo de definición:

sql
Copiar
CREATE TABLE Custodia (
  id INT IDENTITY(1,1) PRIMARY KEY,
  clienteId INT NOT NULL,
  bodega_id INT NOT NULL,
  ubicacionId INT NOT NULL,
  item NVARCHAR(100) NOT NULL,
  referencia1 NVARCHAR(255) NULL,  -- Aquí se almacenará la nomenclatura generada
  referencia2 NVARCHAR(100) NULL,
  referencia3 NVARCHAR(100) NULL,
  estado NVARCHAR(50) NOT NULL,
  baja BIT NOT NULL DEFAULT 0
);
Restricciones y Consideraciones:

La columna referencia1 debe ser lo suficientemente grande para almacenar la cadena generada (por ejemplo, NVARCHAR(255)).
Esta referencia debe ser única y legible para facilitar la revisión administrativa.
3. Procedimiento Almacenado: SP_GenerarReferencia1
Este procedimiento se encarga de generar la nomenclatura de referencia de forma dinámica. Se realiza lo siguiente:

Consulta de Configuración Dinámica:
Se construye la plantilla concatenando los componentes definidos en NomenclaturaComponentes (usando, por ejemplo, FOR XML PATH para concatenar los valores en el orden correcto).

Si el registro es un placeholder, se coloca el marcador (ej., {ubicacionId}) en la plantilla.
Si es un valor fijo, se utiliza el valor almacenado en valorFijo.
Obtención del Consecutivo:
Se consulta o inicializa la tabla CorrelativosReferencia para obtener el número secuencial (y se incrementa) para la plantilla en uso.

Reemplazo de Placeholders:
Se sustituyen los marcadores en la plantilla por los valores reales proporcionados (por ejemplo, el ID de la ubicación, la fecha actual y el número secuencial).

Parámetro Opcional para Seleccionar Plantilla:
Se puede incluir un parámetro @plantillaId (opcional) para que se use una configuración específica si se requiere.

Ejemplo del SP:

sql
Copiar
CREATE PROCEDURE SP_GenerarReferencia1
  @modulo NVARCHAR(50),
  @ubicacionId INT,
  @clienteId INT,
  @plantillaId INT = NULL,  -- Opcional: permite indicar una plantilla específica
  @nuevaReferencia NVARCHAR(255) OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  DECLARE @plantilla NVARCHAR(255),
          @prefijo NVARCHAR(50),
          @anio VARCHAR(4),
          @mes VARCHAR(2),
          @dia VARCHAR(2),
          @secuencia INT,
          @secuenciaStr NVARCHAR(20);

  -- Obtener la plantilla: si se pasa @plantillaId, se filtra por él; de lo contrario, se obtiene la predeterminada
  IF @plantillaId IS NOT NULL
  BEGIN
    SELECT 
      @plantilla = (SELECT STRING_AGG(
                      CASE 
                        WHEN esPlaceholder = 1 THEN '{' + componente + '}'
                        ELSE valorFijo
                      END, separador) WITHIN GROUP (ORDER BY orden)
                    FROM NomenclaturaComponentes
                    WHERE modulo = @modulo AND clienteId = @clienteId AND id = @plantillaId),
      @prefijo = (SELECT valorFijo FROM NomenclaturaComponentes WHERE modulo = @modulo AND componente = 'prefijo' AND clienteId = @clienteId AND id = @plantillaId)
    FROM NomenclaturaComponentes
    WHERE id = @plantillaId;
  END
  ELSE
  BEGIN
    SELECT TOP 1
      @plantilla = (SELECT STRING_AGG(
                      CASE 
                        WHEN esPlaceholder = 1 THEN '{' + componente + '}'
                        ELSE valorFijo
                      END, separador) WITHIN GROUP (ORDER BY orden)
                    FROM NomenclaturaComponentes
                    WHERE modulo = @modulo AND clienteId = @clienteId),
      @prefijo = (SELECT valorFijo FROM NomenclaturaComponentes WHERE modulo = @modulo AND componente = 'prefijo' AND clienteId = @clienteId)
    FROM NomenclaturaComponentes
    WHERE modulo = @modulo AND clienteId = @clienteId;
  END

  IF @plantilla IS NULL OR LEN(@plantilla) = 0
  BEGIN
    ROLLBACK TRANSACTION;
    RAISERROR('No se encontró configuración para el módulo %s y cliente %d.', 16, 1, @modulo, @clienteId);
    RETURN;
  END

  -- Eliminar el separador final (suponiendo que el separador es el mismo para todos)
  DECLARE @primerSeparador NVARCHAR(10);
  SELECT TOP 1 @primerSeparador = separador
  FROM NomenclaturaComponentes
  WHERE modulo = @modulo AND clienteId = @clienteId
  ORDER BY orden;
  IF RIGHT(@plantilla, LEN(@primerSeparador)) = @primerSeparador
    SET @plantilla = LEFT(@plantilla, LEN(@plantilla) - LEN(@primerSeparador));

  -- Obtener la fecha actual
  SET @anio = CONVERT(VARCHAR(4), YEAR(GETDATE()));
  SET @mes = RIGHT('0' + CONVERT(VARCHAR(2), MONTH(GETDATE())), 2);
  SET @dia = RIGHT('0' + CONVERT(VARCHAR(2), DAY(GETDATE())), 2);

  -- Obtener o inicializar el consecutivo para la plantilla.
  IF NOT EXISTS (SELECT 1 FROM CorrelativosReferencia WHERE plantillaId = ISNULL(@plantillaId, (SELECT TOP 1 id FROM NomenclaturaComponentes WHERE modulo = @modulo AND clienteId = @clienteId ORDER BY orden)))
  BEGIN
    INSERT INTO CorrelativosReferencia (plantillaId, ultimoNumero)
    VALUES (ISNULL(@plantillaId, (SELECT TOP 1 id FROM NomenclaturaComponentes WHERE modulo = @modulo AND clienteId = @clienteId ORDER BY orden)), 1);
    SET @secuencia = 1;
  END
  ELSE
  BEGIN
    UPDATE CorrelativosReferencia
    SET ultimoNumero = ultimoNumero + 1,
        fechaActualizacion = GETDATE()
    OUTPUT inserted.ultimoNumero
    WHERE plantillaId = ISNULL(@plantillaId, (SELECT TOP 1 id FROM NomenclaturaComponentes WHERE modulo = @modulo AND clienteId = @clienteId ORDER BY orden));
    SELECT @secuencia = ultimoNumero FROM CorrelativosReferencia WHERE plantillaId = ISNULL(@plantillaId, (SELECT TOP 1 id FROM NomenclaturaComponentes WHERE modulo = @modulo AND clienteId = @clienteId ORDER BY orden));
  END

  -- Convertir el consecutivo a cadena con relleno de ceros (3 dígitos en este ejemplo)
  SET @secuenciaStr = RIGHT('000' + CONVERT(VARCHAR(10), @secuencia), 3);

  -- Reemplazar los placeholders en la plantilla
  SET @nuevaReferencia = @plantilla;
  SET @nuevaReferencia = REPLACE(@nuevaReferencia, '{prefijo}', ISNULL(@prefijo, ''));
  SET @nuevaReferencia = REPLACE(@nuevaReferencia, '{ubicacionId}', CONVERT(NVARCHAR, @ubicacionId));
  SET @nuevaReferencia = REPLACE(@nuevaReferencia, '{anio}', @anio);
  SET @nuevaReferencia = REPLACE(@nuevaReferencia, '{mes}', @mes);
  SET @nuevaReferencia = REPLACE(@nuevaReferencia, '{dia}', @dia);
  SET @nuevaReferencia = REPLACE(@nuevaReferencia, '{secuencia}', @secuenciaStr);

  COMMIT TRANSACTION;
END
GO
4. Integración en la Asignación de Ubicaciones
Cuando se asigne una ubicación (por ejemplo, en la función asignarUbicaciones), se debe llamar al SP para generar la referencia. El flujo sería:

Validar el detalle, ubicación, etc.
Invocar el SP_GenerarReferencia1 con los parámetros:
@modulo: 'transferencia'
@ubicacionId: el id de la ubicación
@clienteId: el id del cliente de la solicitud
(Opcional) @plantillaId: si se desea usar una plantilla específica.
Recibir el valor de salida nuevaReferencia.
Insertar o actualizar en Custodia utilizando el valor en la columna referencia1.
Ejemplo de integración (fragmento de código en Node.js):

js
Copiar
// Llamada al SP para generar la referencia
const spResult = await transaction.request()
  .input("modulo", sql.NVarChar, "transferencia")
  .input("ubicacionId", sql.Int, ubicacionId)
  .input("clienteId", sql.Int, solicitud.clienteId)
  // Opcional: si deseas usar una plantilla específica, incluye: .input("plantillaId", sql.Int, asign.plantillaId)
  .output("nuevaReferencia", sql.NVarChar(255))
  .query("EXEC SP_GenerarReferencia1 @modulo, @ubicacionId, @clienteId, @plantillaId, @nuevaReferencia OUTPUT");

const nuevaReferencia = spResult.output.nuevaReferencia;
Luego se utiliza nuevaReferencia para insertar o actualizar el registro en Custodia, almacenándolo en la columna referencia1.

5. Restricciones y Consideraciones
Consistencia en la Configuración:
Todos los componentes en NomenclaturaComponentes deben definirse con el formato y orden adecuado. Por ejemplo, si se usan placeholders como {anio}, {mes}, etc., estos deben existir en el objeto de datos que se suministre al SP.

Valores Obligatorios:
Se deben enviar todos los valores necesarios (por ejemplo, ubicacionId, fecha y secuencia) para que el SP pueda reemplazar correctamente los placeholders.

Integridad del Consecutivo:
La actualización de la tabla CorrelativosReferencia debe realizarse en una transacción para evitar la generación de duplicados o inconsistencias en el consecutivo.

Selección de Plantilla:
Si se pasa el parámetro @plantillaId, se usará esa configuración específica; de lo contrario, se seleccionará la plantilla predeterminada para el módulo y cliente. Esto permite flexibilidad, pero también implica que si se suministra un plantillaId no válido o inactivo, se producirá un error.

Tamaño de la Columna:
La columna en Custodia donde se almacena la referencia (por ejemplo, referencia1) debe ser lo suficientemente grande (NVARCHAR(255) o mayor) para contener el resultado final.

Uso de Separadores:
Asegúrate de que el separador definido en cada componente sea coherente. La generación de la plantilla dependerá de la concatenación correcta de los separadores.

6. Conclusión
Este sistema permite:

Definir de forma flexible y dinámica la estructura de la referencia mediante registros en NomenclaturaComponentes.
Llevar un control del consecutivo a través de la tabla CorrelativosReferencia.
Generar automáticamente una referencia única y legible en función de los datos (como fecha, ubicación, secuencia) y la configuración definida.
Integrar la generación de la referencia en el proceso de asignación de ubicaciones en la tabla Custodia, almacenándola en la columna referencia1.
Esta solución es adaptable a un entorno multi-tenant y permite seleccionar una plantilla específica si se requiere.

