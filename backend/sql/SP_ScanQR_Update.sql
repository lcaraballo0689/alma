-- Actualización del Stored Procedure SP_ScanQR para incluir observaciones del usuario
-- Ejecutar este script en la base de datos para agregar soporte a observaciones

USE [bodegapp_prod]
GO

ALTER PROCEDURE [dbo].[SP_ScanQR]
  @qrToken NVARCHAR(255),
  @accion NVARCHAR(50),
  @usuarioId INT,
  @clienteId INT,
  @asignaciones dbo.AsignacionesUbicacion READONLY,
  @transportista NVARCHAR(255),
  @documentoIdentidad NVARCHAR(255),
  @placa NVARCHAR(255),
  @sticker NVARCHAR(MAX),
  @observacionesUsuario NVARCHAR(MAX) = NULL  -- NUEVO PARÁMETRO

AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @solicitudId INT,
            @estadoActual NVARCHAR(100),
            @nuevoEstado NVARCHAR(100),
            @observaciones NVARCHAR(MAX),
            @desactivarQR BIT,
            @fechaAhora DATETIME = GETDATE(),
            @modulo NVARCHAR(50);

    -- 1. Validar QR Token
    IF NOT EXISTS (
        SELECT 1 FROM QR_Solicitudes WHERE qrToken = @qrToken AND activo = 1
    )
    BEGIN
        RAISERROR('QR token inválido o inactivo.', 16, 1);
        RETURN;
    END

    -- 2. Obtener solicitudId
    SELECT TOP 1 @solicitudId = solicitudTransporteId
    FROM QR_Solicitudes
    WHERE qrToken = @qrToken;

    -- 3. Obtener el módulo dinámicamente
    SELECT @modulo = st.modulo
    FROM QR_Solicitudes qs
    INNER JOIN SolicitudTransporte st ON qs.solicitudTransporteId = st.id
    WHERE qs.qrToken = @qrToken;

    -- Validación de módulo
    IF @modulo IS NULL
    BEGIN
        RAISERROR('No se pudo obtener el módulo para el QR.', 16, 1);
        RETURN;
    END

    -- 4. Obtener estado actual de la solicitud según el módulo
    IF @modulo = 'Transferencia'
        SELECT @estadoActual = estado FROM SolicitudTransporte WHERE id = @solicitudId;
    ELSE IF @modulo = 'Prestamo'
        SELECT @estadoActual = estado FROM SolicitudTransporte WHERE id = @solicitudId;
    ELSE IF @modulo = 'Devolucion'
        SELECT @estadoActual = estado FROM SolicitudTransporte WHERE id = @solicitudId;
    ELSE IF @modulo = 'Desarchive'
        SELECT @estadoActual = estado FROM SolicitudTransporte WHERE id = @solicitudId;
    ELSE
    BEGIN
        RAISERROR('Módulo "%s" no reconocido.', 16, 1, @modulo);
        RETURN;
    END

    IF @estadoActual IS NULL
    BEGIN
        RAISERROR('No se encontró el estado actual.', 16, 1);
        RETURN;
    END

    -- 5. Validar transición
    SELECT TOP 1 @nuevoEstado = estadoPermitido
    FROM EstadoTransiciones
    WHERE modulo = @modulo AND estadoActual = @estadoActual AND estadoPermitido = @accion;

    IF @nuevoEstado IS NULL
    BEGIN
        RAISERROR('Transición inválida: %s → %s en módulo %s.', 16, 1, @estadoActual, @accion, @modulo);
        RETURN;
    END

    -- 6. Actualizar estado en tabla del módulo
    IF @modulo = 'Transferencia'
    BEGIN
        UPDATE SolicitudTransporte SET estado = @nuevoEstado, updatedAt = @fechaAhora WHERE  id = @solicitudId;
        UPDATE DetalleSolicitudTransporte SET estado = @nuevoEstado, updatedAt = @fechaAhora WHERE solicitudTransporteId = @solicitudId;

        IF @modulo = 'Transferencia' AND @nuevoEstado = 'completado'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM @asignaciones)
            BEGIN
                RAISERROR('No se recibieron asignaciones para creación de custodias.', 16, 1);
                RETURN;
            END

            DECLARE @detalleId INT, @ubicacionId INT, @descripcion NVARCHAR(1000), @referencia1 NVARCHAR(255);

            DECLARE cursorAsignaciones CURSOR FOR
            SELECT a.detalleId, a.ubicacionId, d.descripcion
            FROM @asignaciones a
            JOIN DetalleSolicitudTransporte d ON d.id = a.detalleId
            WHERE d.solicitudTransporteId = @solicitudId;

            OPEN cursorAsignaciones;
            FETCH NEXT FROM cursorAsignaciones INTO @detalleId, @ubicacionId, @descripcion;

            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @plantilla NVARCHAR(255),
                        @prefijo NVARCHAR(50),
                        @anio VARCHAR(4),
                        @mes VARCHAR(2),
                        @dia VARCHAR(2),
                        @secuencia INT,
                        @secuenciaStr NVARCHAR(20),
                        @plantillaId INT;

                SELECT @plantilla = STUFF((SELECT '' +
                    CASE WHEN esPlaceholder = 1 THEN '{' + componente + '}' ELSE valorFijo END + separador
                    FROM NomenclaturaComponentes
                    WHERE modulo = @modulo AND clienteId = @clienteId
                    ORDER BY orden
                    FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 0, '');

                IF RIGHT(@plantilla, 1) = '-'
                    SET @plantilla = LEFT(@plantilla, LEN(@plantilla) - 1);

                SELECT TOP 1 @plantillaId = id
                FROM NomenclaturaComponentes
                WHERE modulo = @modulo AND clienteId = @clienteId
                ORDER BY orden;

                SELECT @prefijo = valorFijo
                FROM NomenclaturaComponentes
                WHERE modulo = @modulo AND componente = 'prefijo' AND clienteId = @clienteId;

                SET @anio = CONVERT(VARCHAR(4), YEAR(@fechaAhora));
                SET @mes = RIGHT('0' + CONVERT(VARCHAR(2), MONTH(@fechaAhora)), 2);
                SET @dia = RIGHT('0' + CONVERT(VARCHAR(2), DAY(@fechaAhora)), 2);

                IF NOT EXISTS (SELECT 1 FROM CorrelativosReferencia WHERE plantillaId = @plantillaId)
                BEGIN
                    INSERT INTO CorrelativosReferencia (plantillaId, ultimoNumero) VALUES (@plantillaId, 1);
                    SET @secuencia = 1;
                END
                ELSE
                BEGIN
                    UPDATE CorrelativosReferencia SET ultimoNumero += 1, fechaActualizacion = @fechaAhora WHERE plantillaId = @plantillaId;
                    SELECT @secuencia = ultimoNumero FROM CorrelativosReferencia WHERE plantillaId = @plantillaId;
                END

                SET @secuenciaStr = RIGHT('000' + CONVERT(VARCHAR(10), @secuencia), 3);

                SET @referencia1 = @plantilla;
                SET @referencia1 = REPLACE(@referencia1, '{prefijo}', ISNULL(@prefijo, ''));
                SET @referencia1 = REPLACE(@referencia1, '{ubicacionId}', CONVERT(NVARCHAR, @ubicacionId));
                SET @referencia1 = REPLACE(@referencia1, '{anio}', @anio);
                SET @referencia1 = REPLACE(@referencia1, '{mes}', @mes);
                SET @referencia1 = REPLACE(@referencia1, '{dia}', @dia);
                SET @referencia1 = REPLACE(@referencia1, '{secuencia}', @secuenciaStr);

                DECLARE @bodegaId INT,
                        @referencia2 NVARCHAR(1000),
                        @referencia3 NVARCHAR(1000);

                SELECT 
                  @bodegaId = u.bodega_id,
                  @referencia2 = d.referencia2,
                  @referencia3 = d.referencia3
                FROM DetalleSolicitudTransporte d
                JOIN Ubicacion u ON u.id = @ubicacionId
                WHERE d.id = @detalleId;

                INSERT INTO Custodia (
                  bodega_id, item, ubicacionId, clienteId,
                  referencia1, referencia2, referencia3, estado, baja
                )
                VALUES (
                  @bodegaId, 'CAJA', @ubicacionId, @clienteId,
                  @referencia1, @referencia2, @referencia3, 'DISPONIBLE', 0
                );

                FETCH NEXT FROM cursorAsignaciones INTO @detalleId, @ubicacionId, @descripcion;
            END

            CLOSE cursorAsignaciones;
            DEALLOCATE cursorAsignaciones;
        END
    END

    IF @nuevoEstado = 'asignado a transportador'
    BEGIN
      UPDATE SolicitudTransporte 
      SET transportista = @transportista,
          documentoIdentidad = @documentoIdentidad,
          fechaAsignacion = GETDATE(),
          placa = @placa,
          stickerSeguridad = @sticker
      WHERE id = @solicitudId;
    END

    IF @nuevoEstado = 'recogido'
    BEGIN
      UPDATE SolicitudTransporte 
      SET fechaRecogida = GETDATE()
      WHERE id = @solicitudId;
    END

    IF @nuevoEstado = 'entregado por transportador'
    BEGIN
      UPDATE SolicitudTransporte 
      SET fechaRecogida = GETDATE()
      WHERE id = @solicitudId;
    END

    IF @modulo = 'Prestamo'
    BEGIN
        UPDATE SolicitudTransporte 
        SET estado = @nuevoEstado, updatedAt = @fechaAhora 
        WHERE id = @solicitudId;

        UPDATE DetalleSolicitudTransporte 
        SET estado = @nuevoEstado, updatedAt = @fechaAhora 
        WHERE solicitudTransporteId = @solicitudId;
    END
    
    IF @modulo = 'Prestamo' AND @nuevoEstado = 'entrega Confirmada'
    BEGIN                    
        UPDATE c
        SET 
            estado = 'ENTREGADO',
            updatedAt = @fechaAhora
        FROM Custodia c
        INNER JOIN DetalleSolicitudTransporte dst 
            ON c.referencia2 = dst.referencia2
        WHERE dst.solicitudTransporteId = @solicitudId;
        
        UPDATE SolicitudTransporte
        SET usuarioVerifica = @usuarioId,
            fechaVerificacion = GETDATE(),
            updatedAt = GETDATE()
        WHERE id = @solicitudId;
    END

    ELSE IF @modulo = 'Devolucion'
    BEGIN
        UPDATE dbo.Devoluciones 
        SET estado = @nuevoEstado, 
            updatedAt = @fechaAhora
        WHERE id = @solicitudId;

        UPDATE dbo.SolicitudTransporte 
        SET estado = @nuevoEstado, 
            updatedAt = @fechaAhora
        WHERE id = @solicitudId;
    END

    IF @modulo = 'Devolucion' AND @nuevoEstado = 'devolucion completada'
    BEGIN
        UPDATE c
        SET 
            estado = 'DISPONIBLE', 
            updatedAt = @fechaAhora
        FROM Custodia c
        INNER JOIN DetalleSolicitudTransporte dst 
            ON c.referencia2 = dst.referencia2
        WHERE dst.solicitudTransporteId = @solicitudId;
    END

    ELSE IF @modulo = 'Desarchive'
    BEGIN
        UPDATE SolicitudTransporte 
        SET estado = @nuevoEstado, updatedAt = @fechaAhora 
        WHERE id = @solicitudId;

        UPDATE DetalleSolicitudTransporte 
        SET estado = @nuevoEstado, updatedAt = @fechaAhora 
        WHERE solicitudTransporteId = @solicitudId;
    END
    
    IF @modulo = 'Desarchive' AND @nuevoEstado = 'desarchivado'
    BEGIN                    
        UPDATE c
        SET 
            estado = 'DESARCHIVADO',
            updatedAt = @fechaAhora
        FROM Custodia c
        INNER JOIN DetalleSolicitudTransporte dst 
            ON c.referencia2 = dst.referencia2
        WHERE dst.solicitudTransporteId = @solicitudId;
        
        UPDATE SolicitudTransporte
        SET usuarioVerifica = @usuarioId,
            fechaVerificacion = GETDATE(),
            updatedAt = GETDATE()
        WHERE id = @solicitudId;
    END

    -- 7. Auditoría (MODIFICADO PARA INCLUIR OBSERVACIONES DEL USUARIO)
    SET @observaciones = CONCAT('Transición: ', @estadoActual, ' → ', @nuevoEstado, ' | Módulo: ', @modulo);
    
    -- Si hay observaciones del usuario, agregarlas
    IF @observacionesUsuario IS NOT NULL AND LEN(LTRIM(RTRIM(@observacionesUsuario))) > 0
    BEGIN
        SET @observaciones = CONCAT(@observaciones, ' | Observaciones: ', LTRIM(RTRIM(@observacionesUsuario)));
    END

    INSERT INTO SolicitudTransporte_Audit (
        SolicitudID, EstadoAnterior, NuevoEstado, FechaEvento, Usuario, Comentarios
    )
    VALUES (
        @solicitudId, @estadoActual, @nuevoEstado, @fechaAhora, @usuarioId, @observaciones
    );

    -- 8. Desactivar QR si corresponde
    IF @nuevoEstado = 'entrega Confirmada' OR @nuevoEstado = 'prestamo completado' OR @nuevoEstado = 'devolucion completada' OR @nuevoEstado = 'desarchivado'
    SELECT @desactivarQR = desactivarQR FROM Estados WHERE nombre = @nuevoEstado;
    IF @desactivarQR = 1
        UPDATE QR_Solicitudes SET activo = 0 WHERE qrToken = @qrToken;

    COMMIT TRANSACTION;

    -- 9. Respuesta (MODIFICADA PARA INCLUIR OBSERVACIONES DEL USUARIO)
    SELECT 
        @solicitudId AS SolicitudId,
        @estadoActual AS EstadoAnterior,
        @nuevoEstado AS NuevoEstado,
        @fechaAhora AS FechaActualizacion,
        @observaciones AS Observaciones,
        @modulo AS Modulo,
        @observacionesUsuario AS ObservacionesUsuario; -- NUEVO CAMPO

  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrMsg, 16, 1);
  END CATCH
END
