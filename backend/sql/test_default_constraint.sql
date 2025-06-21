-- Prueba para verificar si la restricción DEFAULT funciona
-- Primero, crear una inserción que no especifique observacionesUsuario
-- Nota: Adapta esto según las columnas obligatorias de tu tabla
INSERT INTO Transferencia 
(columna1, columna2, /* otras columnas obligatorias */)
VALUES 
('valor1', 'valor2', /* otros valores */);

-- Luego, verificar que se haya insertado con '[]' por defecto
SELECT TOP 1 
    observacionesUsuario
FROM 
    Transferencia
ORDER BY 
    /* columna de fecha o ID */ DESC;
