const mongoose = require('mongoose')

const achievementProgressEntrySchema = new mongoose.Schema(
  {
    currentValue: { type: Number, default: 0, min: 0 },
    currentTier: { type: Number, default: 0, min: 0, max: 3 },
  },
  { _id: false }
)

const achievementsProgressSchema = new mongoose.Schema(
  {
    prayer: { type: achievementProgressEntrySchema, default: () => ({}) },
    fasting: { type: achievementProgressEntrySchema, default: () => ({}) },
    bible: { type: achievementProgressEntrySchema, default: () => ({}) },
    church: { type: achievementProgressEntrySchema, default: () => ({}) },
    goodDeed: { type: achievementProgressEntrySchema, default: () => ({}) },
    perfectDay: { type: achievementProgressEntrySchema, default: () => ({}) },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    password: {
      type: String,
      required: true,
    },
    expoPushToken: {
      type: String,
      default: null,
      select: false,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    maxPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    hasUnseenPointsUpdate: {
      type: Boolean,
      default: false,
    },
    unseenPointsDifference: {
      type: Number,
      default: 0,
    },
    totalEarnedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeductedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizPoints: {
      type: Number,
      default: 0,
    },
    lastDailyQuestionDate: {
      type: String,
      default: '',
    },
    answeredDailyQuestionToday: {
      type: Boolean,
      default: false,
    },
    extraPoints: {
      type: Number,
      default: 0,
    },
    achievementsProgress: {
      type: achievementsProgressSchema,
      default: () => ({}),
    },
    pointNotifications: {
      type: [
        new mongoose.Schema(
          {
            amount: { type: Number, required: true },
            isPositive: { type: Boolean, required: true },
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    title: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
)

userSchema.methods.initializePointTotals = function initializePointTotals() {
  if (this.$isDefault('totalEarnedPoints') && this.$isDefault('totalDeductedPoints')) {
    const legacyTotal = Number(this.totalPoints) || 0
    this.totalEarnedPoints = Math.max(legacyTotal, 0)
    this.totalDeductedPoints = Math.max(-legacyTotal, 0)
  }
}

userSchema.pre('validate', function keepPointTotalsConsistent() {
  this.initializePointTotals()
  this.totalPoints = this.totalEarnedPoints - this.totalDeductedPoints
  this.maxPoints = Math.max(this.maxPoints ?? 0, this.totalPoints, 0)
})

userSchema.post('init', function initializeMissingMaxPoints() {
  if (this.$isDefault('maxPoints')) {
    // Keep annual-track progress earned before maxPoints was introduced.
    this.maxPoints = Math.max(this.totalEarnedPoints ?? 0, this.totalPoints ?? 0, 0)
  }
})

module.exports = mongoose.model('User', userSchema)
