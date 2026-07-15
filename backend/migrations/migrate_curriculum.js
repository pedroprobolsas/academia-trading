const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Ejecutando schema.sql UP...');
    const sqlPath = path.join(__dirname, '001_modulos_v2_up.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sqlScript);

    console.log('2. Migrando datos legados de modulos a misiones y bloques...');
    
    // Obtener todos los módulos actuales
    const resModulos = await client.query('SELECT id, titulo, youtube_url, contenido_texto, drive_url, audio_url, formato_principal FROM modulos');
    const modulos = resModulos.rows;

    for (const mod of modulos) {
      // Setear todos a estado=publicado ya que son los módulos legacy funcionales
      await client.query('UPDATE modulos SET estado = $1, publicado_at = now() WHERE id = $2', ['publicado', mod.id]);

      // Revisar si ya tiene misiones (para hacer el script idempotente)
      const resMisiones = await client.query('SELECT id FROM misiones WHERE modulo_id = $1', [mod.id]);
      if (resMisiones.rows.length === 0) {
        console.log(`   - Creando Misión por defecto para el módulo: ${mod.titulo}`);
        const insertMision = await client.query(`
          INSERT INTO misiones (modulo_id, numero_orden, titulo, objetivo, tipo, duracion_estimada_min, obligatoria)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          mod.id,
          1,
          'Misión Principal: ' + mod.titulo,
          'Misión autogenerada desde la versión 1 del currículum.',
          'explicacion',
          60,
          true
        ]);
        
        const misionId = insertMision.rows[0].id;
        let blockOrder = 1;

        // Migrar Youtube
        if (mod.youtube_url) {
           await client.query(`
             INSERT INTO bloques_contenido (mision_id, numero_orden, tipo, titulo, descripcion, config)
             VALUES ($1, $2, $3, $4, $5, $6)
           `, [
             misionId, blockOrder++, 'video_youtube', 'Video de la Clase', 'Video principal',
             JSON.stringify({ url: mod.youtube_url })
           ]);
        }

        // Migrar Texto
        if (mod.contenido_texto) {
           await client.query(`
             INSERT INTO bloques_contenido (mision_id, numero_orden, tipo, titulo, descripcion, config)
             VALUES ($1, $2, $3, $4, $5, $6)
           `, [
             misionId, blockOrder++, 'texto_markdown', 'Material de Lectura', 'Texto principal',
             JSON.stringify({ markdown: mod.contenido_texto })
           ]);
        }

        // Migrar Drive
        if (mod.drive_url) {
           await client.query(`
             INSERT INTO bloques_contenido (mision_id, numero_orden, tipo, titulo, descripcion, config)
             VALUES ($1, $2, $3, $4, $5, $6)
           `, [
             misionId, blockOrder++, 'documento_drive', 'Documento Adjunto', 'Drive',
             JSON.stringify({ url: mod.drive_url })
           ]);
        }

        // Migrar Audio
        if (mod.audio_url) {
           await client.query(`
             INSERT INTO bloques_contenido (mision_id, numero_orden, tipo, titulo, descripcion, config)
             VALUES ($1, $2, $3, $4, $5, $6)
           `, [
             misionId, blockOrder++, 'audio', 'Audio de la Clase', 'Audio principal',
             JSON.stringify({ url: mod.audio_url })
           ]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Migración completada con éxito.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la migración:', error);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
