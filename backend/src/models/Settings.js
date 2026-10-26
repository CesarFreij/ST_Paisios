const mongoose = require('mongoose')
const { actionPointDefaults } = require('../config/pointConfig')

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    prayerPoints: { type: Number, default: actionPointDefaults.prayer, min: 0, max: 1000 },
    fastingPoints: { type: Number, default: actionPointDefaults.fasting, min: 0, max: 1000 },
    biblePoints: { type: Number, default: actionPointDefaults.bible, min: 0, max: 1000 },
    churchPoints: { type: Number, default: actionPointDefaults.church, min: 0, max: 1000 },
    goodDeedPoints: { type: Number, default: actionPointDefaults.goodDeed, min: 0, max: 1000 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Settings', settingsSchema)