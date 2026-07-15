const db = require('./config/db');
(async () => {
  try {
    const res = await db.query("SELECT * FROM metricas_usuario LIMIT 1;");
    console.log(res.fields.map(f => f.name));
    process.exit(0);
  } catch(e) {
    console.error(e); process.exit(1);
  }
})();
