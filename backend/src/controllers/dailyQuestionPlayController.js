const mongoose = require('mongoose')
const DailyQuestion = require('../models/DailyQuestion')
const DailyQuestionSubmission = require('../models/DailyQuestionSubmission')
const User = require('../models/User')
const PointLog = require('../models/PointLog')
const { dailyQuestionDefaultPoints } = require('../config/pointConfig')

const DAILY_QUESTION_TIME_ZONE = 'Asia/Damascus'

const getCurrentLocalDate = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_QUESTION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
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
  console.log('Received request with query:', req.query)
  const requestedUserId = req.query.user_id ?? req.query.userId
  if (typeof requestedUserId !== 'string' || !requestedUserId.trim()) {
    return res.status(400).json({
      success: false,
      message: 'A user_id query parameter is required.',
    })
  }
  if (!req.user?._id) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' })
  }
  if (requestedUserId.trim() !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'The requested user does not match the authenticated user.' })
  }

  const localDate = getCurrentLocalDate()
  try {
    const question = await findQuestionForDate(null, localDate).select('question options points')
    if (!question) {
      return res.status(200).json({
        has_answered_today: false,
        question: null,
      })
    }

    const [user, submission] = await Promise.all([
      User.findById(req.user._id).select('lastDailyQuestionDate answeredDailyQuestionToday'),
      DailyQuestionSubmission.findOne({ userId: req.user._id, localDate }).select('_id').lean(),
    ])

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const hasAnsweredToday = Boolean(submission) || user.lastDailyQuestionDate === localDate
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
      has_answered_today: hasAnsweredToday,
      question: hasAnsweredToday
        ? null
        : {
            id: question._id,
            question: question.question,
            options: question.options,
            points: question.points ?? dailyQuestionDefaultPoints,
          },
      localDate,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch today’s daily question.' })
  }
}

const submitDailyQuestion = async (req, res) => {
  const { questionId, selectedOption, expectedPoints } = req.body || {}
  const localDate = getCurrentLocalDate()
  if (
    !mongoose.isValidObjectId(questionId) ||
    !Number.isInteger(selectedOption) ||
    selectedOption < 0 ||
    (expectedPoints !== undefined && (!Number.isSafeInteger(expectedPoints) || expectedPoints < 0))
  ) {
    return res.status(400).json({
      success: false,
      message: 'A valid questionId and selectedOption are required.',
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
    if (
      expectedPoints !== undefined &&
      expectedPoints !== (question.points ?? dailyQuestionDefaultPoints)
    ) {
      return res.status(409).json({
        success: false,
        code: 'POINT_SETTINGS_CHANGED',
        message: 'تم تحديث مكافأة السؤال. أعد المحاولة بالقيمة الجديدة.',
      })
    }
    if (selectedOption >= question.options.length) {
      return res.status(400).json({ success: false, message: 'The selected option is invalid.' })
    }

    const isCorrect = selectedOption === question.correctOptionIndex
    const awardedPoints = isCorrect
      ? question.points ?? dailyQuestionDefaultPoints
      : 0
    let user
    let submittedAt
    await session.withTransaction(async () => {
      const existingSubmission = await DailyQuestionSubmission.findOne({
        userId: req.user._id,
        localDate,
      }).select('_id').session(session).lean()
      if (existingSubmission) {
        const error = new Error('You have already answered today’s daily question.')
        error.code = 'DAILY_QUESTION_ALREADY_ANSWERED'
        throw error
      }

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
        user.maxPoints = Math.max(
          user.maxPoints || 0,
          user.totalEarnedPoints - user.totalDeductedPoints
        )
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
        localDate,
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

    const updatedPoints = user.totalPoints ?? 0
    return res.status(200).json({
      success: true,
      is_correct: isCorrect,
      updated_points: updatedPoints,
      data: {
        isCorrect,
        awardedPoints,
        totalPoints: updatedPoints,
        maxPoints: user.maxPoints,
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
