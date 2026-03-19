const mongoose = require('mongoose');

const topicMasterySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topicName: {
    type: String,
    required: true,
    trim: true
  },
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  confidenceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  trend: {
    type: String,
    enum: ['improving', 'declining', 'stable'],
    default: 'stable'
  },
  recentResults: [{
    isCorrect: Boolean,
    timestamp: { type: Date, default: Date.now }
  }],
  nextReviewDate: {
    type: Date,
    default: Date.now
  },
  reviewInterval: {
    type: Number,
    default: 1 // days
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
topicMasterySchema.index({ userId: 1, topicName: 1 }, { unique: true });

module.exports = mongoose.model('TopicMastery', topicMasterySchema);
