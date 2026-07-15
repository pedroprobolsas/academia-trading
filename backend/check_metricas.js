const db = require('./config/db');
(async () => {
  try {
    const res = await db.query(`
      SELECT m.*, u.email 
      FROM metricas_usuario m
      JOIN usuarios u ON m.usuario_id = u.id
    `);
    console.table(res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e); process.exit(1);
  }
})();
