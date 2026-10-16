const express = require('express')
const progressController = require('../controllers/progressController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/progress', authMiddleware, progressController.getRewardsProgress)

module.exports = router
