-- Crear tabla de reseteo de contraseñas si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PasswordResets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PasswordResets] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [usuario_id] INT NOT NULL,
        [token] VARCHAR(255) NOT NULL,
        [expiracion] DATETIME NOT NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_PasswordResets_Usuario] FOREIGN KEY ([usuario_id]) 
            REFERENCES [dbo].[Usuario] ([id])
            ON DELETE CASCADE
    )

    -- Crear índices
    CREATE INDEX [IX_PasswordResets_Token] ON [dbo].[PasswordResets] ([token])
    CREATE INDEX [IX_PasswordResets_UsuarioId] ON [dbo].[PasswordResets] ([usuario_id])
END 