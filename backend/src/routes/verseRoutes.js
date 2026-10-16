const express = require('express')
const verseController = require('../controllers/verseController')

const router = express.Router()

router.get('/today', verseController.getVerseOfTheDay)

module.exports = router