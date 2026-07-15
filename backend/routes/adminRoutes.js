const express = require('express');
const router = express.Router();
const { getAlumnos, setEstadoAlumno, getPatronesRiesgo } = require('../controllers/adminAlumnosController');
const adminModuloController = require('../controllers/adminModuloController');
const adminMisionController = require('../controllers/adminMisionController');
const adminBloqueController = require('../controllers/adminBloqueController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Proteger todas las rutas con auth y admin
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

// --- Rutas de Módulos ---
router.get('/modulos', adminModuloController.getAdminModulos);
router.post('/modulos', adminModuloController.crearModuloBorrador);
router.get('/modulos/:id', adminModuloController.getModuloDetalle);
router.patch('/modulos/:id', adminModuloController.actualizarModuloParcial);
router.post('/modulos/:id/publicar', adminModuloController.publicarModulo);
router.post('/modulos/:id/nueva_version', adminModuloController.crearNuevaVersion);
// Legacy image upload
router.post('/modulos/imagenes', upload.single('imagen'), adminModuloController.uploadImagenModulo);

// --- Rutas de Misiones ---
router.post('/modulos/:modulo_id/misiones', adminMisionController.crearMision);
router.patch('/misiones/:id', adminMisionController.actualizarMision);
router.delete('/misiones/:id', adminMisionController.eliminarMision);
router.patch('/modulos/:modulo_id/misiones/orden', adminMisionController.reordenarMisiones);

// --- Rutas de Bloques ---
router.post('/misiones/:mision_id/bloques', adminBloqueController.crearBloque);
router.patch('/bloques/:id', adminBloqueController.actualizarBloque);
router.delete('/bloques/:id', adminBloqueController.eliminarBloque);
router.patch('/misiones/:mision_id/bloques/orden', adminBloqueController.reordenarBloques);

module.exports = router;
