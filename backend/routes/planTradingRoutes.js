const express = require('express');
const router = express.Router();
const { getActivePlan, createPlan } = require('../controllers/planTradingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/activo', getActivePlan);
router.post('/', createPlan);

module.exports = router;
