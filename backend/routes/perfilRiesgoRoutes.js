const express = require('express');
const router = express.Router();
const perfilRiesgoController = require('../controllers/perfilRiesgoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, perfilRiesgoController.createPerfilRiesgo);

module.exports = router;
