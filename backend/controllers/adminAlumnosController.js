const db = require('../config/db');

// Listado general filtrado estrictamente por rol = 'alumno'
const getAlumnos = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.nombre_completo, u.email, u.estado, u.created_at,
             m.total_operaciones, m.win_rate, m.r_multiple_promedio, m.pct_adherencia_plan
      FROM usuarios u
      LEFT JOIN metricas_usuario m ON u.id = m.usuario_id
      WHERE u.rol = 'alumno'
      ORDER BY u.created_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo listado de alumnos:', error);
    res.status(500).json({ error: 'Error interno obteniendo alumnos' });
  }
};

// Modificador de estado manual (Bloqueo/Desbloqueo)
const setEstadoAlumno = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (estado !== 'activo' && estado !== 'inactivo') {
    return res.status(400).json({ error: "Estado inválido. Debe ser 'activo' o 'inactivo'." });
  }

  try {
    const result = await db.query(`
      UPDATE usuarios 
      SET estado = $1 
      WHERE id = $2 AND rol = 'alumno'
      RETURNING id, nombre_completo, estado
    `, [estado, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json({ message: 'Estado actualizado', alumno: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando estado del alumno:', error);
    res.status(500).json({ error: 'Error interno actualizando estado' });
  }
};

// Escáner forense de patrones de riesgo (Solo lectura)
const getPatronesRiesgo = async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Sobreoperación
    const sobreoperacionQuery = await db.query(`
      SELECT COUNT(*) as count 
      FROM operaciones_journal 
      WHERE usuario_id = $1 AND sobreoperacion = true
    `, [id]);
    
    // 2. Origen de señal ajeno al plan
    const senalQuery = await db.query(`
      SELECT COUNT(*) as count 
      FROM operaciones_journal 
      WHERE usuario_id = $1 AND origen_senal != 'senal_plan'
    `, [id]);

    // 3. Exceso de riesgo (Calculado dinámicamente uniendo la operación con la versión del plan vigente en ese momento)
    // El MVP asume que el plan en curso aplica o que simplemente guardamos en bitácora el riesgo tomado.
    // Usaremos las banderas que evalúan el respeto
    const desobedienciaPlanQuery = await db.query(`
      SELECT COUNT(*) as count 
      FROM operaciones_journal 
      WHERE usuario_id = $1 AND respeto_plan = false
    `, [id]);

    res.json({
      alertas: {
        sobreoperacion_frecuencia: parseInt(sobreoperacionQuery.rows[0].count),
        senales_externas_frecuencia: parseInt(senalQuery.rows[0].count),
        desobediencia_estructural_frecuencia: parseInt(desobedienciaPlanQuery.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Error escaneando patrones:', error);
    res.status(500).json({ error: 'Error interno escaneando patrones' });
  }
};

module.exports = {
  getAlumnos,
  setEstadoAlumno,
  getPatronesRiesgo
};
