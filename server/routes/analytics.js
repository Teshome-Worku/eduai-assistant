const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/analytics/mastery
router.get('/mastery', analyticsController.getMastery);

// @route   GET /api/analytics/weak-topics
router.get('/weak-topics', analyticsController.getWeakTopics);

// @route   GET /api/analytics/exam-readiness
router.get('/exam-readiness', analyticsController.getExamReadiness);

// @route   GET /api/analytics/study-time
router.get('/study-time', analyticsController.getStudyTime);

// @route   GET /api/analytics/revision-plan
router.get('/revision-plan', analyticsController.getRevisionPlan);

// @route   GET /api/analytics/history
router.get('/history', analyticsController.getHistory);

module.exports = router;
