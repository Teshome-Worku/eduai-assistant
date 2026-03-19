const Document = require('../models/Document');
const QuizResult = require('../models/QuizResult');
const TopicMastery = require('../models/TopicMastery');
const { generateQuizQuestions } = require('./geminiService');
const { updateMastery } = require('./masteryEngine');

/**
 * Generate an adaptive quiz for a user
 * Selects topics from weak areas first, adjusts difficulty
 * @param {string} userId - User ID
 * @param {string} requestedTopic - Specific topic or 'auto' for weak topics
 * @param {number} questionCount - Number of questions
 * @returns {Promise<Object>} Quiz with questions
 */
const generateAdaptiveQuiz = async (userId, requestedTopic = 'auto', questionCount = 5) => {
  let topic = requestedTopic;
  let difficulty = 'medium';

  // If auto, pick from weak topics
  if (topic === 'auto') {
    const weakTopics = await TopicMastery.find({
      userId,
      attempts: { $gt: 0 },
      accuracy: { $lt: 60 }
    }).sort({ accuracy: 1 }).limit(3);

    if (weakTopics.length > 0) {
      // Pick randomly from weakest topics
      topic = weakTopics[Math.floor(Math.random() * weakTopics.length)].topicName;
    } else {
      // No weak topics, pick any topic
      const anyTopic = await TopicMastery.findOne({ userId });
      topic = anyTopic ? anyTopic.topicName : 'General';
    }
  }

  // Determine difficulty based on past performance
  const mastery = await TopicMastery.findOne({ userId, topicName: topic });
  if (mastery) {
    const lastQuiz = await QuizResult.findOne({
      userId,
      topic
    }).sort({ createdAt: -1 });

    if (lastQuiz) {
      const scorePercent = (lastQuiz.score / lastQuiz.totalQuestions) * 100;
      if (scorePercent > 80) {
        difficulty = mastery.accuracy > 80 ? 'hard' : 'medium';
      } else if (scorePercent < 50) {
        difficulty = 'easy';
      }
    } else {
      // First quiz on this topic
      difficulty = mastery.accuracy > 60 ? 'medium' : 'easy';
    }
  }

  // Get relevant document content for context
  const documents = await Document.find({ userId });
  let context = '';
  for (const doc of documents) {
    const topicMatch = doc.extractedTopics.some(
      t => t.name.toLowerCase().includes(topic.toLowerCase()) ||
           t.subtopics.some(s => s.toLowerCase().includes(topic.toLowerCase()))
    );
    if (topicMatch || documents.length <= 2) {
      context += doc.extractedText + '\n\n';
    }
  }

  if (!context) {
    context = documents.map(d => d.extractedText).join('\n\n');
  }

  // Generate questions using AI
  const questions = await generateQuizQuestions(context, topic, difficulty, questionCount);

  return {
    topic,
    difficulty,
    questions,
    totalQuestions: questions.length
  };
};

/**
 * Submit quiz answers and update mastery
 * @param {string} userId - User ID
 * @param {Object} quizData - Quiz submission data
 * @returns {Promise<Object>} Quiz result
 */
const submitQuiz = async (userId, quizData) => {
  const { topic, questions, difficulty, timeSpent } = quizData;

  let score = 0;
  const processedQuestions = questions.map(q => {
    const isCorrect = q.userAnswer === q.correctAnswer;
    if (isCorrect) score += 1;
    return {
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      isCorrect,
      responseTime: q.responseTime || 0
    };
  });

  // Save quiz result
  const quizResult = await QuizResult.create({
    userId,
    topic,
    questions: processedQuestions,
    score,
    totalQuestions: questions.length,
    timeSpent: timeSpent || 0,
    difficulty: difficulty || 'medium'
  });

  // Update mastery for each question
  for (const q of processedQuestions) {
    await updateMastery(userId, topic, q.isCorrect);
  }

  return {
    quizId: quizResult._id,
    topic,
    score,
    totalQuestions: questions.length,
    percentage: Math.round((score / questions.length) * 100),
    difficulty,
    timeSpent,
    questions: processedQuestions
  };
};

module.exports = {
  generateAdaptiveQuiz,
  submitQuiz
};
