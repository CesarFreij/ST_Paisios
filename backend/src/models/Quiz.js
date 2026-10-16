const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema(
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
        validator: (options) => options.length === 4 && options.every((option) => option.length > 0),
        message: 'A quiz must have exactly four non-empty options.',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: Number.isInteger,
        message: 'The correct option index must be an integer from 0 to 3.',
      },
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

quizSchema.path('correctOptionIndex').validate(function (index) {
  return Number.isInteger(index) && index < this.options.length
}, 'The correct option index must refer to an existing option.')

module.exports = mongoose.model('Quiz', quizSchema)