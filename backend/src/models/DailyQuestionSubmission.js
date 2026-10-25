const mongoose = require('mongoose')

const dailyQuestionSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyQuestion',
      required: true,
      index: true,
    },
    localDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    selectedOption: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
)

dailyQuestionSubmissionSchema.index({ questionId: 1, submittedAt: -1 })
dailyQuestionSubmissionSchema.index(
  { userId: 1, localDate: 1 },
  {
    unique: true,
    partialFilterExpression: { localDate: { $type: 'string' } },
  }
)

module.exports = mongoose.model('DailyQuestionSubmission', dailyQuestionSubmissionSchema)
