const mongoose = require('mongoose')
const { actionPointDefaults } = require('../config/pointConfig')

const adminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    defaultPoints: {
      prayer: { type: Number, default: actionPointDefaults.prayer, min: 0, max: 1000 },
      fasting: { type: Number, default: actionPointDefaults.fasting, min: 0, max: 1000 },
      bible: { type: Number, default: actionPointDefaults.bible, min: 0, max: 1000 },
      church: { type: Number, default: actionPointDefaults.church, min: 0, max: 1000 },
      goodDeed: { type: Number, default: actionPointDefaults.goodDeed, min: 0, max: 1000 },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('AdminSettings', adminSettingsSchema)