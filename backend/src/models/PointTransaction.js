const mongoose = require('mongoose')

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['prayer', 'fasting', 'bible', 'church', 'goodDeed', 'other'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    awardedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
)

pointTransactionSchema.index({ user: 1, awardedAt: -1, _id: -1 })

module.exports = mongoose.model('PointTransaction', pointTransactionSchema)
