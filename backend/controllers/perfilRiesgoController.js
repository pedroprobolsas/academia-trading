const db = require('../config/db');

const createPerfilRiesgo = async (req, res) => {
  const usuario_id = req.user.id; // Del JWT
  const { 
    tolerancia_perdida, 
    impulsividad_score, 
    capital_disponible_rango, 
    experiencia_previa_anios, 
    expectativa_tiempo_meses 
  } = req.body;

  try {
    // Verificar si ya tiene un perfil
    const checkResult = await db.query('SELECT id FROM perfiles_riesgo WHERE usuario_id = $1', [usuario_id]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya tiene un perfil de riesgo asignado' });
    }

    const insertResult = await db.query(
      `INSERT INTO perfiles_riesgo 
      (usuario_id, tolerancia_perdida, impulsividad_score, capital_disponible_rango, experiencia_previa_anios, expectativa_tiempo_meses) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuario_id, tolerancia_perdida, impulsividad_score, capital_disponible_rango, experiencia_previa_anios, expectativa_tiempo_meses]
    );

    res.status(201).json({ 
      message: 'Perfil de riesgo creado exitosamente', 
      perfil: insertResult.rows[0] 
    });
  } catch (error) {
    console.error('Error al crear perfil de riesgo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  createPerfilRiesgo
};
