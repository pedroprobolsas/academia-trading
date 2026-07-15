const db = require('../config/db');

// Obtener todos los módulos con el progreso del usuario actual
const getModulos = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    // Obtenemos los módulos y hacemos LEFT JOIN con progreso_modulos
    const result = await db.query(`
      SELECT 
        m.id, 
        m.numero_orden, 
        m.titulo, 
        m.descripcion, 
        m.nivel, 
        m.youtube_url, 
        m.drive_url, 
        m.audio_url,
        m.contenido_texto,
        m.formato_principal,
        m.duracion_estimada_min,
        COALESCE(pm.estado, 'bloqueado') as estado,
        COALESCE(pm.intentos_quiz, 0) as intentos_quiz
      FROM modulos m
      LEFT JOIN progreso_modulos pm ON m.id = pm.modulo_id AND pm.usuario_id = $1
      WHERE m.activo = true
      ORDER BY m.numero_orden ASC
    `, [usuarioId]);

    // Lógica de fallback: Si el módulo 1 no tiene registro en progreso_modulos, lo forzamos a 'disponible' en memoria
    // ya que el módulo 1 siempre debe estar disponible al inicio.
    const modulos = result.rows.map(m => {
      if (m.numero_orden === 1 && m.estado === 'bloqueado') {
        m.estado = 'disponible';
      }
      return m;
    });

    res.json(modulos);
  } catch (error) {
    console.error('Error obteniendo módulos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getModulos
};
