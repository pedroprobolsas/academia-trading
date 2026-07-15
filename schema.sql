CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(30),
  pais VARCHAR(50),
  rol VARCHAR(20) NOT NULL DEFAULT 'alumno' CHECK (rol IN ('alumno','admin')),
  nivel_experiencia VARCHAR(20) CHECK (nivel_experiencia IN ('principiante','intermedio','avanzado')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','graduado')),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- 2. Perfil de riesgo (1-a-1, diagnóstico inicial)
CREATE TABLE perfiles_riesgo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  tolerancia_perdida SMALLINT CHECK (tolerancia_perdida BETWEEN 1 AND 10),
  impulsividad_score SMALLINT CHECK (impulsividad_score BETWEEN 1 AND 10),
  capital_disponible_rango VARCHAR(30),
  experiencia_previa_anios NUMERIC(4,1),
  expectativa_tiempo_meses SMALLINT,
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Plan de trading (versionado — un alumno puede tener varios a lo largo del tiempo,
--    pero solo uno activo). El journal referencia el plan vigente al momento de operar.
CREATE TABLE planes_trading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  version SMALLINT NOT NULL DEFAULT 1,
  instrumentos_permitidos JSONB NOT NULL,
  riesgo_maximo_operacion NUMERIC(4,2) NOT NULL,
  horarios_operacion JSONB,
  setups_autorizados JSONB NOT NULL,
  regla_stop_diario NUMERIC(5,2),
  condiciones_no_operar TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_plan_activo_unico ON planes_trading (usuario_id) WHERE activo = true;

-- 4. Módulos del curriculum (los 10 ya definidos)
CREATE TABLE modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden SMALLINT NOT NULL UNIQUE,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  nivel SMALLINT NOT NULL CHECK (nivel BETWEEN 1 AND 4),
  contenido_url TEXT NOT NULL,
  contenido_tipo VARCHAR(20) CHECK (contenido_tipo IN ('video','documento','notion','otro')),
  duracion_estimada_min SMALLINT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Preguntas de quiz (teoría + práctica auto-calificable)
CREATE TABLE preguntas_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('opcion_multiple','verdadero_falso','practica_seleccion','practica_numerica')),
  opciones JSONB,
  respuesta_correcta JSONB NOT NULL,
  explicacion TEXT,
  dificultad SMALLINT CHECK (dificultad BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Intentos de quiz (diagnóstico inicial, checkpoints, diagnóstico final)
CREATE TABLE quiz_intentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_id UUID REFERENCES modulos(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('diagnostico_inicial','checkpoint_modulo','diagnostico_final')),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  puntaje NUMERIC(5,2),
  aprobado BOOLEAN,
  respuestas JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Progreso por módulo (control de desbloqueo secuencial)
CREATE TABLE progreso_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'bloqueado' CHECK (estado IN ('bloqueado','disponible','en_progreso','completado')),
  intentos_quiz SMALLINT NOT NULL DEFAULT 0,
  fecha_inicio TIMESTAMPTZ,
  fecha_completado TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, modulo_id)
);

-- 8. Bitácora de operaciones en demo (el corazón de la evidencia)
--    Incluye evaluación de calidad de la operación y estado emocional,
--    no solo el resultado en dinero.
CREATE TABLE operaciones_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES planes_trading(id) ON DELETE SET NULL,
  fecha_operacion TIMESTAMPTZ NOT NULL,
  instrumento VARCHAR(50) NOT NULL,
  direccion VARCHAR(10) NOT NULL CHECK (direccion IN ('compra','venta')),
  setup_usado VARCHAR(50) NOT NULL CHECK (setup_usado IN ('soporte_resistencia','accion_precio','medias_moviles','bmsb','otro')),
  riesgo_porcentaje NUMERIC(4,2) NOT NULL,
  precio_entrada NUMERIC(14,4),
  precio_salida NUMERIC(14,4),
  resultado_r_multiple NUMERIC(6,2),
  resultado_moneda NUMERIC(14,2),

  respeto_entrada BOOLEAN NOT NULL DEFAULT true,
  respeto_stop BOOLEAN NOT NULL DEFAULT true,
  respeto_take_profit BOOLEAN NOT NULL DEFAULT true,
  origen_senal VARCHAR(20) NOT NULL CHECK (origen_senal IN ('senal_plan','impulso','fomo','revenge_trade','otro')),
  movio_stop BOOLEAN NOT NULL DEFAULT false,
  sobreoperacion BOOLEAN NOT NULL DEFAULT false,
  respeto_plan BOOLEAN NOT NULL,

  emocion_previa VARCHAR(20) CHECK (emocion_previa IN ('calma','confianza','ansiedad','euforia','miedo','frustracion','aburrimiento')),
  emocion_durante VARCHAR(20) CHECK (emocion_durante IN ('calma','confianza','ansiedad','euforia','miedo','frustracion','aburrimiento')),
  emocion_posterior VARCHAR(20) CHECK (emocion_posterior IN ('calma','confianza','ansiedad','euforia','miedo','frustracion','aburrimiento')),

  notas TEXT,
  captura_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Métricas agregadas por usuario (recalculada por cron, no escrita directamente)
CREATE MATERIALIZED VIEW metricas_usuario AS
SELECT
  usuario_id,
  COUNT(*) AS total_operaciones,
  ROUND(AVG(CASE WHEN resultado_r_multiple > 0 THEN 1 ELSE 0 END) * 100, 2) AS win_rate,
  ROUND(AVG(resultado_r_multiple), 2) AS r_multiple_promedio,
  ROUND(MIN(resultado_r_multiple), 2) AS peor_operacion_r,
  ROUND(AVG(CASE WHEN respeto_plan THEN 1 ELSE 0 END) * 100, 2) AS pct_adherencia_plan,
  MAX(fecha_operacion) AS ultima_operacion
FROM operaciones_journal
GROUP BY usuario_id;

-- 10. Métricas de consistencia, snapshot semanal (calculado por job de backend,
--     no por vista SQL pura — racha de pérdidas y cumplimiento semanal
--     necesitan lógica secuencial sobre operaciones ordenadas por fecha)
CREATE TABLE metricas_consistencia_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  operaciones_totales SMALLINT,
  dias_operados SMALLINT,
  racha_perdidas_maxima SMALLINT,
  perdida_maxima_diaria NUMERIC(6,2),
  cumplimiento_plan_pct NUMERIC(5,2),
  calculado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, semana_inicio)
);

-- 11. Certificaciones
CREATE TABLE certificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_certificacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  criterios_cumplidos JSONB NOT NULL,
  nivel_certificado VARCHAR(30),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  motivo_rechazo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
