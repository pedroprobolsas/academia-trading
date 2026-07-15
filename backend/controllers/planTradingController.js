const db = require('../config/db');

// Obtener el plan activo del usuario
const getActivePlan = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM planes_trading WHERE usuario_id = $1 AND activo = true',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No tienes un plan de trading activo.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo plan de trading activo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo plan de trading (desactiva el anterior y versiona)
const createPlan = async (req, res) => {
  const usuarioId = req.user.id;
  const { 
    instrumentos_permitidos, 
    riesgo_maximo_operacion, 
    horarios_operacion, 
    setups_autorizados, 
    regla_stop_diario, 
    condiciones_no_operar 
  } = req.body;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Buscar si ya existe un plan activo para desactivarlo y sacar su versión
    const prevPlanResult = await client.query(
      'SELECT version FROM planes_trading WHERE usuario_id = $1 AND activo = true FOR UPDATE',
      [usuarioId]
    );

    let nextVersion = 1;
    if (prevPlanResult.rows.length > 0) {
      nextVersion = prevPlanResult.rows[0].version + 1;
      
      // Desactivar todos los planes anteriores del usuario
      await client.query(
        'UPDATE planes_trading SET activo = false WHERE usuario_id = $1',
        [usuarioId]
      );
    }

    // Insertar el nuevo plan activo
    const newPlanResult = await client.query(`
      INSERT INTO planes_trading (
        usuario_id, version, instrumentos_permitidos, riesgo_maximo_operacion, 
        horarios_operacion, setups_autorizados, regla_stop_diario, condiciones_no_operar, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [
      usuarioId,
      nextVersion,
      JSON.stringify(instrumentos_permitidos || []),
      riesgo_maximo_operacion,
      JSON.stringify(horarios_operacion || []),
      JSON.stringify(setups_autorizados || []),
      regla_stop_diario,
      condiciones_no_operar
    ]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Plan de trading creado exitosamente', plan: newPlanResult.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando plan de trading:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

module.exports = {
  getActivePlan,
  createPlan
};
