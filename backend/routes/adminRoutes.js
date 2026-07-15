const express = require('express');
const router = express.Router();
const { getAlumnos, setEstadoAlumno, getPatronesRiesgo } = require('../controllers/adminAlumnosController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Proteger todas las rutas de este router con auth y admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/alumnos', getAlumnos);
router.get('/alumnos/:id/patrones-riesgo', getPatronesRiesgo);
router.patch('/alumnos/:id/estado', setEstadoAlumno);

module.exports = router;
