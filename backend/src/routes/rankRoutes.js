const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const {
  getRankings,
  markPointNotificationsRead,
} = require('../controllers/userController')

const router = express.Router()

router.get('/rank', authMiddleware, getRankings)
router.get('/leaderboard', authMiddleware, getRankings)
router.put('/notifications/mark-read', authMiddleware, markPointNotificationsRead)

module.exports = router

