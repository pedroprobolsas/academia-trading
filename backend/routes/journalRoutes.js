const express = require('express');
const router = express.Router();
const { getOperaciones, registrarOperacion, subirCaptura, obtenerUrlCaptura } = require('../controllers/journalController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.get('/', getOperaciones);
router.post('/', registrarOperacion);
router.post('/:id/captura', upload.single('imagen'), subirCaptura);
router.get('/:id/captura-url', obtenerUrlCaptura);

module.exports = router;
