const DailyQuestion = require('../models/DailyQuestion')
const DailyQuestionSubmission = require('../models/DailyQuestionSubmission')
const mongoose = require('mongoose')
const { getPagination, paginationMetadata } = require('../utils/pagination')

const getDailyQuestions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const [questions, totalItems] = await Promise.all([
      DailyQuestion.find().sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      DailyQuestion.countDocuments(),
    ])
    return res.status(200).json({
      success: true,
      data: questions,
      pagination: paginationMetadata(totalItems, page, limit),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch daily questions.' })
  }
}

const createDailyQuestion = async (req, res) => {
  try {
    const question = await DailyQuestion.create({
      question: req.body.question,
      options: req.body.options,
      correctOptionIndex: req.body.correctOptionIndex,
      points: req.body.points,
      date: req.body.date,
    })
    return res.status(201).json({ success: true, data: question })
  } catch (error) {
    console.error(error)
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to create daily question.' })
  }
}

const updateDailyQuestion = async (req, res) => {
  try {
    const question = await DailyQuestion.findById(req.params.questionId)
    if (!question) {
      return res.status(404).json({ success: false, message: 'Daily question not found.' })
    }

    for (const field of ['question', 'options', 'correctOptionIndex', 'points', 'date']) {
      if (req.body[field] !== undefined) question[field] = req.body[field]
    }
    await question.save()
    return res.status(200).json({ success: true, data: question })
  } catch (error) {
    console.error(error)
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to update daily question.' })
  }
}

const deleteDailyQuestion = async (req, res) => {
  try {
    const question = await DailyQuestion.findByIdAndDelete(req.params.questionId)
    if (!question) {
      return res.status(404).json({ success: false, message: 'Daily question not found.' })
    }
    return res.status(200).json({ success: true, message: 'Daily question deleted.' })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid daily question ID.' })
  }
}

const getDailyQuestionSubmissions = async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid daily question ID.' })
  }

  try {
    const question = await DailyQuestion.findById(id).select('_id question')
    if (!question) {
      return res.status(404).json({ success: false, message: 'Daily question not found.' })
    }

    const submissions = await DailyQuestionSubmission.find({ questionId: question._id })
      .populate('userId', 'username title')
      .sort({ submittedAt: -1, _id: -1 })
      .lean()

    return res.status(200).json({
      success: true,
      data: submissions.map((submission) => ({
        _id: submission._id,
        userName: submission.userId?.username || 'مستخدم محذوف',
        selectedOption: submission.selectedOption,
        isCorrect: submission.isCorrect,
        pointsEarned: submission.pointsEarned,
        submittedAt: submission.submittedAt,
      })),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch daily question submissions.' })
  }
}

module.exports = {
  getDailyQuestions,
  createDailyQuestion,
  updateDailyQuestion,
  deleteDailyQuestion,
  getDailyQuestionSubmissions,
}