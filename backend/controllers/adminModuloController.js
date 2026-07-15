const db = require('../config/db');
const { minioClientMedia } = require('../config/minioClient');

const validateUrl = (url, type) => {
  if (!url) return true; // Nullable
  
  if (type === 'minio') {
    const audioRegex = /^[a-zA-Z0-9_\-]+\.(mp3|wav|ogg)$/;
    return audioRegex.test(url);
  }

  try {
    const parsed = new URL(url);
    if (type === 'youtube' && !(parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be'))) {
      return false;
    }
    if (type === 'drive' && !parsed.hostname.includes('drive.google.com')) {
      return false;
    }
    return true;
  } catch (e) {
    return false; // Invalid URL format
  }
};

const crearModulo = async (req, res) => {
  const { numero_orden, titulo, descripcion, nivel, youtube_url, drive_url, audio_url, contenido_texto, formato_principal, duracion_estimada_min } = req.body;

  if (!validateUrl(youtube_url, 'youtube')) return res.status(400).json({ error: 'URL de YouTube inválida.' });
  if (!validateUrl(drive_url, 'drive')) return res.status(400).json({ error: 'URL de Google Drive inválida.' });
  if (!validateUrl(audio_url, 'minio')) return res.status(400).json({ error: 'URL de Audio (MinIO) inválida.' });

  if (contenido_texto && Array.from(contenido_texto).length > 50000) {
    return res.status(400).json({ error: 'El contenido de texto no puede exceder los 50,000 caracteres.' });
  }

  try {
    const result = await db.query(`
      INSERT INTO modulos (
        numero_orden, titulo, descripcion, nivel, 
        youtube_url, drive_url, audio_url, contenido_texto, formato_principal, 
        duracion_estimada_min, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *
    `, [numero_orden, titulo, descripcion, nivel, youtube_url, drive_url, audio_url, contenido_texto, formato_principal, duracion_estimada_min]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando módulo:', error);
    if (error.constraint === 'modulos_numero_orden_key') {
      return res.status(400).json({ error: 'Ya existe un módulo con ese número de orden.' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const actualizarModulo = async (req, res) => {
  const { id } = req.params;
  const { numero_orden, titulo, descripcion, nivel, youtube_url, drive_url, audio_url, contenido_texto, formato_principal, duracion_estimada_min, activo } = req.body;

  if (!validateUrl(youtube_url, 'youtube')) return res.status(400).json({ error: 'URL de YouTube inválida.' });
  if (!validateUrl(drive_url, 'drive')) return res.status(400).json({ error: 'URL de Google Drive inválida.' });
  if (!validateUrl(audio_url, 'minio')) return res.status(400).json({ error: 'URL de Audio (MinIO) inválida.' });

  if (contenido_texto && Array.from(contenido_texto).length > 50000) {
    return res.status(400).json({ error: 'El contenido de texto no puede exceder los 50,000 caracteres.' });
  }

  try {
    const result = await db.query(`
      UPDATE modulos SET 
        numero_orden = $1, titulo = $2, descripcion = $3, nivel = $4,
        youtube_url = $5, drive_url = $6, audio_url = $7, contenido_texto = $8,
        formato_principal = $9, duracion_estimada_min = $10, activo = $11, updated_at = now()
      WHERE id = $12
      RETURNING *
    `, [numero_orden, titulo, descripcion, nivel, youtube_url, drive_url, audio_url, contenido_texto, formato_principal, duracion_estimada_min, activo, id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Módulo no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando módulo:', error);
    if (error.constraint === 'modulos_numero_orden_key') {
      return res.status(400).json({ error: 'Ya existe un módulo con ese número de orden.' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const desactivarModulo = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body; // true o false
  try {
    const result = await db.query(`
      UPDATE modulos SET activo = $1, updated_at = now() WHERE id = $2 RETURNING *
    `, [activo, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Módulo no encontrado' });
    res.json({ message: `Módulo ${activo ? 'activado' : 'desactivado'} correctamente`, modulo: result.rows[0] });
  } catch (error) {
    console.error('Error desactivando módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos para el admin (incluyendo inactivos)
const getAdminModulos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM modulos ORDER BY numero_orden ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo módulos admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const uploadImagenModulo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    const file = req.file;

    // Generar un nombre único para la imagen
    const objectName = `modulo-${Date.now()}-${file.originalname}`;
    const bucketName = process.env.MINIO_BUCKET_IMAGENES || 'academia-trading-imagenes-modulos';

    // Subir a MinIO
    await minioClientMedia.putObject(bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype
    });

    // Devolver la URL del proxy interno (no la de MinIO directamente)
    const proxyUrl = `/api/modulos/imagenes/${objectName}`;
    res.json({ url: proxyUrl });
  } catch (error) {
    console.error('Error subiendo imagen a MinIO:', error);
    res.status(500).json({ error: 'Error interno conectando a MinIO' });
  }
};

module.exports = {
  crearModulo,
  actualizarModulo,
  desactivarModulo,
  getAdminModulos,
  uploadImagenModulo
};
