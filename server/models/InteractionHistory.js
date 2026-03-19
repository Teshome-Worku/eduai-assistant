const mongoose = require('mongoose');

const interactionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  topicTag: {
    type: String,
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'unknown'],
    default: 'unknown'
  },
  responseTime: {
    type: Number,
    default: 0 // milliseconds
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  type: {
    type: String,
    enum: ['ask', 'summarize', 'compare', 'quiz'],
    default: 'ask'
  }
}, {
  timestamps: true
});

interactionHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InteractionHistory', interactionHistorySchema);
