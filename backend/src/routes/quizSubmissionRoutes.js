const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const quizSubmissionController = require('../controllers/quizSubmissionController')

const router = express.Router()

router.post('/', authMiddleware, quizSubmissionController.createSubmission)

module.exports = router
