-- Migración: Motor de Progreso Granular
-- Añade tablas para rastrear el progreso a nivel de misión y bloque.

BEGIN;

-- 1. Tabla: progreso_misiones
CREATE TABLE IF NOT EXISTS progreso_misiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mision_id UUID NOT NULL REFERENCES misiones(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('bloqueada', 'disponible', 'en_progreso', 'completada')),
  intentos_quiz SMALLINT NOT NULL DEFAULT 0,
  completada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_progreso_misiones UNIQUE (usuario_id, mision_id)
);

CREATE INDEX IF NOT EXISTS idx_progreso_misiones_usuario ON progreso_misiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progreso_misiones_mision ON progreso_misiones(mision_id);

CREATE TRIGGER set_progreso_misiones_updated_at
BEFORE UPDATE ON progreso_misiones
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- 2. Tabla: progreso_bloques
CREATE TABLE IF NOT EXISTS progreso_bloques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  bloque_id UUID NOT NULL REFERENCES bloques_contenido(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado')),
  metricas_consumo JSONB NOT NULL DEFAULT '{}'::jsonb, -- Ejemplo: {"porcentaje_video": 85, "tiempo_lectura_segundos": 120}
  completado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_progreso_bloques UNIQUE (usuario_id, bloque_id)
);

CREATE INDEX IF NOT EXISTS idx_progreso_bloques_usuario ON progreso_bloques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progreso_bloques_bloque ON progreso_bloques(bloque_id);

CREATE TRIGGER set_progreso_bloques_updated_at
BEFORE UPDATE ON progreso_bloques
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

COMMIT;
