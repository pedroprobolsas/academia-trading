ALTER TABLE modulos ALTER COLUMN contenido_url DROP NOT NULL;
ALTER TABLE modulos DROP COLUMN contenido_tipo;
ALTER TABLE modulos ADD COLUMN youtube_url TEXT;
ALTER TABLE modulos ADD COLUMN drive_url TEXT;
ALTER TABLE modulos ADD COLUMN audio_url TEXT;
ALTER TABLE modulos ADD COLUMN contenido_texto TEXT;
ALTER TABLE modulos ADD COLUMN formato_principal VARCHAR(20) CHECK (formato_principal IN ('video','audio','documento','texto'));
