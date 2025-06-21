-- Obtener información sobre la columna
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    OBJECT_NAME(d.parent_object_id) AS TableName,
    d.name AS ConstraintName,
    d.definition AS DefaultDefinition
FROM 
    sys.columns c
    INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
    LEFT JOIN sys.default_constraints d ON c.default_object_id = d.object_id
WHERE 
    OBJECT_NAME(c.object_id) = 'Transferencia'
    AND c.name = 'observacionesUsuario';

-- Obtener la lista completa de columnas en orden para el trigger
SELECT 
    c.name AS ColumnName,
    c.column_id AS ColumnOrder
FROM 
    sys.columns c
WHERE 
    OBJECT_NAME(c.object_id) = 'Transferencia'
ORDER BY 
    c.column_id;
