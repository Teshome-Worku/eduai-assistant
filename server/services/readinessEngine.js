const TopicMastery = require('../models/TopicMastery');
const Document = require('../models/Document');
const User = require('../models/User');

/**
 * Calculate exam readiness score
 * Formula: readiness = (avgMastery * 0.5) + (coveragePercent * 0.3) + (trendBonus * 0.2)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Readiness report
 */
const calculateReadiness = async (userId) => {
  const topics = await TopicMastery.find({ userId });
  const documents = await Document.find({ userId });

  // Get total unique topics from all documents
  const allDocTopics = new Set();
  documents.forEach(doc => {
    doc.extractedTopics.forEach(t => {
      allDocTopics.add(t.name);
      t.subtopics.forEach(st => allDocTopics.add(st));
    });
  });

  const totalTopics = Math.max(allDocTopics.size, topics.length, 1);
  const attemptedTopics = topics.filter(t => t.attempts > 0);

  // Average mastery (0-100)
  const avgMastery = attemptedTopics.length > 0
    ? attemptedTopics.reduce((sum, t) => sum + t.accuracy, 0) / attemptedTopics.length
    : 0;

  // Coverage percentage
  const coveragePercent = (attemptedTopics.length / totalTopics) * 100;

  // Trend bonus: percentage of topics that are improving
  const improvingTopics = attemptedTopics.filter(t => t.trend === 'improving').length;
  const trendBonus = attemptedTopics.length > 0
    ? (improvingTopics / attemptedTopics.length) * 100
    : 0;

  // Calculate readiness score
  const readinessScore = Math.round(
    (avgMastery * 0.5) + (coveragePercent * 0.3) + (trendBonus * 0.2)
  );

  // Pass probability (sigmoid-like curve based on readiness)
  const passProbability = Math.round(
    100 / (1 + Math.exp(-0.1 * (readinessScore - 50)))
  );

  // Focus areas (top 3 weakest topics)
  const focusAreas = topics
    .filter(t => t.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map(t => ({
      topicName: t.topicName,
      accuracy: t.accuracy,
      recommendation: getRecommendation(t)
    }));

  // Uncovered topics
  const coveredTopicNames = new Set(attemptedTopics.map(t => t.topicName));
  const uncoveredTopics = [...allDocTopics].filter(t => !coveredTopicNames.has(t)).slice(0, 5);

  // Update user readiness score
  await User.findByIdAndUpdate(userId, { readinessScore });

  return {
    readinessScore: Math.min(readinessScore, 100),
    passProbability: Math.min(passProbability, 99),
    avgMastery: Math.round(avgMastery),
    coveragePercent: Math.round(coveragePercent),
    trendBonus: Math.round(trendBonus),
    totalTopics,
    attemptedTopics: attemptedTopics.length,
    focusAreas,
    uncoveredTopics,
    summary: generateReadinessSummary(readinessScore, focusAreas)
  };
};

/**
 * Generate a recommendation for a topic
 */
const getRecommendation = (topic) => {
  if (topic.accuracy < 30) return 'Start with basic concepts. Review study material thoroughly.';
  if (topic.accuracy < 50) return 'Practice more questions. Focus on understanding key concepts.';
  if (topic.accuracy < 70) return 'Good progress! Take targeted quizzes to strengthen understanding.';
  if (topic.trend === 'declining') return 'Review recently. Your performance is dropping.';
  return 'Almost mastered! Do a quick revision to maintain.';
};

/**
 * Generate human-readable readiness summary
 */
const generateReadinessSummary = (score, focusAreas) => {
  let message = '';

  if (score >= 80) {
    message = 'You are well-prepared! Keep reviewing to maintain your knowledge.';
  } else if (score >= 60) {
    message = 'Good progress, but there are areas that need more attention.';
  } else if (score >= 40) {
    message = 'You need more study time. Focus on your weak topics.';
  } else {
    message = 'You are in the early stages of preparation. Start with the fundamentals.';
  }

  if (focusAreas.length > 0) {
    const topicNames = focusAreas.map(f => f.topicName).join(', ');
    message += ` Focus on: ${topicNames}.`;
  }

  return message;
};

module.exports = {
  calculateReadiness
};
