const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    prayerPoints: { type: Number, default: 5, min: 0, max: 1000 },
    fastingPoints: { type: Number, default: 5, min: 0, max: 1000 },
    biblePoints: { type: Number, default: 10, min: 0, max: 1000 },
    churchPoints: { type: Number, default: 8, min: 0, max: 1000 },
    goodDeedPoints: { type: Number, default: 7, min: 0, max: 1000 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Settings', settingsSchema)