const Document = require('../models/Document');
const User = require('../models/User');
const InteractionHistory = require('../models/InteractionHistory');
const geminiService = require('../services/geminiService');
const { extractTopicsFromText, initializeMasteryForTopics } = require('../services/topicEngine');
const { generateAdaptiveQuiz, submitQuiz } = require('../services/quizEngine');

/**
 * Helper: increment AI interactions and check quota
 */
const checkAndIncrementQuota = async (user) => {
  // Reset quota if new day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReset = new Date(user.dailyQuota.lastReset);
  lastReset.setHours(0, 0, 0, 0);

  if (today > lastReset) {
    user.dailyQuota.used = 0;
    user.dailyQuota.lastReset = new Date();
  }

  if (user.dailyQuota.used >= user.dailyQuota.limit) {
    return false;
  }

  user.dailyQuota.used += 1;
  user.aiInteractions += 1;
  await user.save();
  return true;
};

// @desc    Ask a question across documents
// @route   POST /api/ai/ask
exports.askQuestion = async (req, res) => {
  try {
    const { question, documentIds } = req.body;
    const startTime = Date.now();

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Check quota
    const user = await User.findById(req.user._id);
    const quotaOk = await checkAndIncrementQuota(user);
    if (!quotaOk) {
      return res.status(429).json({ success: false, message: 'Daily AI quota exceeded' });
    }

    // Get document context
    let documents;
    if (documentIds && documentIds.length > 0) {
      documents = await Document.find({ _id: { $in: documentIds }, userId: req.user._id });
    } else {
      documents = await Document.find({ userId: req.user._id });
    }

    if (documents.length === 0) {
      return res.status(400).json({ success: false, message: 'No documents found. Upload documents first.' });
    }

    const context = documents.map(d => d.extractedText).join('\n\n---\n\n');
    const response = await geminiService.askQuestion(question, context);
    const responseTime = Date.now() - startTime;

    // Extract topic tag from response
    const topicMatch = response.match(/\[Topic:\s*(.+?)\]/);
    const topicTag = topicMatch ? topicMatch[1] : 'general';

    // Save interaction
    await InteractionHistory.create({
      userId: req.user._id,
      question,
      response,
      topicTag,
      responseTime,
      documentIds: documents.map(d => d._id),
      type: 'ask'
    });

    // Update study time (estimate 1 minute per interaction)
    user.studyTime += 1;
    user.lastStudyDate = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        answer: response,
        topicTag,
        responseTime,
        documentsUsed: documents.map(d => d.originalName)
      }
    });
  } catch (error) {
    console.error('Ask question error:', error);
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to process question' });
  }
};

// @desc    Summarize a document
// @route   POST /api/ai/summarize
exports.summarizeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, message: 'Document ID is required' });
    }

    const user = await User.findById(req.user._id);
    const quotaOk = await checkAndIncrementQuota(user);
    if (!quotaOk) {
      return res.status(429).json({ success: false, message: 'Daily AI quota exceeded' });
    }

    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const startTime = Date.now();
    const summary = await geminiService.summarizeDocument(document.extractedText);
    const responseTime = Date.now() - startTime;

    await InteractionHistory.create({
      userId: req.user._id,
      question: `Summarize: ${document.originalName}`,
      response: summary,
      topicTag: 'summary',
      responseTime,
      documentIds: [document._id],
      type: 'summarize'
    });

    res.json({
      success: true,
      data: {
        summary,
        documentName: document.originalName,
        responseTime
      }
    });
  } catch (error) {
    console.error('Summarize error:', error);
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to summarize document' });
  }
};

// @desc    Compare two documents
// @route   POST /api/ai/compare-documents
exports.compareDocuments = async (req, res) => {
  try {
    const { documentIdA, documentIdB } = req.body;

    if (!documentIdA || !documentIdB) {
      return res.status(400).json({ success: false, message: 'Two document IDs are required' });
    }

    const user = await User.findById(req.user._id);
    const quotaOk = await checkAndIncrementQuota(user);
    if (!quotaOk) {
      return res.status(429).json({ success: false, message: 'Daily AI quota exceeded' });
    }

    const docA = await Document.findOne({ _id: documentIdA, userId: req.user._id });
    const docB = await Document.findOne({ _id: documentIdB, userId: req.user._id });

    if (!docA || !docB) {
      return res.status(404).json({ success: false, message: 'One or both documents not found' });
    }

    const startTime = Date.now();
    const comparison = await geminiService.compareDocuments(
      docA.extractedText, docB.extractedText,
      docA.originalName, docB.originalName
    );
    const responseTime = Date.now() - startTime;

    await InteractionHistory.create({
      userId: req.user._id,
      question: `Compare: ${docA.originalName} vs ${docB.originalName}`,
      response: comparison,
      topicTag: 'comparison',
      responseTime,
      documentIds: [docA._id, docB._id],
      type: 'compare'
    });

    res.json({
      success: true,
      data: {
        comparison,
        documentA: docA.originalName,
        documentB: docB.originalName,
        responseTime
      }
    });
  } catch (error) {
    console.error('Compare error:', error);
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to compare documents' });
  }
};

// @desc    Extract topics from a document
// @route   POST /api/ai/extract-topics
exports.extractTopics = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, message: 'Document ID is required' });
    }

    const user = await User.findById(req.user._id);
    const quotaOk = await checkAndIncrementQuota(user);
    if (!quotaOk) {
      return res.status(429).json({ success: false, message: 'Daily AI quota exceeded' });
    }

    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const topics = await extractTopicsFromText(document.extractedText);

    // Update document with new topics
    document.extractedTopics = topics;
    await document.save();

    // Initialize mastery tracking
    await initializeMasteryForTopics(req.user._id, topics);

    res.json({
      success: true,
      data: {
        topics,
        documentName: document.originalName
      }
    });
  } catch (error) {
    console.error('Extract topics error:', error);
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to extract topics' });
  }
};

// @desc    Generate adaptive quiz
// @route   POST /api/ai/generate-quiz
exports.generateQuiz = async (req, res) => {
  try {
    const { topic, questionCount } = req.body;

    const user = await User.findById(req.user._id);
    const quotaOk = await checkAndIncrementQuota(user);
    if (!quotaOk) {
      return res.status(429).json({ success: false, message: 'Daily AI quota exceeded' });
    }

    const quiz = await generateAdaptiveQuiz(
      req.user._id,
      topic || 'auto',
      questionCount || 5
    );

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to generate quiz' });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/ai/submit-quiz
exports.submitQuizAnswers = async (req, res) => {
  try {
    const { topic, questions, difficulty, timeSpent } = req.body;

    if (!topic || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz submission' });
    }

    const result = await submitQuiz(req.user._id, {
      topic,
      questions,
      difficulty,
      timeSpent
    });

    // Update study time
    const user = await User.findById(req.user._id);
    user.studyTime += Math.ceil((timeSpent || 0) / 60);
    user.lastStudyDate = new Date();
    await user.save();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
};
