const db = require('../config/db');

const CHECKPOINT_THRESHOLD = 70.0; // Umbral de aprobación (70%)

// Obtener preguntas de un módulo
const getPreguntas = async (req, res) => {
  const { id } = req.params; // ID del módulo

  try {
    // Retornamos todo excepto la respuesta correcta para que el frontend no pueda hacer trampa
    const result = await db.query(`
      SELECT id, enunciado, tipo, opciones, dificultad 
      FROM preguntas_quiz 
      WHERE modulo_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Enviar intento y calificar
const submitQuiz = async (req, res) => {
  const { id } = req.params; // ID del módulo
  const usuarioId = req.user.id;
  const { tipo, respuestas } = req.body; 
  // tipo: 'diagnostico_inicial', 'checkpoint_modulo', 'diagnostico_final'
  // respuestas: arreglo de objetos { pregunta_id, respuesta_dada }

  try {
    // 1. Obtener las preguntas y respuestas correctas de la base de datos
    const preguntasResult = await db.query(
      'SELECT id, tipo, respuesta_correcta FROM preguntas_quiz WHERE modulo_id = $1',
      [id]
    );
    const preguntasDB = preguntasResult.rows;

    if (preguntasDB.length === 0) {
      return res.status(400).json({ error: 'El módulo no tiene preguntas configuradas' });
    }

    let correctas = 0;
    
    // 2. Calificar cada respuesta
    for (const p of preguntasDB) {
      const respuestaUsuario = respuestas.find(r => r.pregunta_id === p.id);
      if (!respuestaUsuario) continue; // No respondida = incorrecta

      let esCorrecta = false;
      if (p.tipo === 'practica_numerica') {
        // Regla: abs(respuesta_dada - respuesta_correcta.valor) <= respuesta_correcta.tolerancia
        const diff = Math.abs(Number(respuestaUsuario.respuesta_dada) - Number(p.respuesta_correcta.valor));
        if (diff <= Number(p.respuesta_correcta.tolerancia)) {
          esCorrecta = true;
        }
      } else {
        // 'opcion_multiple', 'verdadero_falso', 'practica_seleccion'
        // Regla: igualdad estricta del valor esperado
        if (String(respuestaUsuario.respuesta_dada) === String(p.respuesta_correcta.valor || p.respuesta_correcta)) {
          esCorrecta = true;
        }
      }

      if (esCorrecta) correctas++;
    }

    const puntaje = (correctas / preguntasDB.length) * 100;
    let aprobado = false;
    
    // Umbrales
    if (tipo === 'checkpoint_modulo' && puntaje >= CHECKPOINT_THRESHOLD) aprobado = true;
    if (tipo === 'diagnostico_final' && puntaje >= 75.0) aprobado = true;
    if (tipo === 'diagnostico_inicial') aprobado = true; // El diagnóstico inicial no se 'reprueba'

    // 3. Registrar el intento en quiz_intentos
    await db.query(`
      INSERT INTO quiz_intentos (usuario_id, modulo_id, tipo, puntaje, aprobado, respuestas)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [usuarioId, id, tipo, puntaje, aprobado, JSON.stringify(respuestas)]);

    // 4. Actualizar progreso_modulos y desbloquear el siguiente si aprueba un checkpoint
    if (tipo === 'checkpoint_modulo') {
      // Upsert en progreso_modulos para el módulo actual
      await db.query(`
        INSERT INTO progreso_modulos (usuario_id, modulo_id, estado, intentos_quiz, fecha_completado)
        VALUES ($1, $2, $3, 1, $4)
        ON CONFLICT (usuario_id, modulo_id) 
        DO UPDATE SET 
          intentos_quiz = progreso_modulos.intentos_quiz + 1,
          estado = $3,
          fecha_completado = COALESCE(progreso_modulos.fecha_completado, $4)
      `, [usuarioId, id, aprobado ? 'completado' : 'en_progreso', aprobado ? new Date() : null]);

      // Si se aprueba, desbloquear el siguiente módulo (N+1)
      if (aprobado) {
        // Obtener el numero_orden del módulo actual
        const mod = await db.query('SELECT numero_orden FROM modulos WHERE id = $1', [id]);
        if (mod.rows.length > 0) {
          const ordenActual = mod.rows[0].numero_orden;
          
          // Buscar el ID del siguiente módulo
          const nextMod = await db.query('SELECT id FROM modulos WHERE numero_orden = $1', [ordenActual + 1]);
          if (nextMod.rows.length > 0) {
            const nextModuloId = nextMod.rows[0].id;
            
            // Insertar o actualizar a 'disponible' si estaba bloqueado
            await db.query(`
              INSERT INTO progreso_modulos (usuario_id, modulo_id, estado)
              VALUES ($1, $2, 'disponible')
              ON CONFLICT (usuario_id, modulo_id) DO NOTHING
            `, [usuarioId, nextModuloId]);
          }
        }
      }
    }

    res.json({
      puntaje: puntaje.toFixed(2),
      aprobado,
      correctas,
      total: preguntasDB.length,
      mensaje: aprobado ? '¡Felicidades, has aprobado!' : 'No has alcanzado el puntaje mínimo requerido.'
    });

  } catch (error) {
    console.error('Error calificando quiz:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getPreguntas,
  submitQuiz
};
