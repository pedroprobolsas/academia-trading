const express = require('express');
const router = express.Router();
const { getModulos, getAudioPresignedUrl } = require('../controllers/moduloController');
const { getPreguntas, submitQuiz } = require('../controllers/quizController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas de módulos requieren autenticación
router.use(authMiddleware);

// Rutas base de módulos (disponibles para usuarios autenticados)
router.get('/', getModulos);
router.get('/:id/audio-url', getAudioPresignedUrl);

// Rutas de quizzes de los módulos
router.get('/:id/preguntas', getPreguntas);

// 3. Enviar intento de quiz (calificación y progreso)
router.post('/:id/quiz-intentos', submitQuiz);

module.exports = router;
