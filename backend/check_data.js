const db = require('./config/db');

(async () => {
  try {
    const query = `
      SELECT count(*), array_agg(resultado_r_multiple ORDER BY fecha_operacion) 
      FROM operaciones_journal 
      WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'test_progreso@example.com');
    `;
    const res = await db.query(query);
    console.log(res.rows[0]);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
