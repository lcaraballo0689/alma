IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[password_resets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[password_resets] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [email] NVARCHAR(255) NOT NULL,
        [token] NVARCHAR(255) NOT NULL,
        [used] BIT DEFAULT 0,
        [expires_at] DATETIME NOT NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_PasswordResets_Usuarios] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Usuarios]([id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_PasswordResets_Token] ON [dbo].[password_resets]([token]);
    CREATE INDEX [IX_PasswordResets_Email] ON [dbo].[password_resets]([email]);
END

-- Trigger para actualizar updated_at automáticamente
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE object_id = OBJECT_ID(N'[dbo].[TR_PasswordResets_UpdatedAt]'))
BEGIN
    EXEC('CREATE TRIGGER [dbo].[TR_PasswordResets_UpdatedAt]
    ON [dbo].[password_resets]
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE [dbo].[password_resets]
        SET [updated_at] = GETDATE()
        FROM [dbo].[password_resets] t
        INNER JOIN inserted i ON t.id = i.id;
    END')
END 