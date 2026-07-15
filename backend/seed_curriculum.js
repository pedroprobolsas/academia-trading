const db = require('./config/db');

const modulos = [
  [1, 'Fundamentos de los Índices Sintéticos', 'Qué son, quién los crea y por qué se mueven distinto a los mercados reales.', 1, 'https://example.com/mod1', 'documento', 20, true],
  [2, 'La Plataforma y Tipos de Órdenes', 'Cómo operar en la plataforma: órdenes de mercado, límite, y stop.', 1, 'https://example.com/mod2', 'documento', 15, true],
  [3, 'Lectura de Velas Japonesas', 'Interpretar la acción del precio vela por vela.', 2, 'https://example.com/mod3', 'documento', 25, true],
  [4, 'Soportes, Resistencias y Tendencias', 'Identificar zonas clave y la dirección estructural del mercado.', 1, 'https://example.com/mod4', 'documento', 25, true],
  [5, 'Gestión del Riesgo y Tamaño de Posición', 'Cómo calcular riesgo, recompensa y tamaño de posición correctamente.', 1, 'https://example.com/mod5', 'documento', 20, true],
  [6, 'Acción del Precio', 'Leer el mercado sin depender de indicadores.', 2, 'https://example.com/mod6', 'documento', 20, true],
  [7, 'Medias Móviles y Estrategia BMSB', 'SMA 20, EMA 21 y la Bull Market Support Band aplicada a índices sintéticos.', 3, 'https://example.com/mod7', 'documento', 30, true],
  [8, 'Psicología del Trading', 'El operador como la variable más importante del sistema.', 2, 'https://example.com/mod8', 'documento', 20, true],
  [9, 'Construcción de tu Plan de Trading', 'De la teoría a tu propio documento operativo, versionado en la app.', 3, 'https://example.com/mod9', 'documento', 25, true],
  [10, 'Operativa en Demo con Ejemplos Reales', 'Casos reales, journal en vivo, y primeras certificaciones.', 4, 'https://example.com/mod10', 'documento', 30, true]
];

const preguntas = [
  // Modulo 1
  {
    moduloOrden: 1,
    enunciado: "¿Qué genera el movimiento de precio en un índice sintético?",
    tipo: "opcion_multiple",
    opciones: [
      {"id": "a", "texto": "Compradores y vendedores reales"},
      {"id": "b", "texto": "Un algoritmo certificado que sigue una fórmula matemática"},
      {"id": "c", "texto": "El precio del activo subyacente real"},
      {"id": "d", "texto": "El banco central del país del bróker"}
    ],
    respuesta_correcta: "b",
    explicacion: "Los índices sintéticos son generados por un algoritmo del bróker, no por oferta y demanda real.",
    dificultad: 1
  },
  {
    moduloOrden: 1,
    enunciado: "¿Verdadero o falso? El análisis técnico (soportes, resistencias, medias móviles) no sirve en índices sintéticos porque el precio es artificial.",
    tipo: "verdadero_falso",
    opciones: [{"id": "v", "texto": "Verdadero"}, {"id": "f", "texto": "Falso"}],
    respuesta_correcta: "f",
    explicacion: "Sí funciona, porque el algoritmo genera patrones repetitivos que el análisis técnico puede identificar.",
    dificultad: 2
  },
  {
    moduloOrden: 1,
    enunciado: "¿Cuál de estos índices se caracteriza por subir lento y luego dar un salto alcista brusco?",
    tipo: "opcion_multiple",
    opciones: [
      {"id": "a", "texto": "Crash 500"},
      {"id": "b", "texto": "Step Index"},
      {"id": "c", "texto": "Boom 500"},
      {"id": "d", "texto": "Volatility 10"}
    ],
    respuesta_correcta: "c",
    explicacion: "Boom sube lentamente y luego produce una explosión alcista repentina — de ahí su nombre.",
    dificultad: 1
  },
  // Modulo 4
  {
    moduloOrden: 4,
    enunciado: "En el escenario de Volatility 75 que trabajamos (techo en 952, corrección hasta 903), ¿qué confirma que la tendencia alcista sigue intacta?",
    tipo: "opcion_multiple",
    opciones: [
      {"id": "a", "texto": "Que el precio suba rápido"},
      {"id": "b", "texto": "Que el último mínimo (901-902) no se rompa"},
      {"id": "c", "texto": "Que el volumen aumente"},
      {"id": "d", "texto": "Que pasen 24 horas sin operar"}
    ],
    respuesta_correcta: "b",
    explicacion: "Mientras el último mínimo estructural no se rompa, la secuencia de máximos y mínimos crecientes (tendencia alcista) sigue válida.",
    dificultad: 2
  },
  // Modulo 5
  {
    moduloOrden: 5,
    enunciado: "Entrada = 500, Stop = 480, Objetivo = 560. ¿Cuál es el Ratio Riesgo:Beneficio?",
    tipo: "practica_numerica",
    opciones: null,
    respuesta_correcta: {"valor": 3.0, "tolerancia": 0.1},
    explicacion: "Riesgo = 20, Recompensa = 60, R:R = 60/20 = 3.0",
    dificultad: 2
  },
  {
    moduloOrden: 5,
    enunciado: "Con Riesgo = 20 y Recompensa = 60, ¿cuál es el winrate de equilibrio (breakeven), en porcentaje?",
    tipo: "practica_numerica",
    opciones: null,
    respuesta_correcta: {"valor": 25.0, "tolerancia": 1.0},
    explicacion: "Winrate de equilibrio = Riesgo / (Riesgo + Recompensa) = 20/80 = 25%",
    dificultad: 3
  },
  // Modulo 7
  {
    moduloOrden: 7,
    enunciado: "¿Qué dos medias móviles componen la Bull Market Support Band (BMSB)?",
    tipo: "opcion_multiple",
    opciones: [
      {"id": "a", "texto": "SMA 20 y EMA 21"},
      {"id": "b", "texto": "EMA 50 y EMA 200"},
      {"id": "c", "texto": "SMA 9 y SMA 21"},
      {"id": "d", "texto": "RSI 14 y MACD"}
    ],
    respuesta_correcta: "a",
    explicacion: "La BMSB usa una media móvil simple de 20 períodos y una exponencial de 21 períodos.",
    dificultad: 2
  },
  // Modulo 8
  {
    moduloOrden: 8,
    enunciado: "Según lo trabajado en tu propio diagnóstico, ¿cuál es un error común en traders con buena disciplina de stop pero mala gestión de salida?",
    tipo: "opcion_multiple",
    opciones: [
      {"id": "a", "texto": "Poner el stop demasiado lejos"},
      {"id": "b", "texto": "Cortar la ganancia antes de tiempo, dando un R:R pobre"},
      {"id": "c", "texto": "Operar de noche"},
      {"id": "d", "texto": "Usar Volatility 100 en vez de Volatility 10"}
    ],
    respuesta_correcta: "b",
    explicacion: "Es el patrón identificado en tu propio primer diagnóstico: buen stop, pero take profit demasiado conservador.",
    dificultad: 2
  }
];

(async () => {
  try {
    await db.query('BEGIN');
    
    // 1. Limpiar viejo curriculum si hay
    await db.query('DELETE FROM preguntas_quiz');
    await db.query('DELETE FROM progreso_modulos');
    await db.query('DELETE FROM modulos');

    console.log('Sembrando modulos...');
    for (const m of modulos) {
      await db.query(
        'INSERT INTO modulos (numero_orden, titulo, descripcion, nivel, contenido_url, contenido_tipo, duracion_estimada_min, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        m
      );
    }

    console.log('Sembrando preguntas...');
    for (const p of preguntas) {
      const res = await db.query('SELECT id FROM modulos WHERE numero_orden = $1', [p.moduloOrden]);
      if (res.rows.length > 0) {
        const moduloId = res.rows[0].id;
        await db.query(
          'INSERT INTO preguntas_quiz (modulo_id, enunciado, tipo, opciones, respuesta_correcta, explicacion, dificultad) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [moduloId, p.enunciado, p.tipo, JSON.stringify(p.opciones), JSON.stringify(p.respuesta_correcta), p.explicacion, p.dificultad]
        );
      }
    }

    await db.query('COMMIT');
    console.log('Currículum sembrado exitosamente.');
    process.exit(0);
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('Error sembrando:', e);
    process.exit(1);
  }
})();
