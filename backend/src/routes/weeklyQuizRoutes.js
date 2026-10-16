const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const weeklyQuizController = require('../controllers/weeklyQuizController')

const router = express.Router()

router.use(authMiddleware)
router.get('/current', weeklyQuizController.getCurrentQuiz)
router.get('/history', weeklyQuizController.getQuizHistory)
router.post('/:quizId/start', weeklyQuizController.startQuiz)
router.post('/:quizId/submit', weeklyQuizController.submitQuiz)

module.exports = router
