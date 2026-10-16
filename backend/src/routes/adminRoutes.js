const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const adminMiddleware = require('../middleware/adminMiddleware')
const ownerMiddleware = require('../middleware/ownerMiddleware')
const userController = require('../controllers/userController')
const verseController = require('../controllers/verseController')
const dailyQuestionController = require('../controllers/dailyQuestionController')
const weeklyQuizController = require('../controllers/weeklyQuizController')
const quizSubmissionController = require('../controllers/quizSubmissionController')
const adminSettingsController = require('../controllers/adminSettingsController')
const settingsController = require('../controllers/settingsController')

const router = express.Router()

router.patch('/users/role', authMiddleware, ownerMiddleware, userController.changeUserRole)

router.use(authMiddleware, adminMiddleware)

router.get('/users', userController.getUsers)
router.get('/users/:id/point-logs', userController.getUserPointLogs)
router.get('/users/:userId/points-details', userController.getUserPointsDetails)
router.post('/users/:userId/adjust-points', userController.adjustUserPoints)
router.get('/users/:userId', userController.getUser)
router.post('/users', userController.createUser)
router.patch('/users/:userId', userController.updateUser)
router.delete('/users/:userId', userController.deleteUser)

router.get('/verses', verseController.getVerses)
router.post('/verses', verseController.addVerse)
router.patch('/verses/:verseId', verseController.updateVerse)
router.delete('/verses/:verseId', verseController.deleteVerse)

router.get('/questions', dailyQuestionController.getDailyQuestions)
router.get('/daily-questions/:id/submissions', dailyQuestionController.getDailyQuestionSubmissions)
router.post('/questions', dailyQuestionController.createDailyQuestion)
router.patch('/questions/:questionId', dailyQuestionController.updateDailyQuestion)
router.delete('/questions/:questionId', dailyQuestionController.deleteDailyQuestion)

router.get('/quizzes', weeklyQuizController.getAdminQuizzes)
router.post('/quizzes', weeklyQuizController.createWeeklyQuiz)
router.patch('/quizzes/:quizId', weeklyQuizController.updateWeeklyQuiz)
router.delete('/quizzes/:quizId', weeklyQuizController.deleteWeeklyQuiz)
router.get('/weekly-quizzes', weeklyQuizController.getWeeklyQuizzes)
router.get('/quiz-submissions/:quizType/:quizId', quizSubmissionController.getSubmissions)
router.post('/weekly-quizzes', weeklyQuizController.createWeeklyQuiz)
router.patch('/weekly-quizzes/:quizId', weeklyQuizController.updateWeeklyQuiz)
router.delete('/weekly-quizzes/:quizId', weeklyQuizController.deleteWeeklyQuiz)

router.get('/settings', settingsController.getSettings)
router.put('/settings', settingsController.updateSettings)
router.put('/settings/points', settingsController.updatePoints)
router.patch('/settings/profile', adminSettingsController.updateAdminProfile)

module.exports = router