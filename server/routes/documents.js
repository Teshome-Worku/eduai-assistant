const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(auth);

// @route   POST /api/documents/upload
router.post('/upload', upload.single('document'), documentController.uploadDocument);

// @route   GET /api/documents
router.get('/', documentController.getDocuments);

// @route   GET /api/documents/:id
router.get('/:id', documentController.getDocument);

// @route   DELETE /api/documents/:id
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
