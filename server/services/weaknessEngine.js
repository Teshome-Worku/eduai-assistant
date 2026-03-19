const TopicMastery = require('../models/TopicMastery');

/**
 * Detect weak topics for a user
 * Criteria: accuracy < 50%, declining trend, or confidence < 40
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Weak topics ranked by severity
 */
const detectWeakTopics = async (userId) => {
  const topics = await TopicMastery.find({
    userId,
    attempts: { $gt: 0 } // Only consider topics with at least one attempt
  });

  const weakTopics = topics
    .map(topic => {
      let severity = 0;
      const reasons = [];

      // Low accuracy
      if (topic.accuracy < 30) {
        severity += 3;
        reasons.push('Very low accuracy');
      } else if (topic.accuracy < 50) {
        severity += 2;
        reasons.push('Low accuracy');
      }

      // Declining trend
      if (topic.trend === 'declining') {
        severity += 2;
        reasons.push('Declining performance');
      }

      // Low confidence
      if (topic.confidenceScore < 25) {
        severity += 2;
        reasons.push('Very low confidence');
      } else if (topic.confidenceScore < 40) {
        severity += 1;
        reasons.push('Low confidence');
      }

      // Few attempts (not enough practice)
      if (topic.attempts < 3 && topic.accuracy < 70) {
        severity += 1;
        reasons.push('Needs more practice');
      }

      return {
        topicName: topic.topicName,
        accuracy: topic.accuracy,
        confidenceScore: topic.confidenceScore,
        trend: topic.trend,
        attempts: topic.attempts,
        severity,
        reasons,
        isWeak: severity >= 2
      };
    })
    .filter(t => t.isWeak)
    .sort((a, b) => b.severity - a.severity);

  return weakTopics;
};

/**
 * Get topics that need immediate attention
 * @param {string} userId - User ID
 * @param {number} limit - Max topics to return
 * @returns {Promise<Array>} Critical weak topics
 */
const getCriticalTopics = async (userId, limit = 5) => {
  const weakTopics = await detectWeakTopics(userId);
  return weakTopics.slice(0, limit);
};

module.exports = {
  detectWeakTopics,
  getCriticalTopics
};
