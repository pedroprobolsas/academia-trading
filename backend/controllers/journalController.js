const db = require('../config/db');
const { minioClientCapturas } = require('../config/minioClient');

// Obtener bitácora de operaciones (con filtros y paginación)
const getOperaciones = async (req, res) => {
  const usuarioId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const fecha = req.query.fecha; // formato YYYY-MM-DD
  const respeto_plan = req.query.respeto_plan; // 'true' o 'false'

  try {
    let queryParams = [usuarioId, limit, offset];
    let queryStr = `
      SELECT o.*, p.version as plan_version 
      FROM operaciones_journal o
      LEFT JOIN planes_trading p ON o.plan_id = p.id
      WHERE o.usuario_id = $1
    `;
    let paramIndex = 4;

    if (fecha) {
      queryStr += ` AND DATE(o.fecha_operacion) = $${paramIndex}`;
      queryParams.push(fecha);
      paramIndex++;
    }

    if (respeto_plan !== undefined) {
      queryStr += ` AND o.respeto_plan = $${paramIndex}`;
      queryParams.push(respeto_plan === 'true');
      paramIndex++;
    }

    queryStr += ` ORDER BY o.fecha_operacion DESC LIMIT $2 OFFSET $3`;

    const result = await db.query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo operaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Registrar nueva operación
const registrarOperacion = async (req, res) => {
  const usuarioId = req.user.id;
  const {
    fecha_operacion, instrumento, direccion, setup_usado, riesgo_porcentaje,
    precio_entrada, precio_salida, resultado_r_multiple, resultado_moneda,
    respeto_entrada, respeto_stop, respeto_take_profit, origen_senal,
    movio_stop, sobreoperacion, emocion_previa, emocion_durante,
    emocion_posterior, notas, captura_url
  } = req.body;

  try {
    // REGLA 4: Plan de trading obligatorio
    const planResult = await db.query(
      'SELECT * FROM planes_trading WHERE usuario_id = $1 AND activo = true',
      [usuarioId]
    );

    if (planResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'No tienes un plan de trading activo. Es obligatorio crear uno antes de registrar operaciones.' 
      });
    }

    const plan = planResult.rows[0];

    // REGLA 5 AMPLIADA: Cálculo estricto de respeto_plan
    // 1. Validaciones estructurales contra el plan
    const instrumentosPermitidos = plan.instrumentos_permitidos || [];
    const setupsAutorizados = plan.setups_autorizados || [];
    const respetaInstrumento = instrumentosPermitidos.includes(instrumento);
    const respetaSetup = setupsAutorizados.includes(setup_usado);
    const respetaRiesgo = Number(riesgo_porcentaje) <= Number(plan.riesgo_maximo_operacion);

    // 2. Validaciones de comportamiento (6 banderas)
    const comportamientoValido = 
      (respeto_entrada === true) && 
      (respeto_stop === true) && 
      (respeto_take_profit === true) && 
      (origen_senal === 'senal_plan') && 
      (movio_stop === false) && 
      (sobreoperacion === false);

    // 3. Resultado final
    const respeto_plan = respetaInstrumento && respetaSetup && respetaRiesgo && comportamientoValido;

    // Inserción de la operación
    const insertResult = await db.query(`
      INSERT INTO operaciones_journal (
        usuario_id, plan_id, fecha_operacion, instrumento, direccion, setup_usado,
        riesgo_porcentaje, precio_entrada, precio_salida, resultado_r_multiple,
        resultado_moneda, respeto_entrada, respeto_stop, respeto_take_profit,
        origen_senal, movio_stop, sobreoperacion, respeto_plan, emocion_previa,
        emocion_durante, emocion_posterior, notas, captura_object_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      ) RETURNING id, respeto_plan
    `, [
      usuarioId, plan.id, fecha_operacion || new Date(), instrumento, direccion,
      setup_usado, riesgo_porcentaje, precio_entrada, precio_salida, resultado_r_multiple,
      resultado_moneda, respeto_entrada, respeto_stop, respeto_take_profit, origen_senal,
      movio_stop, sobreoperacion, respeto_plan, emocion_previa || null, emocion_durante || null, emocion_posterior || null,
        notas || null, req.body.captura_object_name || null
    ]);

    res.status(201).json({ 
      message: 'Operación registrada exitosamente',
      operacion_id: insertResult.rows[0].id,
      respeto_plan_calculado: respeto_plan,
      detalles: { respetaInstrumento, respetaSetup, respetaRiesgo, comportamientoValido }
    });
  } catch (error) {
    console.error('Error registrando operación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Subir captura desde Backend a MinIO (Server-to-Server)
const subirCaptura = async (req, res) => {
  const usuarioId = req.user.id;
  const operacionId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No se envió ninguna imagen.' });
  }

  try {
    // Validar que la operación le pertenezca a este usuario (Aislamiento y Seguridad)
    const opResult = await db.query(
      'SELECT id FROM operaciones_journal WHERE id = $1 AND usuario_id = $2',
      [operacionId, usuarioId]
    );

    if (opResult.rows.length === 0) {
      return res.status(403).json({ error: 'La operación no existe o no te pertenece.' });
    }

    const bucketName = process.env.MINIO_BUCKET || 'academia-trading-capturas';
    const extension = file.originalname.split('.').pop();
    const objectName = `operacion_${operacionId}_${Date.now()}.${extension}`;
    
    // Subir a MinIO desde memoria (Server-to-Server)
    await minioClientCapturas.putObject(bucketName, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype
    });

    // Guardar el object_name en la BD
    await db.query('UPDATE operaciones_journal SET captura_object_name = $1 WHERE id = $2', [objectName, operacionId]);

    res.status(200).json({
      mensaje: 'Captura subida exitosamente',
      object_name: objectName
    });

  } catch (error) {
    console.error('Error subiendo captura a MinIO:', error);
    res.status(500).json({ error: 'Error interno conectando a MinIO' });
  }
};

// Generar URL firmada de MinIO para visualizar la captura
const obtenerUrlCaptura = async (req, res) => {
  const usuarioId = req.user.id;
  const operacionId = req.params.id;

  try {
    const opResult = await db.query(
      'SELECT captura_object_name FROM operaciones_journal WHERE id = $1 AND (usuario_id = $2 OR $3 = true)',
      [operacionId, usuarioId, req.user.rol === 'admin'] // Permitir al admin verla
    );

    if (opResult.rows.length === 0) {
      return res.status(403).json({ error: 'La operación no existe o no tienes permiso.' });
    }

    const objectName = opResult.rows[0].captura_object_name;
    if (!objectName) {
      return res.status(404).json({ error: 'La operación no tiene captura asignada.' });
    }

    const bucketName = process.env.MINIO_BUCKET || 'academia-trading-capturas';
    
    // Generar URL firmada para LECTURA (expira en 15 minutos = 900 segundos)
    const presignedUrl = await minioClientCapturas.presignedGetObject(bucketName, objectName, 900);

    res.json({
      presigned_url: presignedUrl,
      expires_in: 900
    });

  } catch (error) {
    console.error('Error generando URL de lectura:', error);
    res.status(500).json({ error: 'Error interno conectando a MinIO' });
  }
};

module.exports = {
  getOperaciones,
  registrarOperacion,
  subirCaptura,
  obtenerUrlCaptura
};
