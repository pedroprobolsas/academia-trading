CREATE UNIQUE INDEX IF NOT EXISTS idx_metricas_usuario_id ON metricas_usuario(usuario_id);
ALTER TABLE certificaciones ADD COLUMN motivo_rechazo TEXT;
