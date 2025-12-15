const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');
const upload = require('../middleware/upload');

// Process OCR from uploaded file
router.post('/process', upload.single('file'), ocrController.processFile);

module.exports = router;
