const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', alertController.createAlert);
router.get('/', alertController.getAlerts);

module.exports = router;
