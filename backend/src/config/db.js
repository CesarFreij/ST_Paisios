const mongoose = require('mongoose')

mongoose.set('bufferCommands', false)

global.mongoose = global.mongoose || { conn: null, promise: null }

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment variables')
  }

  if (global.mongoose.conn) {
    return global.mongoose.conn
  }

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(mongoUri, { bufferCommands: false })
      .then((connection) => connection)
      .catch((error) => {
        global.mongoose.promise = null
        throw error
      })
  }

  global.mongoose.conn = await global.mongoose.promise
  return global.mongoose.conn
}

module.exports = connectDB
