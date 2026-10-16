const express = require('express')
const progressController = require('../controllers/progressController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/my-dates', authMiddleware, progressController.getCalendarDates)

module.exports = router
