const db = require('../config/db');
require('dotenv').config();

const solicitarCertificacion = async (req, res) => {
  const usuarioId = req.user.id;
  
  // Configuraciones dadas en el Plan (fijas si no hay en ENV)
  const MIN_OPERACIONES = parseInt(process.env.CERT_MIN_OPERACIONES) || 30;
  const MIN_ADHERENCIA = parseFloat(process.env.CERT_MIN_ADHERENCIA) || 80.00;
  const MIN_R_MULTIPLE = parseFloat(process.env.CERT_MIN_R_MULTIPLE) || 0.01; // > 0

  try {
    const viewRes = await db.query('SELECT total_operaciones, pct_adherencia_plan, r_multiple_promedio FROM metricas_usuario WHERE usuario_id = $1', [usuarioId]);
    
    if (viewRes.rows.length === 0) {
      return res.status(400).json({ error: 'No tienes operaciones registradas.' });
    }

    const metricas = viewRes.rows[0];
    const totalOps = parseInt(metricas.total_operaciones);
    const adherencia = parseFloat(metricas.pct_adherencia_plan);
    const rMultiple = parseFloat(metricas.r_multiple_promedio);

    const cumpleOps = totalOps >= MIN_OPERACIONES;
    const cumpleAdherencia = adherencia >= MIN_ADHERENCIA;
    const cumpleR = rMultiple >= MIN_R_MULTIPLE;

    const estaAprobado = cumpleOps && cumpleAdherencia && cumpleR;
    const estadoCert = estaAprobado ? 'pendiente' : 'rechazado';
    
    const criteriosJSON = {
      operaciones: { valor: totalOps, requerido: MIN_OPERACIONES, cumple: cumpleOps },
      adherencia: { valor: adherencia, requerido: MIN_ADHERENCIA, cumple: cumpleAdherencia },
      r_multiple: { valor: rMultiple, requerido: MIN_R_MULTIPLE, cumple: cumpleR }
    };

    const insertRes = await db.query(`
      INSERT INTO certificaciones (usuario_id, criterios_cumplidos, estado) 
      VALUES ($1, $2, $3) RETURNING id, estado, criterios_cumplidos
    `, [usuarioId, criteriosJSON, estadoCert]);

    res.status(201).json({
      message: estaAprobado ? 'Solicitud enviada para revisión.' : 'No cumples los criterios.',
      certificacion: insertRes.rows[0]
    });

  } catch (error) {
    console.error('Error solicitando certificación:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

const getCandidatos = async (req, res) => {
  try {
    // Consulta Admin: trae la SOLICITUD MÁS RECIENTE por usuario, y luego la filtra solo si está "pendiente".
    // Esto resuelve el requerimiento de QA sobre el DISTINCT ON (usuario_id).
    const query = `
      SELECT * FROM (
        SELECT DISTINCT ON (c.usuario_id) 
          c.id, c.usuario_id, c.estado, c.criterios_cumplidos, c.created_at,
          u.nombre_completo, u.email
        FROM certificaciones c
        JOIN usuarios u ON c.usuario_id = u.id
        ORDER BY c.usuario_id, c.created_at DESC
      ) sub
      WHERE estado = 'pendiente'
      ORDER BY created_at ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo candidatos:', error);
    res.status(500).json({ error: 'Error interno obteniendo candidatos' });
  }
};

const setEstadoCertificacion = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (estado !== 'aprobado' && estado !== 'rechazado') {
    return res.status(400).json({ error: "Estado inválido. Debe ser 'aprobado' o 'rechazado'." });
  }

  try {
    const result = await db.query(`
      UPDATE certificaciones 
      SET estado = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, estado, usuario_id
    `, [estado, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificación no encontrada' });
    }

    res.json({ message: 'Certificación actualizada', certificacion: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando certificación:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = {
  solicitarCertificacion,
  getCandidatos,
  setEstadoCertificacion
};
