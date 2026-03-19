const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   POST /api/ai/ask
router.post('/ask', aiController.askQuestion);

// @route   POST /api/ai/summarize
router.post('/summarize', aiController.summarizeDocument);

// @route   POST /api/ai/compare-documents
router.post('/compare-documents', aiController.compareDocuments);

// @route   POST /api/ai/extract-topics
router.post('/extract-topics', aiController.extractTopics);

// @route   POST /api/ai/generate-quiz
router.post('/generate-quiz', aiController.generateQuiz);

// @route   POST /api/ai/submit-quiz
router.post('/submit-quiz', aiController.submitQuizAnswers);

module.exports = router;
