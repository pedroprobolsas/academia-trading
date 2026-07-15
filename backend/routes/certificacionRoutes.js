const express = require('express');
const router = express.Router();
const { solicitarCertificacion, getCandidatos, setEstadoCertificacion } = require('../controllers/certificacionController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Endpoint de alumno
router.post('/solicitar', authMiddleware, solicitarCertificacion);

// Endpoint de Admin
router.get('/admin/candidatos', authMiddleware, adminMiddleware, getCandidatos);
router.patch('/admin/:id', authMiddleware, adminMiddleware, setEstadoCertificacion);

module.exports = router;
