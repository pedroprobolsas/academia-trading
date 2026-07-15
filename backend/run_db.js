const db = require('./config/db');

(async () => {
  try {
    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_metricas_usuario_id ON metricas_usuario(usuario_id);`);
    console.log("Índice creado exitosamente");
    process.exit(0);
  } catch (err) {
    console.error("Error ejecutando SQL:", err);
    process.exit(1);
  }
})();
