const db = require('../config/db');

// --- Helpers para Concurrencia y JSONB ---
// Realiza un deep merge simple para JSONB (un solo nivel para metadata)
const mergeMetadata = (oldMeta = {}, newMeta = {}) => {
  return { ...oldMeta, ...newMeta };
};

// --- Módulos ---

// POST /admin/modulos
const crearModuloBorrador = async (req, res) => {
  // Crea un módulo vacío en estado borrador, autogenerando un numero_orden temporal al final
  try {
    const resCount = await db.query('SELECT COALESCE(MAX(numero_orden), 0) + 1 AS next_orden FROM modulos');
    const nextOrden = resCount.rows[0].next_orden;

    const result = await db.query(`
      INSERT INTO modulos (numero_orden, titulo, estado, nivel) 
      VALUES ($1, $2, 'borrador', 1)
      RETURNING *
    `, [nextOrden, 'Nuevo Módulo (Borrador)']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando borrador de módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /admin/modulos/:id
const getModuloDetalle = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM modulos WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Módulo no encontrado' });
    
    const modulo = result.rows[0];

    // Obtener misiones
    const misionesRes = await db.query(`SELECT * FROM misiones WHERE modulo_id = $1 ORDER BY numero_orden ASC`, [id]);
    const misiones = misionesRes.rows;

    // Obtener bloques de las misiones
    if (misiones.length > 0) {
      const misionIds = misiones.map(m => m.id);
      const bloquesRes = await db.query(`SELECT * FROM bloques_contenido WHERE mision_id = ANY($1) ORDER BY numero_orden ASC`, [misionIds]);
      const bloques = bloquesRes.rows;

      // Agrupar
      misiones.forEach(m => {
        m.bloques = bloques.filter(b => b.mision_id === m.id);
      });
    }
    
    modulo.misiones = misiones;
    res.json(modulo);
  } catch (error) {
    console.error('Error obteniendo detalle de módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /admin/modulos/:id
const actualizarModuloParcial = async (req, res) => {
  const { id } = req.params;
  const { updated_at, metadata: newMetadata, ...camposUpdate } = req.body;

  try {
    await db.query('BEGIN');

    // 1. Obtener registro actual y validar concurrencia
    const currentRes = await db.query('SELECT updated_at, metadata FROM modulos WHERE id = $1 FOR UPDATE', [id]);
    if (currentRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    const current = currentRes.rows[0];
    
    // Concurrencia Optimista (Si el cliente mandó updated_at y no coincide con el de la BD)
    if (updated_at && new Date(updated_at).getTime() < new Date(current.updated_at).getTime()) {
      await db.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflicto: El módulo fue modificado por otra sesión.', current_updated_at: current.updated_at });
    }

    // 2. Fusionar metadata
    const mergedMetadata = mergeMetadata(current.metadata, newMetadata);

    // 3. Construir query dinámico para los campos directos
    let queryArgs = [];
    let setClauses = [];
    let argIndex = 1;

    for (const [key, value] of Object.entries(camposUpdate)) {
      // Evitar que inyecten campos no permitidos
      const allowedFields = ['numero_orden', 'nivel', 'titulo', 'subtitulo', 'descripcion_corta', 'duracion_estimada', 'imagen_portada_object_name'];
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${argIndex}`);
        queryArgs.push(value);
        argIndex++;
      }
    }

    // Siempre actualizar metadata
    setClauses.push(`metadata = $${argIndex}`);
    queryArgs.push(JSON.stringify(mergedMetadata));
    argIndex++;

    // Siempre actualizar updated_at (por si el trigger falla o para forzar)
    // El trigger se encarga, pero para asegurar:
    // La BD actualizará via trigger set_modulos_updated_at

    queryArgs.push(id);
    const updateQuery = `
      UPDATE modulos 
      SET ${setClauses.join(', ')} 
      WHERE id = $${argIndex} 
      RETURNING *
    `;

    const result = await db.query(updateQuery, queryArgs);
    await db.query('COMMIT');
    res.json(result.rows[0]);

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error actualizando módulo parcialmente:', error);
    if (error.constraint === 'modulos_numero_orden_key') {
      return res.status(400).json({ error: 'Ya existe un módulo con ese número de orden.' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /admin/modulos/:id/publicar
const publicarModulo = async (req, res) => {
  const { id } = req.params;
  try {
    // Validaciones mínimas: Tiene al menos 1 misión y 1 bloque?
    const misiones = await db.query('SELECT id FROM misiones WHERE modulo_id = $1', [id]);
    if (misiones.rows.length === 0) return res.status(400).json({ error: 'No se puede publicar un módulo sin misiones.' });

    const result = await db.query(`
      UPDATE modulos 
      SET estado = 'publicado', publicado_at = now() 
      WHERE id = $1 AND estado = 'borrador'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) return res.status(400).json({ error: 'El módulo no existe o no está en estado borrador.' });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error publicando módulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /admin/modulos/:id/nueva_version
const crearNuevaVersion = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('BEGIN');

    // 1. Obtener módulo a clonar
    const oldModRes = await db.query('SELECT * FROM modulos WHERE id = $1 AND estado = $2', [id, 'publicado']);
    if (oldModRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Solo se puede crear una versión de un módulo publicado.' });
    }
    const oldMod = oldModRes.rows[0];
    const raizId = oldMod.modulo_raiz_id || oldMod.id; // Si ya era versión, hereda la raíz original

    // 2. Crear nuevo módulo como borrador, incrementando version
    const insertMod = await db.query(`
      INSERT INTO modulos (numero_orden, titulo, subtitulo, descripcion_corta, nivel, duracion_estimada_min, estado, imagen_portada_object_name, version, modulo_raiz_id, version_anterior_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, 'borrador', $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      oldMod.numero_orden, oldMod.titulo, oldMod.subtitulo, oldMod.descripcion_corta, oldMod.nivel, oldMod.duracion_estimada_min,
      oldMod.imagen_portada_object_name, oldMod.version + 1, raizId, oldMod.id, oldMod.metadata
    ]);
    const newMod = insertMod.rows[0];

    // 3. Clonar misiones y bloques
    const misionesRes = await db.query('SELECT * FROM misiones WHERE modulo_id = $1', [oldMod.id]);
    for (const mision of misionesRes.rows) {
      const insertMision = await db.query(`
        INSERT INTO misiones (modulo_id, numero_orden, titulo, objetivo, tipo, duracion_estimada_min, obligatoria, criterio_desbloqueo, mensaje_finalizacion, gancho_siguiente, config)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [newMod.id, mision.numero_orden, mision.titulo, mision.objetivo, mision.tipo, mision.duracion_estimada_min, mision.obligatoria, mision.criterio_desbloqueo, mision.mensaje_finalizacion, mision.gancho_siguiente, mision.config]);
      
      const newMisionId = insertMision.rows[0].id;
      const bloquesRes = await db.query('SELECT * FROM bloques_contenido WHERE mision_id = $1', [mision.id]);
      
      for (const bloque of bloquesRes.rows) {
        await db.query(`
          INSERT INTO bloques_contenido (mision_id, numero_orden, tipo, titulo, descripcion, obligatorio, duracion_estimada_min, config)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [newMisionId, bloque.numero_orden, bloque.tipo, bloque.titulo, bloque.descripcion, bloque.obligatorio, bloque.duracion_estimada_min, bloque.config]);
      }
    }

    await db.query('COMMIT');
    res.status(201).json(newMod);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error clonando versión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /admin/modulos
const getAdminModulos = async (req, res) => {
  try {
    const result = await db.query('SELECT id, numero_orden, titulo, nivel, estado, version, publicado_at FROM modulos ORDER BY numero_orden ASC, version DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo módulos admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// (Mantener la función de minio si la usan)
const { minioClientMedia } = require('../config/minioClient');
const uploadImagenModulo = async (req, res) => {
    // Código sin cambios para imágenes...
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });
        const file = req.file;
        const objectName = `modulo-${Date.now()}-${file.originalname}`;
        const bucketName = process.env.MINIO_BUCKET_IMAGENES || 'academia-trading-imagenes-modulos';
        await minioClientMedia.putObject(bucketName, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });
        const proxyUrl = `/api/modulos/imagenes/${objectName}`;
        res.json({ url: proxyUrl, objectName });
      } catch (error) {
        res.status(500).json({ error: 'Error interno conectando a MinIO' });
      }
};

const uploadMediaModulo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
        const file = req.file;
        const objectName = `media-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        // Enviar PDFs y Audios al bucket de audios (usarlo como genérico de media del módulo)
        const bucketName = process.env.MINIO_BUCKET_AUDIOS || 'academia-trading-audios';
        await minioClientMedia.putObject(bucketName, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });
        
        // La URL directa asume que la política pública está aplicada
        const url = `https://${process.env.MINIO_ENDPOINT || 'ippminioback.probolsas.co'}/${bucketName}/${objectName}`;
        res.json({ url, objectName });
    } catch (error) {
        console.error('Error subiendo media:', error);
        res.status(500).json({ error: 'Error interno conectando a MinIO' });
    }
};

module.exports = {
  crearModuloBorrador,
  getModuloDetalle,
  actualizarModuloParcial,
  publicarModulo,
  crearNuevaVersion,
  getAdminModulos,
  uploadImagenModulo,
  uploadMediaModulo
};
