const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const progressRoutes = require('./routes/progressRoutes')
const rankRoutes = require('./routes/rankRoutes')
const adminRoutes = require('./routes/adminRoutes')
const verseRoutes = require('./routes/verseRoutes')
const quizSubmissionRoutes = require('./routes/quizSubmissionRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const weeklyQuizRoutes = require('./routes/weeklyQuizRoutes')
const dailyQuestionRoutes = require('./routes/dailyQuestionRoutes')
const rewardsRoutes = require('./routes/rewardsRoutes')
const achievementRoutes = require('./routes/achievementRoutes')
const calendarRoutes = require('./routes/calendarRoutes')
const userRoutes = require('./routes/userRoutes')
const connectDB = require('./config/db')

const app = express()

app.use(cors())
app.use(express.json())

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    console.error('Database connection failed:', error)
    res.status(500).json({ error: 'DB error' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/rewards', rewardsRoutes)
app.use('/api/achievements', achievementRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/users', rankRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/verses', verseRoutes)
app.use('/api/quiz-submissions', quizSubmissionRoutes)
app.use('/api/quizzes', weeklyQuizRoutes)
app.use('/api/daily-question', dailyQuestionRoutes)
app.use('/api/settings', settingsRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timeZone: 'Asia/Damascus', region: 'dub1' })
})

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
})

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  })
})

module.exports = app
