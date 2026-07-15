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
    // 1. Obtener token de Admin
    const loginAd = await request('POST', '/auth/login', { email: "admin_metricas@example.com", password: "123" });
    const tokenAd = loginAd.body.token;

    // 2. Insertar dos registros de certificación para el mismo alumno (uno rechazado viejo, uno pendiente nuevo)
    const userRes = await db.query("SELECT id FROM usuarios WHERE email = 'alumno_metricas@example.com'");
    const usuarioAlId = userRes.rows[0].id;

    // Limpiar tabla certificaciones para este alumno
    await db.query("DELETE FROM certificaciones WHERE usuario_id = $1", [usuarioAlId]);

    // Insertar vieja rechazada
    await db.query(`
      INSERT INTO certificaciones (usuario_id, criterios_cumplidos, estado, created_at) 
      VALUES ($1, '{}', 'rechazado', NOW() - INTERVAL '5 days')
    `, [usuarioAlId]);

    // Insertar nueva pendiente
    await db.query(`
      INSERT INTO certificaciones (usuario_id, criterios_cumplidos, estado, created_at) 
      VALUES ($1, '{}', 'pendiente', NOW())
    `, [usuarioAlId]);

    console.log("--- 2 Filas de Certificación Sembradas para el mismo Alumno (1 vieja rechazada, 1 nueva pendiente) ---");
    
    const dbCount = await db.query("SELECT COUNT(*) FROM certificaciones WHERE usuario_id = $1", [usuarioAlId]);
    console.log(`Verificación SQL Directa: Filas en tabla = ${dbCount.rows[0].count}`);

    // 3. GET /admin/candidatos (Panel Admin)
    const adminPanel = await request('GET', '/certificaciones/admin/candidatos', null, tokenAd);
    console.log(`Candidatos retornados por el Endpoint: ${adminPanel.body.length}`);
    
    if (adminPanel.body.length === 1 && adminPanel.body[0].estado === 'pendiente') {
      console.log("¡ÉXITO SQL! El DISTINCT ON filtró correctamente a 1 solo registro (el más reciente) por alumno ignorando la vieja rechazada.");
    } else {
      console.log("FALLO en el filtro DISTINCT ON.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error en pruebas:", err);
    process.exit(1);
  }
})();
