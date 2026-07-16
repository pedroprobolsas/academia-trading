const db = require('../config/db');

// POST /api/progreso/bloques/:bloque_id/completar
const completarBloque = async (req, res) => {
  const { bloque_id } = req.params;
  const usuario_id = req.user.id;
  const { metricas_consumo } = req.body; // Ej: { porcentaje_video: 85, tiempo_lectura_segundos: 120 }

  try {
    // 1. Obtener información del bloque para validar
    const bloqueRes = await db.query('SELECT * FROM bloques_contenido WHERE id = $1', [bloque_id]);
    if (bloqueRes.rows.length === 0) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }
    const bloque = bloqueRes.rows[0];

    // 2. Validación de "Consumo Real" según el tipo de bloque
    if (bloque.tipo === 'video_youtube' || bloque.tipo === 'audio') {
      const porcentaje = metricas_consumo?.porcentaje_reproducido || 0;
      if (porcentaje < 80) {
        return res.status(400).json({ error: `Debe reproducir al menos el 80%. (Actual: ${porcentaje}%)` });
      }
    } else if (bloque.tipo === 'texto_markdown' || bloque.tipo === 'documento_drive') {
      const tiempoSegundos = metricas_consumo?.tiempo_lectura_segundos || 0;
      // Requerimos al menos 30 segundos como regla básica de lectura
      if (tiempoSegundos < 30) {
        return res.status(400).json({ error: `Debe permanecer al menos 30 segundos leyendo. (Actual: ${tiempoSegundos}s)` });
      }
    } else if (bloque.tipo === 'quiz_inline') {
      const passed = metricas_consumo?.aprobado === true;
      if (!passed) {
        return res.status(400).json({ error: 'Debe aprobar el quiz para completar el bloque.' });
      }
    }

    // 3. Upsert en progreso_bloques
    const upsertQuery = `
      INSERT INTO progreso_bloques (usuario_id, bloque_id, estado, metricas_consumo, completado_at)
      VALUES ($1, $2, 'completado', $3, now())
      ON CONFLICT (usuario_id, bloque_id) 
      DO UPDATE SET 
        estado = 'completado', 
        metricas_consumo = $3,
        completado_at = now()
      RETURNING *
    `;
    const result = await db.query(upsertQuery, [usuario_id, bloque_id, JSON.stringify(metricas_consumo)]);

    // 4. Autocompletar Misión si todos sus bloques obligatorios están completados
    await checkMisionCompletion(usuario_id, bloque.mision_id);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error completando bloque:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/progreso/misiones/:mision_id/completar
// Este endpoint permite forzar el completado o se llama automáticamente desde checkMisionCompletion
const completarMision = async (req, res) => {
  const { mision_id } = req.params;
  const usuario_id = req.user.id;

  try {
    const isCompleted = await checkMisionCompletion(usuario_id, mision_id);
    if (isCompleted) {
      res.json({ success: true, message: 'Misión completada exitosamente' });
    } else {
      res.status(400).json({ error: 'Faltan bloques obligatorios por completar en esta misión.' });
    }
  } catch (error) {
    console.error('Error completando misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función interna para evaluar si la misión ya cumplió todos los bloques obligatorios
async function checkMisionCompletion(usuario_id, mision_id) {
  // Obtenemos los bloques obligatorios de esta misión
  const bloquesRes = await db.query(`
    SELECT b.id, pb.estado
    FROM bloques_contenido b
    LEFT JOIN progreso_bloques pb ON b.id = pb.bloque_id AND pb.usuario_id = $1
    WHERE b.mision_id = $2 AND b.obligatorio = true
  `, [usuario_id, mision_id]);

  const todosCompletos = bloquesRes.rows.every(b => b.estado === 'completado');

  if (todosCompletos) {
    // Upsert progreso_misiones
    await db.query(`
      INSERT INTO progreso_misiones (usuario_id, mision_id, estado, completada_at)
      VALUES ($1, $2, 'completada', now())
      ON CONFLICT (usuario_id, mision_id)
      DO UPDATE SET estado = 'completada', completada_at = COALESCE(progreso_misiones.completada_at, now())
    `, [usuario_id, mision_id]);

    // Lógica de desbloqueo secuencial (abrir la siguiente misión)
    await desbloquearSiguienteMision(usuario_id, mision_id);
    return true;
  }
  return false;
}

// Abre la siguiente misión del mismo módulo
async function desbloquearSiguienteMision(usuario_id, mision_actual_id) {
  // 1. Encontrar la misión actual y su orden
  const misionRes = await db.query('SELECT modulo_id, numero_orden FROM misiones WHERE id = $1', [mision_actual_id]);
  if (misionRes.rows.length === 0) return;
  const actual = misionRes.rows[0];

  // 2. Buscar la siguiente misión (orden actual + 1)
  const siguienteRes = await db.query(`
    SELECT id FROM misiones 
    WHERE modulo_id = $1 AND numero_orden = $2
  `, [actual.modulo_id, actual.numero_orden + 1]);

  if (siguienteRes.rows.length > 0) {
    const siguiente_id = siguienteRes.rows[0].id;
    // Marcar como 'disponible' (si no existe el registro)
    await db.query(`
      INSERT INTO progreso_misiones (usuario_id, mision_id, estado)
      VALUES ($1, $2, 'disponible')
      ON CONFLICT (usuario_id, mision_id) DO NOTHING
    `, [usuario_id, siguiente_id]);
  } else {
    // Si no hay siguiente misión, el módulo entero está completado
    await db.query(`
      INSERT INTO progreso_modulos (usuario_id, modulo_id, estado, fecha_completado)
      VALUES ($1, $2, 'completado', now())
      ON CONFLICT (usuario_id, modulo_id) 
      DO UPDATE SET estado = 'completado', fecha_completado = COALESCE(progreso_modulos.fecha_completado, now())
    `, [usuario_id, actual.modulo_id]);
  }
}

// GET /api/progreso/modulos/:modulo_id
const getProgresoModulo = async (req, res) => {
  const { modulo_id } = req.params;
  const usuario_id = req.user.id;

  try {
    // 1. Validar que el usuario tenga acceso al módulo (ya sea porque es el 1, o porque está desbloqueado)
    const modRes = await db.query('SELECT * FROM modulos WHERE id = $1 AND activo = true', [modulo_id]);
    if (modRes.rows.length === 0) return res.status(404).json({ error: 'Módulo no encontrado' });
    const modulo = modRes.rows[0];

    // 2. Traer Misiones con su progreso
    const misionesRes = await db.query(`
      SELECT m.*, COALESCE(pm.estado, 
        CASE WHEN m.numero_orden = 1 THEN 'disponible' ELSE 'bloqueada' END
      ) as estado_progreso
      FROM misiones m
      LEFT JOIN progreso_misiones pm ON m.id = pm.mision_id AND pm.usuario_id = $1
      WHERE m.modulo_id = $2
      ORDER BY m.numero_orden ASC
    `, [usuario_id, modulo_id]);
    const misiones = misionesRes.rows;

    // 3. Traer Bloques con su progreso
    if (misiones.length > 0) {
      const misionIds = misiones.map(m => m.id);
      const bloquesRes = await db.query(`
        SELECT b.*, COALESCE(pb.estado, 'pendiente') as estado_progreso, pb.metricas_consumo
        FROM bloques_contenido b
        LEFT JOIN progreso_bloques pb ON b.id = pb.bloque_id AND pb.usuario_id = $1
        WHERE b.mision_id = ANY($2)
        ORDER BY b.numero_orden ASC
      `, [usuario_id, misionIds]);
      
      const bloques = bloquesRes.rows;
      misiones.forEach(m => {
        m.bloques = bloques.filter(b => b.mision_id === m.id);
      });
    }

    modulo.misiones = misiones;
    res.json(modulo);
  } catch (error) {
    console.error('Error obteniendo progreso del módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  completarBloque,
  completarMision,
  getProgresoModulo
};
