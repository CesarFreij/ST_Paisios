const mongoose = require('mongoose')

const weeklyQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    question: { type: String, trim: true },
    options: {
      type: [{ type: String, required: true, trim: true }],
      required: true,
      validate: {
        validator: (options) => options.length === 4 && options.every((option) => option.length > 0),
        message: 'Each weekly quiz question must have four non-empty options.',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'The correct option index must be a whole number.' },
    },
    points: { type: Number, default: 1, min: 0 },
  },
  { _id: true }
)

weeklyQuestionSchema.pre('validate', function normalizeQuestionText() {
  this.questionText = (this.questionText || this.question || '').trim()
  this.question = this.questionText
})

const weeklyQuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    examDate: { type: Date, default: null },
    startTime: {
      type: String,
      default: '00:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must use 24-hour HH:mm format.'],
    },
    endTime: {
      type: String,
      default: '23:59',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must use 24-hour HH:mm format.'],
      validate: {
        validator(value) { return !this.startTime || value > this.startTime },
        message: 'End time must be after start time on the scheduled date.',
      },
    },
    questions: {
      type: [weeklyQuestionSchema],
      required: true,
      validate: { validator: (questions) => questions.length > 0, message: 'A weekly quiz must include at least one question.' },
    },
    totalPoints: { type: Number, default: 0, min: 0 },
    windowStart: { type: Date, default: null },
    windowEnd: { type: Date, default: null },
    durationMinutes: { type: Number, default: 10, min: 1, max: 240 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

weeklyQuizSchema.pre('validate', function validateWindow() {
  if (!this.windowStart && !this.examDate) {
    this.invalidate('windowStart', 'A quiz availability start date is required.')
  }
  if (!this.windowEnd && !this.examDate) {
    this.invalidate('windowEnd', 'A quiz availability end date is required.')
  }
  if (this.windowStart && this.windowEnd && this.windowEnd <= this.windowStart) {
    this.invalidate('windowEnd', 'The availability end must be after the start.')
  }
  if (!Number.isInteger(this.durationMinutes) || this.durationMinutes < 1 || this.durationMinutes > 240) {
    this.invalidate('durationMinutes', 'Duration must be between 1 and 240 minutes.')
  }
  this.totalPoints = (this.questions || []).reduce((total, question) => total + (question.points ?? 1), 0)
})

weeklyQuestionSchema.path('correctOptionIndex').validate(function (index) {
  return Number.isInteger(index) && index < this.options.length
}, 'The correct option index must refer to an existing option.')
weeklyQuestionSchema.path('points').validate(Number.isFinite, 'Question points must be a valid number.')

module.exports = mongoose.model('WeeklyQuiz', weeklyQuizSchema)