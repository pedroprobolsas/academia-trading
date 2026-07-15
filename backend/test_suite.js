const http = require('http');
const db = require('./config/db');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

(async () => {
  try {
    console.log('--- Limpieza Previa ---');
    await db.query("DELETE FROM usuarios WHERE email = 'test_fase4@example.com'");

    console.log('\n--- 1. Registro y Login (Test Usuario Fase 4) ---');
    await request('POST', '/auth/registro', {
      email: "test_fase4@example.com", password: "123", nombre_completo: "Test Fase 4"
    });
    const loginRes = await request('POST', '/auth/login', {
      email: "test_fase4@example.com", password: "123"
    });
    const token = loginRes.body.token;
    const usuarioId = loginRes.body.user.id;
    console.log(`Token obtenido para usuario: ${usuarioId}`);

    console.log('\n--- 2. Intento de Operación SIN Plan (REGLA 4: Debe Bloquear) ---');
    const failOp = await request('POST', '/operaciones', {
      fecha_operacion: new Date(), instrumento: "Vol75", direccion: "compra",
      setup_usado: "bmsb", riesgo_porcentaje: 1.0, respeto_entrada: true,
      respeto_stop: true, respeto_take_profit: true, origen_senal: "senal_plan",
      movio_stop: false, sobreoperacion: false
    }, token);
    console.log(`Status: ${failOp.status} -> ${failOp.body.error}`);

    console.log('\n--- 3. Crear Plan de Trading v1 ---');
    const plan1Res = await request('POST', '/planes-trading', {
      instrumentos_permitidos: ["Vol75", "Vol100"],
      riesgo_maximo_operacion: 2.0,
      setups_autorizados: ["bmsb", "accion_precio"],
      regla_stop_diario: 5.0,
      condiciones_no_operar: "No operar viernes"
    }, token);
    console.log(`Plan Creado, Version: ${plan1Res.body.plan.version}, Activo: ${plan1Res.body.plan.activo}`);

    console.log('\n--- 4. Crear Plan de Trading v2 (Test Versionado) ---');
    const plan2Res = await request('POST', '/planes-trading', {
      instrumentos_permitidos: ["Vol75"],
      riesgo_maximo_operacion: 1.0,
      setups_autorizados: ["bmsb"],
      regla_stop_diario: 3.0,
      condiciones_no_operar: "No operar cansado"
    }, token);
    console.log(`Plan Creado, Version: ${plan2Res.body.plan.version}, Activo: ${plan2Res.body.plan.activo}`);

    console.log('\n--- 5. Verificación SQL: Versionado de Planes ---');
    const planesDb = await db.query('SELECT version, activo FROM planes_trading WHERE usuario_id = $1 ORDER BY version', [usuarioId]);
    planesDb.rows.forEach(p => console.log(`Versión ${p.version} -> Activo: ${p.activo}`));

    console.log('\n--- 6. Intento de Operación PERFECTA (REGLA 5: Debe ser respeto_plan = true) ---');
    const okOp = await request('POST', '/operaciones', {
      fecha_operacion: new Date(), instrumento: "Vol75", direccion: "compra",
      setup_usado: "bmsb", riesgo_porcentaje: 1.0, respeto_entrada: true,
      respeto_stop: true, respeto_take_profit: true, origen_senal: "senal_plan",
      movio_stop: false, sobreoperacion: false
    }, token);
    console.log(`Status: ${okOp.status} -> Respeto Calculado: ${okOp.body.respeto_plan_calculado}`);
    console.log(`Detalles:`, okOp.body.detalles);

    console.log('\n--- 7. Intento de Operación IMPERFECTA (Falla estructural: Instrumento no permitido) ---');
    // El plan 2 solo permite Vol75 y riesgo 1.0. Si mandamos Vol100, debe fallar el respeto.
    const badOp = await request('POST', '/operaciones', {
      fecha_operacion: new Date(), instrumento: "Vol100", direccion: "venta",
      setup_usado: "bmsb", riesgo_porcentaje: 0.5, respeto_entrada: true,
      respeto_stop: true, respeto_take_profit: true, origen_senal: "senal_plan",
      movio_stop: false, sobreoperacion: false
    }, token);
    console.log(`Status: ${badOp.status} -> Respeto Calculado: ${badOp.body.respeto_plan_calculado}`);
    console.log(`Detalles:`, badOp.body.detalles);

    console.log('\n--- 8. GET Operaciones (Filtro respeto_plan = false) ---');
    const filterOp = await request('GET', '/operaciones?respeto_plan=false', null, token);
    console.log(`Encontradas: ${filterOp.body.length}`);
    filterOp.body.forEach(o => console.log(`Operación ID: ${o.id}, Instrumento: ${o.instrumento}, Respeto Plan: ${o.respeto_plan}, Plan Version (Join): ${o.plan_version}`));

    process.exit(0);
  } catch (err) {
    console.error("Error en pruebas:", err);
    process.exit(1);
  }
})();
