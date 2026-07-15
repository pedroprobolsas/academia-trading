const express = require('express');
const router = express.Router();
const { getAlumnos, setEstadoAlumno, getPatronesRiesgo } = require('../controllers/adminAlumnosController');
const { getAdminModulos, crearModulo, actualizarModulo, desactivarModulo, uploadImagenModulo } = require('../controllers/adminModuloController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Proteger todas las rutas de este router con auth y admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/alumnos', getAlumnos);
router.get('/alumnos/:id/patrones-riesgo', getPatronesRiesgo);
router.patch('/alumnos/:id/estado', setEstadoAlumno);

const multer = require('multer');

// Configuración estricta de multer para imágenes de módulos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 // 500 KB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y WebP.'));
    }
  }
});

// Rutas de Módulos
router.get('/modulos', getAdminModulos);
router.post('/modulos', crearModulo);
router.put('/modulos/:id', actualizarModulo);
router.patch('/modulos/:id/estado', desactivarModulo);
router.post('/modulos/imagenes', upload.single('imagen'), uploadImagenModulo);

module.exports = router;
