const { execSync } = require('child_process');

const tests = [
  'test_suite.js',
  'test_minio.js',
  'test_metricas.js',
  'test_admin.js'
];

try {
  console.log("=================================================");
  console.log("    INICIANDO REGRESSION TEST (FASES 1 a 7)      ");
  console.log("=================================================\n");

  for (const test of tests) {
    console.log(`\n\n>>>>>>>> EJECUTANDO: ${test} <<<<<<<<`);
    const output = execSync(`node ${test}`, { encoding: 'utf-8', stdio: 'inherit' });
  }

  console.log("\n\n=================================================");
  console.log("    REGRESSION TEST COMPLETADO CON ÉXITO         ");
  console.log("=================================================");
} catch (error) {
  console.error("\n\n=================================================");
  console.error("         ERROR EN EL REGRESSION TEST             ");
  console.error("=================================================");
  process.exit(1);
}
