const db = require('./config/db');

(async () => {
  try {
    const res = await db.query('SELECT email, nombre_completo, rol, estado FROM usuarios');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
