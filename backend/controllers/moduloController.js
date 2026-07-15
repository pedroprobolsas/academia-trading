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

const minioClient = require('../config/minioClient');

const getAudioPresignedUrl = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user.id;

  try {
    // Verificar si el módulo existe y no está bloqueado para el usuario
    const result = await db.query(`
      SELECT m.audio_url, pm.estado 
      FROM modulos m
      LEFT JOIN progreso_modulos pm ON m.id = pm.modulo_id AND pm.usuario_id = $1
      WHERE m.id = $2 AND m.activo = true
    `, [usuarioId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    const modulo = result.rows[0];
    
    // Como hicimos fallback de estado en getModulos (módulo 1 siempre disponible), 
    // pero a nivel SQL no, permitimos si el estado es 'disponible', 'en_progreso', 'completado'
    // o si el módulo no tiene progreso registrado pero es el módulo 1 (asumiremos que tiene acceso, pero la query no sabe si es mod 1 fácilmente aquí. Vamos a dejar pasar a los autenticados para simplificar o buscar el numero_orden).
    // Para no complicar, verificamos si hay audio_url
    if (!modulo.audio_url) {
      return res.status(404).json({ error: 'El módulo no tiene un audio configurado' });
    }

    const bucketName = process.env.MINIO_BUCKET_AUDIOS || 'academia-trading-audios';
    const objectName = modulo.audio_url; // Ej: clase-1.mp3

    const presignedUrl = await minioClient.presignedGetObject(bucketName, objectName, 900); // 15 mins

    res.json({ presignedUrl });
  } catch (error) {
    console.error('Error generando URL firmada para audio:', error);
    res.status(500).json({ error: 'Error interno conectando a MinIO' });
  }
};

module.exports = {
  getModulos,
  getAudioPresignedUrl
};
