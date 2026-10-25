const mongoose = require('mongoose')
const connectDB = require('../src/config/db')

mongoose.set('autoIndex', false)

const DailyQuestionSubmission = require('../src/models/DailyQuestionSubmission')

const migrate = async () => {
  await connectDB()
  const collection = DailyQuestionSubmission.collection
  const indexes = await collection.indexes()
  const legacyUniqueIndex = indexes.find(
    (index) =>
      index.unique &&
      index.key.userId === 1 &&
      index.key.questionId === 1
  )

  if (legacyUniqueIndex) {
    await collection.dropIndex(legacyUniqueIndex.name)
    console.log(`Dropped legacy index: ${legacyUniqueIndex.name}`)
  }

  const backfill = await collection.updateMany(
    { localDate: { $exists: false } },
    [{
      $set: {
        localDate: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$submittedAt',
            timezone: 'Asia/Damascus',
          },
        },
      },
    }]
  )
  console.log(`Backfilled local dates for ${backfill.modifiedCount} submissions.`)

  await collection.createIndex(
    { userId: 1, localDate: 1 },
    {
      name: 'userId_1_localDate_1',
      unique: true,
      partialFilterExpression: { localDate: { $type: 'string' } },
    }
  )
  console.log('Created unique per-user daily submission index.')
}

migrate()
  .catch((error) => {
    console.error('Failed to migrate daily-question submissions:', error)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
