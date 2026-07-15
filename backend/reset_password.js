const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
  try {
    const passwordEnTextoPlano = 'Academia2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(passwordEnTextoPlano, salt);

    // Actualizamos al alumno_metricas y a test_progreso (el que tiene las 6 operaciones de la fase 6)
    await db.query("UPDATE usuarios SET password_hash = $1 WHERE email IN ('alumno_metricas@example.com', 'test_progreso@example.com')", [hash]);
    
    console.log(`Password reseteado con éxito para alumno_metricas y test_progreso a: ${passwordEnTextoPlano}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
