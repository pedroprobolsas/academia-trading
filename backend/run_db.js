const db = require('./config/db');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const sqlPath = path.join(__dirname, 'migrations', '001_modulos_v2_up.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log("Migración aplicada exitosamente");
    process.exit(0);
  } catch (err) {
    console.error("Error ejecutando SQL:", err);
    process.exit(1);
  }
})();
