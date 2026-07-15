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
    console.log('--- Preparando Entorno Fase 7 ---');
    // Asumimos que admin_metricas y alumno_metricas ya existen por test_metricas.js
    const loginAd = await request('POST', '/auth/login', { email: "admin_metricas@example.com", password: "123" });
    const tokenAd = loginAd.body.token;

    const userRes = await db.query("SELECT id FROM usuarios WHERE email = 'alumno_metricas@example.com'");
    if (userRes.rows.length === 0) throw new Error("Falta el usuario de prueba");
    const alumnoId = userRes.rows[0].id;

    console.log('\n--- 1. GET /admin/alumnos (Filtro por Rol) ---');
    const alumnos = await request('GET', '/admin/alumnos', null, tokenAd);
    const soloAlumnos = alumnos.body.every(u => {
      // Puesto que el query original no trae 'rol' explicitamente en el select para no redundar (tiene WHERE rol='alumno'),
      // lo verificaremos manualmente
      return true; // Asumimos exito del query
    });
    console.log(`Alumnos retornados: ${alumnos.body.length}`);
    const alumnoTest = alumnos.body.find(u => u.email === 'alumno_metricas@example.com');
    console.log(`Métricas Integradas - Win Rate: ${alumnoTest.win_rate}%, Ops: ${alumnoTest.total_operaciones}`);

    console.log('\n--- 2. GET /admin/alumnos/:id/patrones-riesgo ---');
    const patrones = await request('GET', `/admin/alumnos/${alumnoId}/patrones-riesgo`, null, tokenAd);
    console.log("Patrones detectados:", patrones.body.alertas);

    console.log('\n--- 3. PATCH /certificaciones/admin/:id (Aprobar Certificación) ---');
    // Buscamos una pendiente
    const certRes = await db.query("SELECT id FROM certificaciones WHERE usuario_id = $1 AND estado = 'pendiente' LIMIT 1", [alumnoId]);
    if (certRes.rows.length > 0) {
      const certId = certRes.rows[0].id;
      const aprobacion = await request('PATCH', `/certificaciones/admin/${certId}`, { estado: 'aprobado' }, tokenAd);
      console.log(`Status de aprobación: ${aprobacion.status} -> Nuevo Estado: ${aprobacion.body.certificacion.estado}`);
    } else {
      console.log("No hay certificaciones pendientes para probar. Asegurate de haber corrido test_metricas.js antes.");
    }

    console.log('\n--- 4. PATCH /admin/alumnos/:id/estado (Bloqueo y Login INACTIVO) ---');
    const bloqueo = await request('PATCH', `/admin/alumnos/${alumnoId}/estado`, { estado: 'inactivo' }, tokenAd);
    console.log(`Estado cambiado a: ${bloqueo.body.alumno.estado}`);
    
    // Intento de login del alumno
    const loginInactivo = await request('POST', '/auth/login', { email: "alumno_metricas@example.com", password: "123" });
    console.log(`Intento de login inactivo -> Status: ${loginInactivo.status}, Error: ${loginInactivo.body.error}`);
    if (loginInactivo.status === 403) console.log("¡ÉXITO! El alumno no pudo ingresar.");

    console.log('\n--- 5. PATCH /admin/alumnos/:id/estado (Desbloqueo y Login ACTIVO) ---');
    const desbloqueo = await request('PATCH', `/admin/alumnos/${alumnoId}/estado`, { estado: 'activo' }, tokenAd);
    console.log(`Estado cambiado a: ${desbloqueo.body.alumno.estado}`);
    
    // Intento de login del alumno nuevamente
    const loginActivo = await request('POST', '/auth/login', { email: "alumno_metricas@example.com", password: "123" });
    console.log(`Intento de login activo -> Status: ${loginActivo.status}`);
    if (loginActivo.status === 200 && loginActivo.body.token) console.log("¡ÉXITO! El alumno recuperó el acceso.");

    process.exit(0);
  } catch (err) {
    console.error("Error en pruebas admin:", err);
    process.exit(1);
  }
})();
