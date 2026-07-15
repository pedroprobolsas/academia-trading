const express = require('express');
const router = express.Router();
const { getAlumnos, setEstadoAlumno, getPatronesRiesgo } = require('../controllers/adminAlumnosController');
const { getAdminModulos, crearModulo, actualizarModulo, desactivarModulo } = require('../controllers/adminModuloController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Proteger todas las rutas de este router con auth y admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/alumnos', getAlumnos);
router.get('/alumnos/:id/patrones-riesgo', getPatronesRiesgo);
router.patch('/alumnos/:id/estado', setEstadoAlumno);

// Rutas de Módulos
router.get('/modulos', getAdminModulos);
router.post('/modulos', crearModulo);
router.put('/modulos/:id', actualizarModulo);
router.patch('/modulos/:id/estado', desactivarModulo);

module.exports = router;
