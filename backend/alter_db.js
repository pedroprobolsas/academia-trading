const db = require('./config/db');

(async () => {
  try {
    await db.query('ALTER TABLE operaciones_journal RENAME COLUMN captura_url TO captura_object_name');
    console.log('Columna renombrada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error alterando DB:', err);
    process.exit(1);
  }
})();
