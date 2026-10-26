const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { getSettingsSummary, saveExpoPushToken } = require('../controllers/userController')

const router = express.Router()

router.get('/settings-summary', authMiddleware, getSettingsSummary)
router.put('/push-token', authMiddleware, saveExpoPushToken)

module.exports = router
