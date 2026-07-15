const db = require('./config/db');
const { refreshMetricasCron } = require('./controllers/metricasController');

(async () => {
  try {
    console.log('Refrescando métricas...');
    // We can simulate the req and res objects for the controller
    const req = {};
    const res = {
      json: (data) => console.log('Éxito:', data),
      status: (code) => ({ json: (data) => console.log('Error:', code, data) })
    };
    await refreshMetricasCron(req, res);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
