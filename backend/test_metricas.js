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
    await db.query("DELETE FROM usuarios WHERE email IN ('alumno_metricas@example.com', 'admin_metricas@example.com')");

    console.log('\n--- 1. Registro de Alumno y Admin ---');
    await request('POST', '/auth/registro', { email: "alumno_metricas@example.com", password: "123", nombre_completo: "Alumno Metricas" });
    await request('POST', '/auth/registro', { email: "admin_metricas@example.com", password: "123", nombre_completo: "Admin Metricas" });
    
    // Promover admin a nivel BD
    await db.query("UPDATE usuarios SET rol = 'admin' WHERE email = 'admin_metricas@example.com'");

    const loginAl = await request('POST', '/auth/login', { email: "alumno_metricas@example.com", password: "123" });
    const loginAd = await request('POST', '/auth/login', { email: "admin_metricas@example.com", password: "123" });
    const tokenAl = loginAl.body.token;
    const tokenAd = loginAd.body.token;
    const usuarioAlId = loginAl.body.user.id;

    console.log('\n--- 2. Crear Plan de Trading ---');
    await request('POST', '/planes-trading', { instrumentos_permitidos: ["Vol75", "Vol100"], setups_autorizados: ["bmsb"], riesgo_maximo_operacion: 1.0 }, tokenAl);

    console.log('\n--- 3. Sembrar Operaciones en Dos Semanas ---');
    // Para testear racha continua: Semana 1 (Domingo 5 de Julio 2026), Semana 2 (Lunes 6 de Julio 2026)
    const ops = [
      // Semana 1: Domingo. 2 pérdidas. Racha = 2
      { fecha: '2026-07-05T10:00:00Z', inst: "Vol100", r: -1.0, resp_stop: false }, // No respetado -> resp_plan = false
      { fecha: '2026-07-05T11:00:00Z', inst: "Vol75",  r: -1.0, resp_stop: true },  // Respetado -> resp_plan = true
      // Semana 2: Lunes. 2 pérdidas, 1 ganancia, 1 pérdida.
      { fecha: '2026-07-06T10:00:00Z', inst: "Vol75",  r: -1.0, resp_stop: true },  // Respetado. Racha sube a 3
      { fecha: '2026-07-06T11:00:00Z', inst: "Vol100", r: -1.0, resp_stop: false }, // No resp. Racha sube a 4
      { fecha: '2026-07-06T12:00:00Z', inst: "Vol75",  r: 1.0,  resp_stop: true },  // Respetado. Racha baja a 0
      { fecha: '2026-07-06T13:00:00Z', inst: "Vol75",  r: -1.0, resp_stop: true }   // Respetado. Racha sube a 1
    ];

    for (const op of ops) {
      // Inyectamos directo por SQL porque el endpoint POST /operaciones usa Date.now() y queremos fechas pasadas exactas.
      // Primero insertamos la operacion para que el backend calcule el respeto, 
      // y luego modificaremos la fecha por SQL.
      const opRes = await request('POST', '/operaciones', {
        fecha_operacion: new Date(), instrumento: op.inst, direccion: "compra",
        setup_usado: "bmsb", riesgo_porcentaje: 1.0, respeto_entrada: true,
        respeto_stop: op.resp_stop, respeto_take_profit: true, origen_senal: "senal_plan",
        movio_stop: false, sobreoperacion: false, resultado_r_multiple: op.r // (Aunque el controller MVP no lo pida todavía en body, lo forzamos abajo)
      }, tokenAl);
      
      const opId = opRes.body.operacion_id;
      // Ajuste de BD para el Test: Fecha y resultado_r_multiple
      await db.query(`UPDATE operaciones_journal SET fecha_operacion = $1, resultado_r_multiple = $2 WHERE id = $3`, [op.fecha, op.r, opId]);
    }
    console.log("6 operaciones sembradas y ajustadas cronológicamente.");

    console.log('\n--- 4. POST /refresh (Como Admin) ---');
    const failRefresh = await request('POST', '/metricas/refresh', {}, tokenAl);
    console.log(`Intento de Alumno: Status ${failRefresh.status} -> ${failRefresh.body.error}`);
    const okRefresh = await request('POST', '/metricas/refresh', {}, tokenAd);
    console.log(`Intento de Admin: Status ${okRefresh.status} -> ${okRefresh.body.message}`);

    console.log('\n--- 5. GET /mi-dashboard (Calculos vs API) ---');
    const dashboard = await request('GET', '/metricas/mi-dashboard', null, tokenAl);
    const mGlobal = dashboard.body.metricas_globales;
    const mSemanal = dashboard.body.consistencia_semanal;
    console.log("Win Rate (Esperado 16.67%):", mGlobal.win_rate, "%");
    console.log("Adherencia (Esperado 66.67%):", mGlobal.pct_adherencia_plan, "%");
    console.log("R Múltiple Prom (Esperado -0.67):", mGlobal.r_multiple_promedio);
    console.log("\nDesglose Semanal de Rachas Continuas:");
    mSemanal.forEach(s => console.log(`Semana ${s.semana_inicio.split('T')[0]}: Racha Max = ${s.racha_perdidas_maxima}`));
    
    // Verificamos matemáticamente la semana 2 (debe ser 4)
    const sem2 = mSemanal.find(s => s.semana_inicio.startsWith('2026-07-06'));
    if (sem2 && sem2.racha_perdidas_maxima === 4) {
      console.log("¡ÉXITO MATEMÁTICO! La racha cruzó el umbral del domingo al lunes y acumuló 4.");
    } else {
      console.log("FALLO: La racha en la semana 2 no es 4.");
    }

    console.log('\n--- 6. POST /solicitar (Certificación Fallida) ---');
    const cert = await request('POST', '/certificaciones/solicitar', {}, tokenAl);
    console.log(`Status: ${cert.status} -> ${cert.body.message}`);
    console.log("Criterios JSON Guardados:", cert.body.certificacion.criterios_cumplidos);

    console.log('\n--- 7. GET /admin/candidatos (Panel Admin) ---');
    // Forzar otra solicitud rechazada para ver si DISTINCT funciona
    await request('POST', '/certificaciones/solicitar', {}, tokenAl); 
    // Ahora le forzamos una en estado "pendiente" para que aparezca en el panel
    await db.query("UPDATE certificaciones SET estado = 'pendiente' WHERE usuario_id = $1", [usuarioAlId]);
    
    const adminPanel = await request('GET', '/certificaciones/admin/candidatos', null, tokenAd);
    console.log(`Candidatos Pendientes Encontrados: ${adminPanel.body.length}`);
    if (adminPanel.body.length === 1) {
      console.log("¡ÉXITO SQL! El DISTINCT ON filtró correctamente a 1 solo registro (el más reciente) por alumno.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error en pruebas de metricas:", err);
    process.exit(1);
  }
})();
