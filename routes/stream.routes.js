const express = require('express');
const router = express.Router();
const streamController = require('../controllers/stream.controller');

router.get('/current', streamController.getCurrentStream);
router.get('/:videoId', streamController.streamVideo);
router.post('/next', streamController.nextVideo);

module.exports = router;
