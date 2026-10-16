const express = require('express')
const progressController = require('../controllers/progressController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.use(authMiddleware)
router.post('/action', progressController.logAction)
router.get('/', progressController.getProgress)
router.put('/', progressController.updateProgress)

module.exports = router
