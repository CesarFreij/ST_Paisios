const Quiz = require('../models/Quiz')
const { getPagination, paginationMetadata } = require('../utils/pagination')

const normalizeQuiz = (quiz) => {
  const legacyQuestion = quiz.questions?.[0] || {}
  return {
    ...quiz,
    question: quiz.question || legacyQuestion.question || quiz.title || '',
    options: quiz.options || legacyQuestion.options || [],
    correctOptionIndex: quiz.correctOptionIndex ?? legacyQuestion.correctOptionIndex ?? 0,
    date: quiz.date || quiz.createdAt,
  }
}

const getQuizzes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const [quizzes, totalItems] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Quiz.countDocuments(),
    ])
    return res.status(200).json({
      success: true,
      data: quizzes.map(normalizeQuiz),
      pagination: paginationMetadata(totalItems, page, limit),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch quizzes.' })
  }
}

const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).lean()
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    return res.status(200).json({ success: true, data: normalizeQuiz(quiz) })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid quiz ID.' })
  }
}

const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({
      question: req.body.question,
      options: req.body.options,
      correctOptionIndex: req.body.correctOptionIndex,
      date: req.body.date,
    })
    return res.status(201).json({ success: true, data: quiz })
  } catch (error) {
    console.error(error)
    const status = error.name === 'ValidationError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to create quiz.' })
  }
}

const updateQuiz = async (req, res) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) =>
        ['question', 'options', 'correctOptionIndex', 'date'].includes(field)
      )
    )
    const quiz = await Quiz.findByIdAndUpdate(req.params.quizId, updates, {
      returnDocument: 'after',
      runValidators: true,
    })
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    return res.status(200).json({ success: true, data: quiz })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Failed to update quiz.' })
  }
}

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.quizId)
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    return res.status(200).json({ success: true, message: 'Quiz deleted.' })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid quiz ID.' })
  }
}

module.exports = { getQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz }