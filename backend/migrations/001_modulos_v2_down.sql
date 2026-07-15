-- Migración DOWN: Arquitectura Híbrida del Gestor de Currículum
-- ATENCIÓN: SCRIPT DESTRUCTIVO.
-- Este script elimina toda la información creada en las tablas "misiones" y "bloques_contenido".
-- SOLO EJECUTAR CON UN BACKUP PREVIO DE LA BASE DE DATOS.

-- 1. Eliminar tablas jerárquicas
DROP TABLE IF EXISTS bloques_contenido CASCADE;
DROP TABLE IF EXISTS misiones CASCADE;

-- 2. Remover funciones y triggers (si no son compartidos)
-- DROP TRIGGER IF EXISTS set_misiones_updated_at ON misiones;
-- DROP TRIGGER IF EXISTS set_bloques_updated_at ON bloques_contenido;
-- DROP TRIGGER IF EXISTS set_modulos_updated_at ON modulos;
-- DROP FUNCTION IF EXISTS update_updated_at_column;

-- 3. Remover columnas de modulos
ALTER TABLE modulos
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS subtitulo,
  DROP COLUMN IF EXISTS descripcion_corta,
  DROP COLUMN IF EXISTS imagen_portada_object_name,
  DROP COLUMN IF EXISTS version,
  DROP COLUMN IF EXISTS modulo_raiz_id,
  DROP COLUMN IF EXISTS version_anterior_id,
  DROP COLUMN IF EXISTS publicado_at,
  DROP COLUMN IF EXISTS metadata;
