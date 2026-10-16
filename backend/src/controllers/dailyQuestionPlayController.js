const mongoose = require('mongoose')
const DailyQuestion = require('../models/DailyQuestion')
const DailyQuestionSubmission = require('../models/DailyQuestionSubmission')
const User = require('../models/User')
const PointLog = require('../models/PointLog')

const isLocalDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const findQuestionForDate = (questionId, localDate) => {
  const dayStart = new Date(`${localDate}T00:00:00.000Z`)
  const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const filter = {
    date: { $gte: dayStart, $lt: nextDayStart },
  }
  if (questionId) filter._id = questionId
  return DailyQuestion.findOne(filter).sort({ createdAt: -1 })
}

const getTodayDailyQuestion = async (req, res) => {
  const { localDate } = req.query
  if (!isLocalDate(localDate)) {
    return res.status(400).json({
      success: false,
      message: 'A valid localDate in YYYY-MM-DD format is required.',
    })
  }

  try {
    const [question, user] = await Promise.all([
      findQuestionForDate(null, localDate).select('question options points'),
      User.findById(req.user._id).select('lastDailyQuestionDate answeredDailyQuestionToday'),
    ])

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const hasAnsweredToday = user.lastDailyQuestionDate === localDate
    if (user.answeredDailyQuestionToday && !hasAnsweredToday) {
      await User.updateOne(
        {
          _id: user._id,
          lastDailyQuestionDate: { $ne: localDate },
          answeredDailyQuestionToday: true,
        },
        { $set: { answeredDailyQuestionToday: false } }
      )
    }

    return res.status(200).json({
      success: true,
      data: {
        question: question
          ? {
              id: question._id,
              question: question.question,
              options: question.options,
              points: question.points ?? 1,
            }
          : null,
        hasAnsweredToday,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch today’s daily question.' })
  }
}

const submitDailyQuestion = async (req, res) => {
  const { questionId, selectedOption, localDate } = req.body || {}
  if (
    !mongoose.isValidObjectId(questionId) ||
    !isLocalDate(localDate) ||
    !Number.isInteger(selectedOption) ||
    selectedOption < 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'A valid questionId, selectedOption, and localDate are required.',
    })
  }

  const session = await mongoose.startSession()
  try {
    const question = await findQuestionForDate(questionId, localDate)
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'The daily question for this local date was not found.',
      })
    }
    if (selectedOption >= question.options.length) {
      return res.status(400).json({ success: false, message: 'The selected option is invalid.' })
    }

    const isCorrect = selectedOption === question.correctOptionIndex
    const awardedPoints = isCorrect ? question.points ?? 1 : 0
    let user
    let submittedAt
    await session.withTransaction(async () => {
      user = await User.findOne(
        { _id: req.user._id, lastDailyQuestionDate: { $ne: localDate } },
      ).session(session)

      if (!user) {
        const error = new Error('You have already answered today’s daily question.')
        error.code = 'DAILY_QUESTION_ALREADY_ANSWERED'
        throw error
      }

      user.initializePointTotals()
      user.lastDailyQuestionDate = localDate
      user.answeredDailyQuestionToday = true
      if (isCorrect) {
        user.totalEarnedPoints += awardedPoints
        user.quizPoints += awardedPoints
        user.pointNotifications.push({
          amount: awardedPoints,
          isPositive: true,
          isRead: false,
          createdAt: new Date(),
        })
      }
      await user.save({ session })

      submittedAt = new Date()
      await DailyQuestionSubmission.create([{
        userId: req.user._id,
        questionId: question._id,
        selectedOption: question.options[selectedOption],
        isCorrect,
        pointsEarned: awardedPoints,
        submittedAt,
      }], { session })
      if (awardedPoints > 0) {
        await PointLog.create([{
          userId: user._id,
          amount: awardedPoints,
          type: 'quiz_daily',
          description: 'سؤال يومي',
          createdAt: submittedAt,
        }], { session })
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        isCorrect,
        awardedPoints,
        totalPoints: user.totalPoints ?? 0,
        quizPoints: user.quizPoints ?? 0,
        submittedAt,
      },
    })
  } catch (error) {
    if (error.code === 'DAILY_QUESTION_ALREADY_ANSWERED' || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already answered today’s daily question.',
      })
    }
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to submit the daily question.' })
  } finally {
    await session.endSession()
  }
}

module.exports = { getTodayDailyQuestion, submitDailyQuestion }
