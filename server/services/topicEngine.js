const TopicMastery = require('../models/TopicMastery');
const { extractTopics } = require('./geminiService');

/**
 * Extract topics from document text and create mastery entries
 * @param {string} text - Document text content
 * @returns {Promise<Array>} Extracted topics
 */
const extractTopicsFromText = async (text) => {
  const topics = await extractTopics(text);
  return topics;
};

/**
 * Initialize mastery records for extracted topics
 * @param {string} userId - User ID
 * @param {Array} topics - Array of { name, subtopics }
 */
const initializeMasteryForTopics = async (userId, topics) => {
  const operations = [];

  for (const topic of topics) {
    // Create main topic mastery
    operations.push({
      updateOne: {
        filter: { userId, topicName: topic.name },
        update: {
          $setOnInsert: {
            userId,
            topicName: topic.name,
            accuracy: 0,
            attempts: 0,
            correctAnswers: 0,
            confidenceScore: 0,
            trend: 'stable',
            recentResults: [],
            nextReviewDate: new Date(),
            reviewInterval: 1,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    });

    // Create subtopic mastery entries
    if (topic.subtopics && topic.subtopics.length > 0) {
      for (const subtopic of topic.subtopics) {
        operations.push({
          updateOne: {
            filter: { userId, topicName: subtopic },
            update: {
              $setOnInsert: {
                userId,
                topicName: subtopic,
                accuracy: 0,
                attempts: 0,
                correctAnswers: 0,
                confidenceScore: 0,
                trend: 'stable',
                recentResults: [],
                nextReviewDate: new Date(),
                reviewInterval: 1,
                lastUpdated: new Date()
              }
            },
            upsert: true
          }
        });
      }
    }
  }

  if (operations.length > 0) {
    await TopicMastery.bulkWrite(operations);
  }
};

/**
 * Get all topics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's topics with mastery
 */
const getUserTopics = async (userId) => {
  return await TopicMastery.find({ userId }).sort({ topicName: 1 });
};

module.exports = {
  extractTopicsFromText,
  initializeMasteryForTopics,
  getUserTopics
};
