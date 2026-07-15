-- Migración UP: Arquitectura Híbrida del Gestor de Currículum
-- ATENCIÓN: Este script preserva las columnas de la versión 1.

-- 1. Actualizar tabla modulos
ALTER TABLE modulos
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'piloto', 'publicado', 'archivado')),
  ADD COLUMN IF NOT EXISTS subtitulo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS descripcion_corta VARCHAR(255),
  ADD COLUMN IF NOT EXISTS imagen_portada_object_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS version SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS modulo_raiz_id UUID REFERENCES modulos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version_anterior_id UUID REFERENCES modulos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publicado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Trigger para updated_at en modulos (si no existe un mecanismo global, crearemos uno genérico)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_modulos_updated_at') THEN
        CREATE TRIGGER set_modulos_updated_at
        BEFORE UPDATE ON modulos
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;


-- 2. Crear tabla misiones
CREATE TABLE IF NOT EXISTS misiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  numero_orden SMALLINT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  objetivo TEXT,
  tipo VARCHAR(50),
  duracion_estimada_min SMALLINT,
  obligatoria BOOLEAN NOT NULL DEFAULT true,
  criterio_desbloqueo VARCHAR(100),
  mensaje_finalizacion TEXT,
  gancho_siguiente TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_misiones_orden UNIQUE (modulo_id, numero_orden)
);

CREATE INDEX IF NOT EXISTS idx_misiones_modulo_id ON misiones(modulo_id);

CREATE TRIGGER set_misiones_updated_at
BEFORE UPDATE ON misiones
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- 3. Crear tabla bloques_contenido
CREATE TABLE IF NOT EXISTS bloques_contenido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mision_id UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  numero_orden SMALLINT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  obligatorio BOOLEAN NOT NULL DEFAULT true,
  duracion_estimada_min SMALLINT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_bloques_orden UNIQUE (mision_id, numero_orden)
);

CREATE INDEX IF NOT EXISTS idx_bloques_mision_id ON bloques_contenido(mision_id);
CREATE INDEX IF NOT EXISTS idx_modulos_estado ON modulos(estado);

CREATE TRIGGER set_bloques_updated_at
BEFORE UPDATE ON bloques_contenido
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
