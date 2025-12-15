const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');

// Get all documents
router.get('/', documentController.getAllDocuments);

// Get document stats
router.get('/stats', documentController.getStats);

// Search documents
router.get('/search', documentController.searchDocuments);

// Get document by ID
router.get('/:id', documentController.getDocumentById);

// Create new document
router.post('/', upload.single('file'), documentController.createDocument);

// Update document
router.put('/:id', documentController.updateDocument);

// Delete document
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
