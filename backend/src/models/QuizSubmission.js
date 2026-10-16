const mongoose = require('mongoose')

const submissionAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, min: 0 },
    questionText: { type: String, required: true },
    selectedOptionIndex: { type: Number, required: true, min: -1 },
    selectedOption: { type: String, default: '' },
    correctOptionIndex: { type: Number, required: true, min: 0 },
    correctOption: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
)

const quizSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quizType: {
      type: String,
      enum: ['daily', 'weekly'],
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    attemptKey: { type: String, unique: true, sparse: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out'],
      default: 'completed',
      index: true,
    },
    answers: {
      type: [submissionAnswerSchema],
      required: true,
      default: [],
    },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

quizSubmissionSchema.index({ quizType: 1, quizId: 1, submittedAt: -1 })

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema)
