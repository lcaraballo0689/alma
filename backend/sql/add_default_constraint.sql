-- Primero aseguremos que los valores NULL existentes sean actualizados a '[]'
UPDATE Transferencia 
SET observacionesUsuario = '[]' 
WHERE observacionesUsuario IS NULL;

-- Luego agregar la restricción DEFAULT con la sintaxis correcta
ALTER TABLE Transferencia
ADD CONSTRAINT DF_Transferencia_observacionesUsuario DEFAULT '[]' FOR observacionesUsuario;
