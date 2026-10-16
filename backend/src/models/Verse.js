const mongoose = require('mongoose')

const verseSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['cyclic', 'scheduled'],
      default: 'cyclic',
      required: true,
    },
    scheduledDate: {
      type: String,
      required() {
        return this.type === 'scheduled'
      },
      validate: {
        validator(value) {
          if (value == null) return this.type !== 'scheduled'
          const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
          if (!match) return false
          const [, year, month, day] = match.map(Number)
          const date = new Date(Date.UTC(year, month - 1, day))
          return date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1
            && date.getUTCDate() === day
        },
        message: 'scheduledDate must be a valid YYYY-MM-DD date.',
      },
    },
    order: {
      type: Number,
      min: 0,
    },
    // Keep the previous fields readable while existing verse records are migrated.
    isSpecificDate: {
      type: Boolean,
      select: false,
    },
    specificDate: {
      type: Date,
      select: false,
    },
    orderIndex: {
      type: Number,
      min: 0,
      select: false,
    },
  },
  { timestamps: true }
)

verseSchema.index(
  { scheduledDate: 1 },
  { unique: true, partialFilterExpression: { type: 'scheduled' } }
)
verseSchema.index({ type: 1, order: 1, createdAt: 1 })

module.exports = mongoose.model('Verse', verseSchema)
