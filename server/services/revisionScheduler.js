const TopicMastery = require('../models/TopicMastery');

// Spaced repetition intervals in days
const INTERVALS = [1, 3, 7, 14, 30];

/**
 * Generate a smart revision plan for today
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Revision plan
 */
const generateRevisionPlan = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get topics due for review
  const dueTopics = await TopicMastery.find({
    userId,
    attempts: { $gt: 0 },
    nextReviewDate: { $lte: tomorrow }
  }).sort({ nextReviewDate: 1 });

  // Get weak topics that need extra attention
  const weakTopics = await TopicMastery.find({
    userId,
    attempts: { $gt: 0 },
    accuracy: { $lt: 50 }
  }).sort({ accuracy: 1 });

  // Combine and deduplicate
  const topicMap = new Map();

  dueTopics.forEach(t => {
    topicMap.set(t.topicName, {
      topicName: t.topicName,
      accuracy: t.accuracy,
      confidenceScore: t.confidenceScore,
      trend: t.trend,
      reviewInterval: t.reviewInterval,
      priority: 'due',
      action: getReviewAction(t),
      estimatedMinutes: getEstimatedTime(t)
    });
  });

  weakTopics.forEach(t => {
    if (!topicMap.has(t.topicName)) {
      topicMap.set(t.topicName, {
        topicName: t.topicName,
        accuracy: t.accuracy,
        confidenceScore: t.confidenceScore,
        trend: t.trend,
        reviewInterval: t.reviewInterval,
        priority: 'weak',
        action: getReviewAction(t),
        estimatedMinutes: getEstimatedTime(t)
      });
    }
  });

  const plan = Array.from(topicMap.values());
  const totalMinutes = plan.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    date: today.toISOString().split('T')[0],
    totalTopics: plan.length,
    estimatedTotalMinutes: totalMinutes,
    topics: plan,
    message: generatePlanMessage(plan.length, totalMinutes)
  };
};

/**
 * Get recommended review action for a topic
 */
const getReviewAction = (topic) => {
  if (topic.accuracy < 30) {
    return 'Re-read study material, then take an easy quiz';
  } else if (topic.accuracy < 50) {
    return 'Review key concepts and take a practice quiz';
  } else if (topic.accuracy < 70) {
    return 'Take a medium-difficulty quiz to strengthen understanding';
  } else if (topic.trend === 'declining') {
    return 'Quick review — your performance has been dropping';
  } else {
    return 'Quick revision quiz to maintain mastery';
  }
};

/**
 * Estimate review time in minutes
 */
const getEstimatedTime = (topic) => {
  if (topic.accuracy < 30) return 20;
  if (topic.accuracy < 50) return 15;
  if (topic.accuracy < 70) return 10;
  return 5;
};

/**
 * Generate plan message
 */
const generatePlanMessage = (topicCount, minutes) => {
  if (topicCount === 0) {
    return 'No topics due for review today. Great job staying on top of your studies!';
  }
  if (minutes <= 15) {
    return `Quick session today: ${topicCount} topic(s), about ${minutes} minutes.`;
  }
  if (minutes <= 30) {
    return `Moderate session: ${topicCount} topic(s), about ${minutes} minutes. Stay focused!`;
  }
  return `Intensive session: ${topicCount} topic(s), about ${minutes} minutes. Take breaks between topics.`;
};

module.exports = {
  generateRevisionPlan
};
