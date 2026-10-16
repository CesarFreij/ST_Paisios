const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { getSettingsSummary } = require('../controllers/userController')

const router = express.Router()

router.get('/settings-summary', authMiddleware, getSettingsSummary)

module.exports = router
