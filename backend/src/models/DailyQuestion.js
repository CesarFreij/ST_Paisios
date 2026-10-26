const mongoose = require('mongoose')
const { dailyQuestionDefaultPoints } = require('../config/pointConfig')

const dailyQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator: (options) => options.length >= 2 && options.every((option) => option.length > 0),
        message: 'A daily question must have at least two non-empty options.',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'The correct option index must be a whole number.',
      },
    },
    points: {
      type: Number,
      default: dailyQuestionDefaultPoints,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Daily question points must be a whole number.',
      },
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

dailyQuestionSchema.path('correctOptionIndex').validate(function (index) {
  return Number.isInteger(index) && index < this.options.length
}, 'The correct option index must refer to an existing option.')

module.exports = mongoose.model('DailyQuestion', dailyQuestionSchema)