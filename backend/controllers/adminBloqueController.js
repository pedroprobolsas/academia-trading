const db = require('../config/db');

// POST /admin/misiones/:mision_id/bloques
const crearBloque = async (req, res) => {
  const { mision_id } = req.params;
  const { tipo, titulo, descripcion, obligatorio, duracion_estimada_min, config } = req.body;

  try {
    const resCount = await db.query('SELECT COALESCE(MAX(numero_orden), 0) + 1 AS next_orden FROM bloques_contenido WHERE mision_id = $1', [mision_id]);
    const nextOrden = resCount.rows[0].next_orden;

    const result = await db.query(`
      INSERT INTO bloques_contenido (mision_id, numero_orden, tipo, titulo, descripcion, obligatorio, duracion_estimada_min, config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [mision_id, nextOrden, tipo || 'texto_markdown', titulo || 'Nuevo Bloque', descripcion || '', obligatorio ?? true, duracion_estimada_min || 0, config || {}]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando bloque:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /admin/bloques/:id
const actualizarBloque = async (req, res) => {
  const { id } = req.params;
  const { updated_at, ...camposUpdate } = req.body;

  try {
    await db.query('BEGIN');

    const currentRes = await db.query('SELECT updated_at, config FROM bloques_contenido WHERE id = $1 FOR UPDATE', [id]);
    if (currentRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }

    const current = currentRes.rows[0];

    // Control de concurrencia optimista
    if (updated_at && new Date(updated_at).getTime() < new Date(current.updated_at).getTime()) {
      await db.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflicto: El bloque fue modificado en otra sesión.', current_updated_at: current.updated_at });
    }

    let queryArgs = [];
    let setClauses = [];
    let argIndex = 1;

    const allowedFields = ['tipo', 'titulo', 'descripcion', 'obligatorio', 'duracion_estimada_min', 'config'];
    
    for (const [key, value] of Object.entries(camposUpdate)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${argIndex}`);
        if (key === 'config') {
           // Merge parcial de config JSONB
           const mergedConfig = { ...current.config, ...value };
           queryArgs.push(JSON.stringify(mergedConfig));
        } else {
           queryArgs.push(value);
        }
        argIndex++;
      }
    }

    if (setClauses.length === 0) {
       await db.query('ROLLBACK');
       return res.json({ message: 'Sin cambios' });
    }

    queryArgs.push(id);
    const result = await db.query(`UPDATE bloques_contenido SET ${setClauses.join(', ')} WHERE id = $${argIndex} RETURNING *`, queryArgs);

    await db.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error actualizando bloque:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /admin/bloques/:id
const eliminarBloque = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM bloques_contenido WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bloque no encontrado' });
    
    res.json({ message: 'Bloque eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando bloque:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /admin/misiones/:mision_id/bloques/orden
const reordenarBloques = async (req, res) => {
  const { mision_id } = req.params;
  const { ordenes } = req.body; // Array de { id, numero_orden }

  try {
    await db.query('BEGIN');
    
    // Evitar violar el constraint UNIQUE usando orden temporal negativo
    for (const item of ordenes) {
      await db.query('UPDATE bloques_contenido SET numero_orden = $1 WHERE id = $2 AND mision_id = $3', [-item.numero_orden, item.id, mision_id]);
    }

    for (const item of ordenes) {
      await db.query('UPDATE bloques_contenido SET numero_orden = $1 WHERE id = $2 AND mision_id = $3', [item.numero_orden, item.id, mision_id]);
    }

    await db.query('COMMIT');
    res.json({ message: 'Bloques reordenados correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error reordenando bloques:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearBloque,
  actualizarBloque,
  eliminarBloque,
  reordenarBloques
};
