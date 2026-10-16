const mongoose = require('mongoose')

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    prayerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fastingCount: {
      type: Number,
      default: 0,
    },
    bibleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    churchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    goodDeedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    calendarLogs: {
      type: new mongoose.Schema(
        {
          prayerDays: {
            type: [{ type: String, match: /^\d{4}-\d{2}-\d{2}$/ }],
            default: [],
          },
          bibleDays: {
            type: [{ type: String, match: /^\d{4}-\d{2}-\d{2}$/ }],
            default: [],
          },
        },
        { _id: false, strict: true }
      ),
      default: () => ({}),
    },
    lastActionDates: {
      prayerCount: { type: String, default: null },
      fastingCount: { type: String, default: null },
      bibleCount: { type: String, default: null },
      churchCount: { type: String, default: null },
      goodDeedCount: { type: String, default: null },
    },
    achievements: {
      prayerAchievedLevel: { type: Number, default: 0, min: 0, max: 3 },
      fastingAchievedLevel: { type: Number, default: 0, min: 0, max: 3 },
      bibleAchievedLevel: { type: Number, default: 0, min: 0, max: 3 },
      churchAchievedLevel: { type: Number, default: 0, min: 0, max: 3 },
      goodDeedAchievedLevel: { type: Number, default: 0, min: 0, max: 3 },
      perfectDayAchievedLevel: { type: Number, default: 0, min: 0, max: 3 },
    },
    achievementCounts: {
      prayer: { type: Number, default: 0, min: 0 },
      fasting: { type: Number, default: 0, min: 0 },
      bible: { type: Number, default: 0, min: 0 },
      church: { type: Number, default: 0, min: 0 },
      goodDeed: { type: Number, default: 0, min: 0 },
    },
    perfectDaysCount: { type: Number, default: 0, min: 0 },
    claimedPerfectMonths: {
      type: [
        new mongoose.Schema(
          {
            actionType: { type: String, enum: ['prayer', 'bible'], required: true },
            monthYear: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Progress', progressSchema)