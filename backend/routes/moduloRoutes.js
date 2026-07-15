const express = require('express');
const router = express.Router();
const { getModulos } = require('../controllers/moduloController');
const { getPreguntas, submitQuiz } = require('../controllers/quizController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas de módulos requieren autenticación
router.use(authMiddleware);

// 1. Obtener lista de módulos y progreso
router.get('/', getModulos);

// 2. Obtener preguntas de un módulo
router.get('/:id/preguntas', getPreguntas);

// 3. Enviar intento de quiz (calificación y progreso)
router.post('/:id/quiz-intentos', submitQuiz);

module.exports = router;
