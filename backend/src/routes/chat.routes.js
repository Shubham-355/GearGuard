const express = require('express');
const { sendMessage, streamMessage } = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// Send a message to chatbot
router.post('/', sendMessage);

// Stream messages from chatbot (for real-time responses)
router.post('/stream', streamMessage);

module.exports = router;
