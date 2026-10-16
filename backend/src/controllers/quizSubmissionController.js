const mongoose = require('mongoose')
const DailyQuestion = require('../models/DailyQuestion')
const WeeklyQuiz = require('../models/WeeklyQuiz')
const QuizSubmission = require('../models/QuizSubmission')
const { getPagination, paginationMetadata } = require('../utils/pagination')

const getQuizQuestions = async (quizType, quizId) => {
  if (quizType === 'daily') {
    const quiz = await DailyQuestion.findById(quizId).lean()
    return quiz ? { quiz, questions: [quiz] } : null
  }

  if (quizType === 'weekly') {
    const quiz = await WeeklyQuiz.findById(quizId).lean()
    return quiz ? { quiz, questions: quiz.questions || [] } : null
  }

  return null
}

const createSubmission = async (req, res) => {
  try {
    const { quizType, quizId, answers } = req.body || {}
    if (!['daily', 'weekly'].includes(quizType) || !mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz type or ID.' })
    }
    if (quizType === 'weekly') {
      return res.status(400).json({
        success: false,
        message: 'Weekly quizzes must be started and submitted through the timed quiz endpoints.',
      })
    }

    const quizResult = await getQuizQuestions(quizType, quizId)
    if (!quizResult) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    if (
      !Array.isArray(answers)
      || answers.length !== quizResult.questions.length
      || answers.some((index, questionIndex) =>
        !Number.isInteger(index)
        || index < 0
        || index >= quizResult.questions[questionIndex].options.length
      )
    ) {
      return res.status(400).json({ success: false, message: 'Provide a valid answer for every question.' })
    }

    const breakdown = quizResult.questions.map((question, index) => {
      const selectedOptionIndex = answers[index]
      const correctOptionIndex = Number(question.correctOptionIndex)
      return {
        questionText: question.questionText || question.question,
        selectedOptionIndex,
        selectedOption: question.options[selectedOptionIndex],
        correctOptionIndex,
        correctOption: question.options[correctOptionIndex],
        isCorrect: selectedOptionIndex === correctOptionIndex,
      }
    })
    const score = breakdown.filter((answer) => answer.isCorrect).length
    const submission = await QuizSubmission.create({
      user: req.user._id,
      quizType,
      quizId,
      score,
      maxScore: breakdown.length,
      percentage: Math.round((score / breakdown.length) * 100),
      answers: breakdown,
      totalQuestions: breakdown.length,
      status: 'completed',
      submittedAt: new Date(),
    })

    return res.status(201).json({ success: true, data: submission })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to save quiz submission.' })
  }
}

const getSubmissions = async (req, res) => {
  try {
    const { quizType, quizId } = req.params
    if (!['daily', 'weekly'].includes(quizType) || !mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz type or ID.' })
    }

    const quizResult = await getQuizQuestions(quizType, quizId)
    if (!quizResult) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' })
    }

    const { page, limit, skip } = getPagination(req.query)
    const filter = { quizType, quizId }
    const [submissions, totalItems] = await Promise.all([
      QuizSubmission.find(filter)
        .populate('user', 'username title')
        .sort({ submittedAt: -1, startedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select('user quizId score maxScore percentage answers totalQuestions startedAt submittedAt status')
        .lean(),
      QuizSubmission.countDocuments(filter),
    ])

    return res.status(200).json({
      success: true,
      data: submissions,
      quiz: {
        title: quizType === 'weekly' ? quizResult.quiz.title : quizResult.quiz.question,
        date: quizType === 'weekly' ? (quizResult.quiz.windowStart || quizResult.quiz.examDate) : quizResult.quiz.date,
      },
      pagination: paginationMetadata(totalItems, page, limit),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch quiz submissions.' })
  }
}

module.exports = { createSubmission, getSubmissions }
