const TopicMastery = require('../models/TopicMastery');

/**
 * Update mastery score for a topic after a quiz/interaction
 * @param {string} userId - User ID
 * @param {string} topicName - Topic name
 * @param {boolean} isCorrect - Whether the answer was correct
 */
const updateMastery = async (userId, topicName, isCorrect) => {
  let mastery = await TopicMastery.findOne({ userId, topicName });

  if (!mastery) {
    mastery = await TopicMastery.create({
      userId,
      topicName,
      accuracy: 0,
      attempts: 0,
      correctAnswers: 0,
      confidenceScore: 0,
      trend: 'stable',
      recentResults: [],
      nextReviewDate: new Date(),
      reviewInterval: 1
    });
  }

  // Update basic counts
  mastery.attempts += 1;
  if (isCorrect) {
    mastery.correctAnswers += 1;
  }

  // Update accuracy
  mastery.accuracy = Math.round((mastery.correctAnswers / mastery.attempts) * 100);

  // Add to recent results (keep last 10)
  mastery.recentResults.push({ isCorrect, timestamp: new Date() });
  if (mastery.recentResults.length > 10) {
    mastery.recentResults = mastery.recentResults.slice(-10);
  }

  // Calculate confidence score (weighted recent accuracy)
  mastery.confidenceScore = calculateConfidence(mastery.recentResults);

  // Calculate trend
  mastery.trend = calculateTrend(mastery.recentResults);

  // Update spaced repetition interval
  mastery.reviewInterval = calculateReviewInterval(mastery.accuracy, mastery.reviewInterval);
  mastery.nextReviewDate = new Date(Date.now() + mastery.reviewInterval * 24 * 60 * 60 * 1000);

  mastery.lastUpdated = new Date();
  await mastery.save();

  return mastery;
};

/**
 * Batch update mastery from quiz results
 * @param {string} userId - User ID
 * @param {string} topicName - Topic name
 * @param {Array} results - Array of { isCorrect }
 */
const updateMasteryFromQuiz = async (userId, topicName, results) => {
  for (const result of results) {
    await updateMastery(userId, topicName, result.isCorrect);
  }

  return await TopicMastery.findOne({ userId, topicName });
};

/**
 * Calculate confidence score using weighted recent performance
 * More recent results are weighted higher
 */
const calculateConfidence = (recentResults) => {
  if (recentResults.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  recentResults.forEach((result, index) => {
    const weight = index + 1; // More recent = higher weight
    weightedSum += (result.isCorrect ? 100 : 0) * weight;
    weightTotal += weight;
  });

  return Math.round(weightedSum / weightTotal);
};

/**
 * Calculate trend by comparing recent half vs older half of results
 */
const calculateTrend = (recentResults) => {
  if (recentResults.length < 4) return 'stable';

  const mid = Math.floor(recentResults.length / 2);
  const older = recentResults.slice(0, mid);
  const newer = recentResults.slice(mid);

  const olderAccuracy = older.filter(r => r.isCorrect).length / older.length;
  const newerAccuracy = newer.filter(r => r.isCorrect).length / newer.length;

  const diff = newerAccuracy - olderAccuracy;

  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
};

/**
 * Calculate next review interval using spaced repetition
 */
const calculateReviewInterval = (accuracy, currentInterval) => {
  if (accuracy >= 90) return Math.min(currentInterval * 2.5, 30);
  if (accuracy >= 70) return Math.min(currentInterval * 2, 14);
  if (accuracy >= 50) return Math.min(currentInterval * 1.5, 7);
  return 1; // Reset to daily review for poor performance
};

/**
 * Get mastery summary for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Mastery summary
 */
const getMasterySummary = async (userId) => {
  const topics = await TopicMastery.find({ userId });

  if (topics.length === 0) {
    return {
      totalTopics: 0,
      averageAccuracy: 0,
      averageConfidence: 0,
      mastered: 0,
      inProgress: 0,
      weak: 0,
      topics: []
    };
  }

  const mastered = topics.filter(t => t.accuracy >= 80);
  const weak = topics.filter(t => t.accuracy < 50);
  const inProgress = topics.filter(t => t.accuracy >= 50 && t.accuracy < 80);

  const avgAccuracy = Math.round(
    topics.reduce((sum, t) => sum + t.accuracy, 0) / topics.length
  );
  const avgConfidence = Math.round(
    topics.reduce((sum, t) => sum + t.confidenceScore, 0) / topics.length
  );

  return {
    totalTopics: topics.length,
    averageAccuracy: avgAccuracy,
    averageConfidence: avgConfidence,
    mastered: mastered.length,
    inProgress: inProgress.length,
    weak: weak.length,
    topics: topics.map(t => ({
      topicName: t.topicName,
      accuracy: t.accuracy,
      confidenceScore: t.confidenceScore,
      attempts: t.attempts,
      trend: t.trend,
      lastUpdated: t.lastUpdated
    }))
  };
};

module.exports = {
  updateMastery,
  updateMasteryFromQuiz,
  getMasterySummary,
  calculateConfidence,
  calculateTrend
};
