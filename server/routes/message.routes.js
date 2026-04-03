const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markRead } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, sendMessage);
router.get('/', protect, getMessages);
router.patch('/:id/read', protect, markRead);

module.exports = router;
