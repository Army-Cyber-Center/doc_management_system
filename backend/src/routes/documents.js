const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

router.post(
  '/upload',
  auth,
  upload.single('file'),
  async (req, res) => {
    try {
      const {
        title,
        document_type,
        from_department,
        priority,
        document_number,
        document_date,
        ocr_data
      } = req.body;

      const file = req.file;

      const [docResult] = await db.execute(
        `INSERT INTO documents
        (title, document_number, document_type, from_department,
         priority, file_path, file_size, file_type, ocr_data, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          document_number,
          document_type,
          from_department,
          priority,
          file.path,
          file.size,
          file.mimetype,
          ocr_data || null,
          req.user.id
        ]
      );

      // OCR result table
      if (ocr_data) {
        const parsed = JSON.parse(ocr_data);

        await db.execute(
          `INSERT INTO ocr_results
          (document_id, extracted_text, confidence_score, extracted_fields)
          VALUES (?, ?, ?, ?)`,
          [
            docResult.insertId,
            parsed.text || '',
            parsed.confidence || 0,
            JSON.stringify(parsed)
          ]
        );
      }

      res.json({
        success: true,
        document_id: docResult.insertId
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);


const { getOcrResults } = require('../controllers/ocrController');

router.get('/documents/incoming', getOcrResults);

module.exports = router;


module.exports = router;
