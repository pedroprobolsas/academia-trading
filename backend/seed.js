const db = require('./config/db');

(async () => {
  try {
    console.log('--- Iniciando Seeding ---');
    
    // Limpiar tablas para prueba limpia (en cascada)
    await db.query('TRUNCATE modulos CASCADE');
    await db.query('TRUNCATE preguntas_quiz CASCADE');
    
    // 1. Insertar Módulos
    const m1 = await db.query(`
      INSERT INTO modulos (numero_orden, titulo, descripcion, nivel, contenido_url, contenido_tipo, duracion_estimada_min, activo) 
      VALUES (1, 'Módulo 1 de Prueba', 'Conceptos Básicos', 1, 'http://ejemplo.com/mod1', 'video', 30, true) 
      RETURNING id
    `);
    
    const m2 = await db.query(`
      INSERT INTO modulos (numero_orden, titulo, descripcion, nivel, contenido_url, contenido_tipo, duracion_estimada_min, activo) 
      VALUES (2, 'Módulo 2 de Prueba', 'Conceptos Intermedios', 2, 'http://ejemplo.com/mod2', 'documento', 45, true) 
      RETURNING id
    `);
    
    const mod1Id = m1.rows[0].id;
    const mod2Id = m2.rows[0].id;

    // 2. Insertar Preguntas para Módulo 1
    // Pregunta 1: Opción Múltiple
    await db.query(`
      INSERT INTO preguntas_quiz (modulo_id, enunciado, tipo, opciones, respuesta_correcta, explicacion, dificultad)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      mod1Id, 
      '¿Qué significa TP en trading?', 
      'opcion_multiple', 
      JSON.stringify(['Take Profit', 'Stop Loss', 'Break Even']), 
      JSON.stringify('Take Profit'), 
      'Toma de ganancias', 
      1
    ]);

    // Pregunta 2: Práctica Numérica
    await db.query(`
      INSERT INTO preguntas_quiz (modulo_id, enunciado, tipo, opciones, respuesta_correcta, explicacion, dificultad)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      mod1Id, 
      'Si entras en 1.500 y buscas un ratio 1:2 con riesgo 50, ¿Dónde va tu TP?', 
      'practica_numerica', 
      JSON.stringify([]), 
      JSON.stringify({ valor: 1.600, tolerancia: 0.005 }), 
      '1.500 + 100 = 1.600', 
      2
    ]);

    console.log('Seeding completado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error en seeding:', error);
    process.exit(1);
  }
})();
