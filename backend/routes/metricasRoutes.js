const express = require('express');
const router = express.Router();
const { refreshMetricasCron, getMiDashboard } = require('../controllers/metricasController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Dashboard para el alumno autenticado
router.get('/mi-dashboard', authMiddleware, getMiDashboard);

// Refresco manual solo para admin
router.post('/refresh', authMiddleware, adminMiddleware, refreshMetricasCron);

module.exports = router;
