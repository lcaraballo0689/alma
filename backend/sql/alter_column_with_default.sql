-- Actualizar valores NULL existentes
UPDATE Transferencia 
SET observacionesUsuario = '[]' 
WHERE observacionesUsuario IS NULL;

-- Modificar la definición de la columna para incluir un valor DEFAULT
-- Nota: Ajusta el tipo de datos según corresponda (nvarchar, varchar, etc.)
ALTER TABLE Transferencia 
ALTER COLUMN observacionesUsuario VARCHAR(MAX) NOT NULL DEFAULT '[]';
