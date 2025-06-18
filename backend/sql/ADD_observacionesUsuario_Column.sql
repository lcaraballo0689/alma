-- Script para agregar la columna observacionesUsuario a la tabla SolicitudTransporte
-- Este script debe ejecutarse ANTES de usar el sistema de observaciones del timeline

USE [bodegapp_prod]
GO

-- Verificar si la columna ya existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'SolicitudTransporte' 
    AND COLUMN_NAME = 'observacionesUsuario'
)
BEGIN
    -- Agregar la columna observacionesUsuario como JSON
    ALTER TABLE [dbo].[SolicitudTransporte]
    ADD [observacionesUsuario] NVARCHAR(MAX) NULL
    
    -- Agregar constraint para validar que sea JSON válido (SQL Server 2016+)
    -- Comentar la siguiente línea si usas una versión anterior de SQL Server
    ALTER TABLE [dbo].[SolicitudTransporte]
    ADD CONSTRAINT [CK_SolicitudTransporte_observacionesUsuario_JSON] 
    CHECK (ISJSON([observacionesUsuario]) = 1 OR [observacionesUsuario] IS NULL)
    
    PRINT 'Columna observacionesUsuario agregada exitosamente a la tabla SolicitudTransporte'
END
ELSE
BEGIN
    PRINT 'La columna observacionesUsuario ya existe en la tabla SolicitudTransporte'
END
GO

-- Verificar la estructura de la tabla después del cambio
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'SolicitudTransporte' 
    AND COLUMN_NAME = 'observacionesUsuario'
GO
