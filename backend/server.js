require('dotenv').config()
const connectDB = require('./src/config/db')
const app = require('./src/app')

const port = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'production' && require.main === module) {
  startServer()
}

module.exports = app
