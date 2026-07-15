const db = require('../config/db');

// POST /admin/modulos/:modulo_id/misiones
const crearMision = async (req, res) => {
  const { modulo_id } = req.params;
  const { titulo, objetivo, tipo, duracion_estimada_min, obligatoria, config } = req.body;

  try {
    // Calcular el siguiente numero_orden
    const resCount = await db.query('SELECT COALESCE(MAX(numero_orden), 0) + 1 AS next_orden FROM misiones WHERE modulo_id = $1', [modulo_id]);
    const nextOrden = resCount.rows[0].next_orden;

    const result = await db.query(`
      INSERT INTO misiones (modulo_id, numero_orden, titulo, objetivo, tipo, duracion_estimada_min, obligatoria, config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [modulo_id, nextOrden, titulo || 'Nueva Misión', objetivo || '', tipo || 'explicacion', duracion_estimada_min || 0, obligatoria ?? true, config || {}]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /admin/misiones/:id
const actualizarMision = async (req, res) => {
  const { id } = req.params;
  const { updated_at, ...camposUpdate } = req.body;

  try {
    await db.query('BEGIN');

    const currentRes = await db.query('SELECT updated_at, config FROM misiones WHERE id = $1 FOR UPDATE', [id]);
    if (currentRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Misión no encontrada' });
    }

    const current = currentRes.rows[0];

    // Control de concurrencia
    if (updated_at && new Date(updated_at).getTime() < new Date(current.updated_at).getTime()) {
      await db.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflicto: La misión fue modificada en otra sesión.', current_updated_at: current.updated_at });
    }

    let queryArgs = [];
    let setClauses = [];
    let argIndex = 1;

    const allowedFields = ['titulo', 'objetivo', 'tipo', 'duracion_estimada_min', 'obligatoria', 'criterio_desbloqueo', 'mensaje_finalizacion', 'gancho_siguiente', 'config'];
    
    for (const [key, value] of Object.entries(camposUpdate)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${argIndex}`);
        if (key === 'config') {
           // Merge config (partial merge)
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
    const result = await db.query(`UPDATE misiones SET ${setClauses.join(', ')} WHERE id = $${argIndex} RETURNING *`, queryArgs);

    await db.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error actualizando misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /admin/misiones/:id
const eliminarMision = async (req, res) => {
  const { id } = req.params;
  try {
    // Eliminar la misión (los bloques se eliminan por CASCADE)
    const result = await db.query('DELETE FROM misiones WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Misión no encontrada' });
    
    // Reordenar no lo hacemos automático aquí para evitar problemas en drag&drop, 
    // el frontend debería enviar PATCH /orden si quiere compactar, o podemos dejar huecos.
    res.json({ message: 'Misión eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando misión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /admin/modulos/:modulo_id/misiones/orden
const reordenarMisiones = async (req, res) => {
  const { modulo_id } = req.params;
  const { ordenes } = req.body; // Array de { id, numero_orden }

  try {
    await db.query('BEGIN');
    
    // Validar concurrencia básica o forzar reorden en bulk
    // Primero, para evitar violar el constraint UNIQUE(modulo_id, numero_orden),
    // ponemos números de orden temporales negativos.
    for (const item of ordenes) {
      await db.query('UPDATE misiones SET numero_orden = $1 WHERE id = $2 AND modulo_id = $3', [-item.numero_orden, item.id, modulo_id]);
    }

    // Luego ponemos los verdaderos
    for (const item of ordenes) {
      await db.query('UPDATE misiones SET numero_orden = $1 WHERE id = $2 AND modulo_id = $3', [item.numero_orden, item.id, modulo_id]);
    }

    await db.query('COMMIT');
    res.json({ message: 'Misiones reordenadas correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error reordenando misiones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearMision,
  actualizarMision,
  eliminarMision,
  reordenarMisiones
};
