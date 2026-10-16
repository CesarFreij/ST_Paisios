const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const dailyQuestionPlayController = require('../controllers/dailyQuestionPlayController')

const router = express.Router()

router.use(authMiddleware)
router.get('/today', dailyQuestionPlayController.getTodayDailyQuestion)
router.post('/submit', dailyQuestionPlayController.submitDailyQuestion)

module.exports = router
