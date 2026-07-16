const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/progresoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas de progreso requieren autenticación
router.use(authMiddleware);

// Obtener progreso de un módulo (sus misiones y bloques)
router.get('/modulos/:modulo_id', progresoController.getProgresoModulo);

// Marcar un bloque como completado (recibe métricas de consumo en el body)
router.post('/bloques/:bloque_id/completar', progresoController.completarBloque);

// (Opcional/Admin) Marcar una misión completa manualmente
router.post('/misiones/:mision_id/completar', progresoController.completarMision);

module.exports = router;
