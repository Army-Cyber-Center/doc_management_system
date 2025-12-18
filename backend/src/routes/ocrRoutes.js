const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');
const upload = require('../middleware/upload');
const { getOcrResults } = require('../controllers/ocrController');

// Process OCR from uploaded file
router.post('/process', upload.single('file'), ocrController.processFile);


// กำหนดว่าถ้า Frontend เรียก /api/ocr-results ให้ไปที่ getOcrResults ใน Controller
router.get('/ocr-results', ocrController.getOcrResults);

module.exports = router;

