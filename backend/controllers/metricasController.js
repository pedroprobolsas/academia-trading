const db = require('../config/db');

// Algoritmo Secuencial para Racha de Pérdidas por Semana (Continua)
const calcularYGuardarConsistenciaSemanal = async (usuarioId) => {
  // Traemos todas las operaciones del usuario ordenadas cronológicamente
  const queryOps = `
    SELECT 
      DATE_TRUNC('week', fecha_operacion)::DATE AS semana_inicio,
      resultado_r_multiple 
    FROM operaciones_journal 
    WHERE usuario_id = $1 
    ORDER BY fecha_operacion ASC
  `;
  const resultOps = await db.query(queryOps, [usuarioId]);
  
  if (resultOps.rows.length === 0) return;

  // Agrupar operaciones por semana cronológicamente
  const semanas = [];
  let currentWeek = null;
  let currentWeekOps = [];

  for (const op of resultOps.rows) {
    const semStr = op.semana_inicio.toISOString().split('T')[0];
    if (currentWeek !== semStr) {
      if (currentWeek !== null) {
        semanas.push({ semana_inicio: currentWeek, operaciones: currentWeekOps });
      }
      currentWeek = semStr;
      currentWeekOps = [];
    }
    currentWeekOps.push(op);
  }
  if (currentWeek !== null) {
    semanas.push({ semana_inicio: currentWeek, operaciones: currentWeekOps });
  }

  let rachaActual = 0; // Esta variable sobrevive al cambio de semana

  for (const sem of semanas) {
    let rachaMaximaSemanal = 0;

    for (const op of sem.operaciones) {
      if (op.resultado_r_multiple < 0) {
        rachaActual++;
        if (rachaActual > rachaMaximaSemanal) {
          rachaMaximaSemanal = rachaActual;
        }
      } else if (op.resultado_r_multiple >= 0) {
        rachaActual = 0;
      }
    }

    // Upsert en metricas_consistencia_semanal
    const queryUpsert = `
      INSERT INTO metricas_consistencia_semanal (usuario_id, semana_inicio, racha_perdidas_maxima, calculado_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (usuario_id, semana_inicio) 
      DO UPDATE SET 
        racha_perdidas_maxima = EXCLUDED.racha_perdidas_maxima,
        calculado_at = NOW()
    `;
    await db.query(queryUpsert, [usuarioId, sem.semana_inicio, rachaMaximaSemanal]);
  }
};

const refreshMetricasCron = async (req, res) => {
  try {
    // 1. Refresco concurrente de la vista materializada (no bloquea lectura)
    await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY metricas_usuario');

    // 2. Ejecutar algoritmo secuencial de consistencia para todos los usuarios que operaron
    // (Para MVP, iteramos sobre usuarios distintos en operaciones_journal)
    const usuariosRes = await db.query('SELECT DISTINCT usuario_id FROM operaciones_journal');
    
    for (const row of usuariosRes.rows) {
      await calcularYGuardarConsistenciaSemanal(row.usuario_id);
    }

    res.json({ message: 'Métricas refrescadas correctamente.' });
  } catch (error) {
    console.error('Error refrescando métricas:', error);
    res.status(500).json({ error: 'Error interno al refrescar métricas' });
  }
};

const getMiDashboard = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const viewRes = await db.query('SELECT * FROM metricas_usuario WHERE usuario_id = $1', [usuarioId]);
    const metricas = viewRes.rows[0] || null;

    const consistenciaRes = await db.query(`
      SELECT semana_inicio, racha_perdidas_maxima 
      FROM metricas_consistencia_semanal 
      WHERE usuario_id = $1 
      ORDER BY semana_inicio DESC 
      LIMIT 12
    `, [usuarioId]);

    res.json({
      metricas_globales: metricas,
      consistencia_semanal: consistenciaRes.rows
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ error: 'Error obteniendo dashboard' });
  }
};

module.exports = {
  refreshMetricasCron,
  getMiDashboard
};
