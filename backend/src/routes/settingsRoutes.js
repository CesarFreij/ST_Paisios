const express = require('express')
const settingsController = require('../controllers/settingsController')

const router = express.Router()

router.get('/points', settingsController.getPoints)

module.exports = router
