const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runRollback() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Ejecutando schema.sql DOWN...');
    const sqlPath = path.join(__dirname, '001_modulos_v2_down.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sqlScript);

    await client.query('COMMIT');
    console.log('✅ Rollback destructivo completado. Las tablas nuevas y columnas nuevas han sido removidas.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en el rollback:', error);
  } finally {
    client.release();
    pool.end();
  }
}

runRollback();
