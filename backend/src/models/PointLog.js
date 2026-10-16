const mongoose = require('mongoose')

const pointLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (amount) => Number.isFinite(amount) && amount !== 0,
        message: 'A point log amount must be a non-zero number.',
      },
    },
    type: {
      type: String,
      enum: ['prayer', 'fasting', 'bible', 'church', 'good_deed', 'achievement', 'perfect_month', 'quiz_weekly', 'quiz_daily', 'admin_gift', 'admin_deduction'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
)

pointLogSchema.index({ userId: 1, createdAt: -1, _id: -1 })

module.exports = mongoose.model('PointLog', pointLogSchema)
