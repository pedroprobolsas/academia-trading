const db = require('./config/db');
(async () => {
  try {
    const total = await db.query("SELECT count(*) FROM usuarios");
    const admins = await db.query("SELECT count(*) FROM usuarios WHERE rol = 'admin'");
    const alumnos = await db.query("SELECT count(*) FROM usuarios WHERE rol = 'alumno'");
    console.log(`Total usuarios: ${total.rows[0].count}`);
    console.log(`Admins: ${admins.rows[0].count}`);
    console.log(`Alumnos: ${alumnos.rows[0].count}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
