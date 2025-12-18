const express = require('express');
const router = express.Router();
const { getOcrResults } = require('../controllers/ocrController');

router.get('/documents/incoming', getOcrResults);

module.exports = router;
