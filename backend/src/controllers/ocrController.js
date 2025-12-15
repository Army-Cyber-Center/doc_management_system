const ocrService = require('../services/ocrService');

// Process OCR from uploaded file
exports.processFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📁 Processing file:', req.file.filename);

    const result = await ocrService.processImage(req.file.path);

    res.json({
      message: 'OCR processing completed',
      data: result
    });
  } catch (error) {
    console.error('❌ OCR Error:', error);
    res.status(500).json({ message: 'Error processing OCR', error: error.message });
  }
};
