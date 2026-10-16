const mongoose = require('mongoose')

const adminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    defaultPoints: {
      prayer: { type: Number, default: 5, min: 0, max: 1000 },
      fasting: { type: Number, default: 5, min: 0, max: 1000 },
      bible: { type: Number, default: 10, min: 0, max: 1000 },
      church: { type: Number, default: 8, min: 0, max: 1000 },
      goodDeed: { type: Number, default: 7, min: 0, max: 1000 },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('AdminSettings', adminSettingsSchema)