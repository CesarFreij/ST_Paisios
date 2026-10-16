const WeeklyQuiz = require('../models/WeeklyQuiz')
const User = require('../models/User')
const QuizSubmission = require('../models/QuizSubmission')
const PointTransaction = require('../models/PointTransaction')
const PointLog = require('../models/PointLog')
const mongoose = require('mongoose')
const { getPagination, paginationMetadata } = require('../utils/pagination')

const resolveWindow = (quiz) => {
  if (quiz.windowStart && quiz.windowEnd) {
    return { windowStart: new Date(quiz.windowStart), windowEnd: new Date(quiz.windowEnd) }
  }

  const windowStart = new Date(quiz.examDate)
  const [startHour, startMinute] = (quiz.startTime || '00:00').split(':').map(Number)
  windowStart.setHours(startHour, startMinute, 0, 0)
  const windowEnd = new Date(quiz.examDate)
  const [endHour, endMinute] = (quiz.endTime || '23:59').split(':').map(Number)
  windowEnd.setHours(endHour, endMinute, 59, 999)
  return { windowStart, windowEnd }
}

const publicQuizSummary = (quiz) => {
  const { windowStart, windowEnd } = resolveWindow(quiz)
  return {
    id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    totalQuestions: quiz.questions.length,
    totalPoints: quiz.totalPoints ?? quiz.questions.reduce((sum, question) => sum + (question.points ?? 1), 0),
    durationMinutes: quiz.durationMinutes ?? 10,
    windowStart,
    windowEnd,
    isActive: quiz.isActive !== false,
  }
}

const getQuizForAttempt = async (quizId) => {
  if (!mongoose.isValidObjectId(quizId)) return null
  return WeeklyQuiz.findById(quizId)
}

const getWeeklyQuizzes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const [quizzes, totalItems] = await Promise.all([
      WeeklyQuiz.find().sort({ windowStart: 1, examDate: 1, startTime: 1 }).skip(skip).limit(limit).lean(),
      WeeklyQuiz.countDocuments(),
    ])
    return res.status(200).json({
      success: true,
      data: quizzes,
      pagination: paginationMetadata(totalItems, page, limit),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch weekly quizzes.' })
  }
}

const getCurrentQuiz = async (req, res) => {
  try {
    const serverNow = new Date()
    const quizzes = await WeeklyQuiz.find({ isActive: { $ne: false } })
      .sort({ windowStart: 1, examDate: 1, createdAt: -1 })
      .lean()
    const candidates = quizzes.map((quiz) => ({
      quiz,
      ...resolveWindow(quiz),
    }))
    const selected = candidates.find(({ windowEnd }) => windowEnd >= serverNow)
      || candidates.filter(({ windowEnd }) => windowEnd < serverNow).at(-1)

    if (!selected) {
      return res.status(200).json({ success: true, data: { quiz: null, submission: null, serverNow } })
    }

    const submission = await QuizSubmission.findOne({
      user: req.user._id,
      quizType: 'weekly',
      quizId: selected.quiz._id,
    }).sort({ createdAt: -1 }).lean()

    return res.status(200).json({
      success: true,
      data: {
        quiz: publicQuizSummary(selected.quiz),
        submission: submission ? {
          id: submission._id,
          status: submission.status,
          score: submission.score,
          maxScore: submission.maxScore,
          totalQuestions: submission.totalQuestions || selected.quiz.questions.length,
          submittedAt: submission.submittedAt,
          startedAt: submission.startedAt,
        } : null,
        serverNow,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch current weekly quiz.' })
  }
}

const getQuizHistory = async (req, res) => {
  try {
    const parsedPage = Number.parseInt(req.query.page, 10)
    const parsedLimit = Number.parseInt(req.query.limit, 10)
    const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20
    const skip = (currentPage - 1) * limit
    const filter = {
      user: req.user._id,
      quizType: 'weekly',
      $or: [
        { status: { $in: ['completed', 'timed_out'] } },
        { status: { $exists: false } },
      ],
    }
    const [submissions, totalCount] = await Promise.all([
      QuizSubmission.find(filter)
        .sort({ submittedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuizSubmission.countDocuments(filter),
    ])
    const quizIds = [...new Set(submissions.map((submission) => submission.quizId.toString()))]
    const quizzes = await WeeklyQuiz.find({ _id: { $in: quizIds } }).select('title').lean()
    const quizTitles = new Map(quizzes.map((quiz) => [quiz._id.toString(), quiz.title]))
    const totalPages = Math.ceil(totalCount / limit)

    return res.status(200).json({
      success: true,
      data: {
        submissions: submissions.map((submission) => ({
          id: submission._id,
          quizId: submission.quizId,
          title: quizTitles.get(submission.quizId.toString()) || 'اختبار أسبوعي',
          score: submission.score,
          maxScore: submission.maxScore,
          totalQuestions: submission.totalQuestions ?? submission.answers?.length ?? submission.maxScore,
          submittedAt: submission.submittedAt,
          status: submission.status,
        })),
        currentPage,
        totalPages,
        hasMore: currentPage < totalPages,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch weekly quiz history.' })
  }
}

const startQuiz = async (req, res) => {
  try {
    const quiz = await getQuizForAttempt(req.params.quizId)
    if (!quiz || quiz.isActive === false) {
      return res.status(404).json({ success: false, message: 'Weekly quiz not found or inactive.' })
    }

    const now = new Date()
    const { windowStart, windowEnd } = resolveWindow(quiz)
    const existing = await QuizSubmission.findOne({
      user: req.user._id,
      quizType: 'weekly',
      quizId: quiz._id,
    }).sort({ createdAt: -1 })
    if (
      (now < windowStart || now > windowEnd) &&
      (!existing || existing.status !== 'in_progress')
    ) {
      return res.status(409).json({ success: false, message: 'The quiz is not currently available.' })
    }
    if (existing && existing.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted this quiz.',
        data: { status: existing.status, score: existing.score, maxScore: existing.maxScore },
      })
    }

    const submission = existing || await QuizSubmission.create({
      user: req.user._id,
      quizType: 'weekly',
      quizId: quiz._id,
      attemptKey: `weekly:${quiz._id}:${req.user._id}`,
      score: 0,
      maxScore: quiz.totalPoints ?? quiz.questions.reduce((sum, question) => sum + (question.points ?? 1), 0),
      percentage: 0,
      totalQuestions: quiz.questions.length,
      startedAt: now,
      status: 'in_progress',
      answers: [],
    })
    const startedAt = submission.startedAt || now
    const expiresAt = new Date(Math.min(
      startedAt.getTime() + (quiz.durationMinutes ?? 10) * 60 * 1000,
      windowEnd.getTime()
    ))

    return res.status(200).json({
      success: true,
      data: {
        submissionId: submission._id,
        startedAt,
        serverNow: now,
        expiresAt,
        quiz: {
          ...publicQuizSummary(quiz.toObject()),
          questions: quiz.questions.map((question) => ({
            questionText: question.questionText || question.question,
            options: question.options,
            points: question.points ?? 1,
          })),
        },
      },
    })
  } catch (error) {
    console.error(error)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An attempt for this quiz has already started.' })
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid weekly quiz.' })
    }
    return res.status(500).json({ success: false, message: 'Failed to start weekly quiz.' })
  }
}

const submitQuiz = async (req, res) => {
  const session = await mongoose.startSession()
  try {
    const quiz = await getQuizForAttempt(req.params.quizId)
    if (!quiz) return res.status(404).json({ success: false, message: 'Weekly quiz not found.' })

    const submissionId = req.body?.submissionId
    if (!mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({ success: false, message: 'A valid submission ID is required.' })
    }
    const answers = req.body?.answers
    if (
      !Array.isArray(answers) ||
      answers.length > quiz.questions.length ||
      answers.some((answer, index) =>
        answer !== null && answer !== undefined &&
        (!Number.isInteger(answer) || answer < 0 || answer >= quiz.questions[index].options.length)
      )
    ) {
      return res.status(400).json({ success: false, message: 'Answers must contain valid option indexes or null.' })
    }

    let result
    await session.withTransaction(async () => {
      const submission = await QuizSubmission.findOne({
        _id: submissionId,
        user: req.user._id,
        quizType: 'weekly',
        quizId: quiz._id,
        status: 'in_progress',
      }).session(session)
      if (!submission) {
        const error = new Error('This quiz attempt is missing or already submitted.')
        error.code = 'ATTEMPT_NOT_ACTIVE'
        throw error
      }

      const now = new Date()
      const { windowEnd } = resolveWindow(quiz)
      const expiresAt = new Date(Math.min(
        submission.startedAt.getTime() + (quiz.durationMinutes ?? 10) * 60 * 1000,
        windowEnd.getTime()
      ))
      const status = now >= expiresAt ? 'timed_out' : 'completed'
      const details = quiz.questions.map((question, index) => {
        const selectedOptionIndex = answers[index] ?? -1
        const isAnswered = selectedOptionIndex >= 0
        const correctOptionIndex = question.correctOptionIndex
        const isCorrect = isAnswered && selectedOptionIndex === correctOptionIndex
        const questionText = question.questionText || question.question
        return {
          questionIndex: index,
          questionText,
          selectedOptionIndex,
          selectedOption: isAnswered ? question.options[selectedOptionIndex] : '',
          correctOptionIndex,
          correctOption: question.options[correctOptionIndex],
          isCorrect,
          pointsAwarded: isCorrect ? question.points ?? 1 : 0,
        }
      })
      const score = details.reduce((total, answer) => total + answer.pointsAwarded, 0)
      const maxScore = quiz.totalPoints ?? quiz.questions.reduce((total, question) => total + (question.points ?? 1), 0)
      const totalQuestions = quiz.questions.length
      submission.answers = details
      submission.score = score
      submission.maxScore = maxScore
      submission.totalQuestions = totalQuestions
      submission.percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
      submission.status = status
      submission.submittedAt = now
      await submission.save({ session })

      const user = await User.findById(req.user._id).session(session)
      if (!user) {
        const error = new Error('User not found.')
        error.code = 'USER_NOT_FOUND'
        throw error
      }
      if (score > 0) {
        user.initializePointTotals()
        user.totalEarnedPoints += score
        user.quizPoints = (user.quizPoints ?? 0) + score
        await user.save({ session })
        await PointTransaction.create([{
          user: user._id,
          source: 'other',
          points: score,
          awardedAt: now,
        }], { session })
        await PointLog.create([{
          userId: user._id,
          amount: score,
          type: 'quiz_weekly',
          description: 'اختبار أسبوعي',
          createdAt: now,
        }], { session })
      }
      result = {
        submission: submission.toObject(),
        totalPoints: user.totalPoints,
        quizPoints: user.quizPoints ?? 0,
      }
    })

    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    if (error.code === 'ATTEMPT_NOT_ACTIVE') {
      return res.status(409).json({ success: false, message: error.message })
    }
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to submit weekly quiz.' })
  } finally {
    await session.endSession()
  }
}

const getAdminQuizzes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const [quizzes, totalItems] = await Promise.all([
      WeeklyQuiz.find().sort({ windowStart: -1, examDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      WeeklyQuiz.countDocuments(),
    ])
    const quizIds = quizzes.map((quiz) => quiz._id)
    const submissions = await QuizSubmission.find({ quizType: 'weekly', quizId: { $in: quizIds } })
      .populate('user', 'username title')
      .sort({ submittedAt: -1, _id: -1 })
      .lean()
    const byQuiz = new Map()
    for (const submission of submissions) {
      const key = submission.quizId.toString()
      if (!byQuiz.has(key)) byQuiz.set(key, [])
      byQuiz.get(key).push(submission)
    }

    return res.status(200).json({
      success: true,
      data: quizzes.map((quiz) => ({
        ...quiz,
        ...resolveWindow(quiz),
        submissions: byQuiz.get(quiz._id.toString()) || [],
      })),
      pagination: paginationMetadata(totalItems, page, limit),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch weekly quizzes and results.' })
  }
}

const createWeeklyQuiz = async (req, res) => {
  try {
    if (
      !Array.isArray(req.body?.questions) ||
      req.body.questions.length === 0 ||
      req.body.questions.some((question) => !question || typeof question !== 'object' || Array.isArray(question))
    ) {
      return res.status(400).json({ success: false, message: 'At least one quiz question is required.' })
    }
    const questions = req.body.questions.map((question) => ({
      ...question,
      questionText: question.questionText || question.question,
    }))
    const quiz = await WeeklyQuiz.create({
      title: req.body.title,
      description: req.body.description,
      windowStart: req.body.windowStart,
      windowEnd: req.body.windowEnd,
      durationMinutes: req.body.durationMinutes ?? 10,
      isActive: req.body.isActive ?? true,
      examDate: req.body.examDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      questions,
    })
    return res.status(201).json({ success: true, data: quiz })
  } catch (error) {
    console.error(error)
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to create weekly quiz.' })
  }
}

const updateWeeklyQuiz = async (req, res) => {
  try {
    if (
      req.body?.questions !== undefined &&
      (
        !Array.isArray(req.body.questions) ||
        req.body.questions.length === 0 ||
        req.body.questions.some((question) => !question || typeof question !== 'object' || Array.isArray(question))
      )
    ) {
      return res.status(400).json({ success: false, message: 'Questions must be a non-empty array.' })
    }
    const quiz = await WeeklyQuiz.findById(req.params.quizId)
    if (!quiz) return res.status(404).json({ success: false, message: 'Weekly quiz not found.' })

    const allowedFields = ['title', 'description', 'examDate', 'startTime', 'endTime', 'questions', 'windowStart', 'windowEnd', 'durationMinutes', 'isActive']
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        quiz[field] = field === 'questions'
          ? req.body[field].map((question) => ({ ...question, questionText: question.questionText || question.question }))
          : req.body[field]
      }
    }
    await quiz.save()
    return res.status(200).json({ success: true, data: quiz })
  } catch (error) {
    console.error(error)
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to update weekly quiz.' })
  }
}

const deleteWeeklyQuiz = async (req, res) => {
  try {
    const quiz = await WeeklyQuiz.findByIdAndDelete(req.params.quizId)
    if (!quiz) return res.status(404).json({ success: false, message: 'Weekly quiz not found.' })
    return res.status(200).json({ success: true, message: 'Weekly quiz deleted.' })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid weekly quiz ID.' })
  }
}

module.exports = {
  getWeeklyQuizzes,
  getCurrentQuiz,
  getQuizHistory,
  startQuiz,
  submitQuiz,
  getAdminQuizzes,
  createWeeklyQuiz,
  updateWeeklyQuiz,
  deleteWeeklyQuiz,
}