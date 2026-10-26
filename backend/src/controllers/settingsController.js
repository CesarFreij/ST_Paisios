const Settings = require('../models/Settings')
const { actionPointDefaults, pointSettingFields } = require('../config/pointConfig')

const settingsKey = 'global'
const pointFields = Object.values(pointSettingFields)
const getPointSettings = (settings) => {
  const pointSettings = Object.fromEntries(
    Object.entries(pointSettingFields).map(([action, field]) => [
      field,
      settings[field] ?? actionPointDefaults[action],
    ])
  )
  return { ...pointSettings, dailyVersePoints: pointSettings.biblePoints }
}

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: settingsKey },
      { $setOnInsert: { key: settingsKey } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return res.status(200).json({
      success: true,
      data: { ...settings, ...getPointSettings(settings) },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.' })
  }
}

const updateSettings = async (req, res) => {
  try {
    const body = req.body || {}
    const fields = Object.keys(body)
    if (
      fields.length === 0 ||
      fields.some((field) => !pointFields.includes(field)) ||
      fields.some((field) => !Number.isInteger(body[field]) || body[field] < 0 || body[field] > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide point values from 0 to 1000 for supported actions.',
      })
    }

    const settings = await Settings.findOneAndUpdate(
      { key: settingsKey },
      { $set: body, $setOnInsert: { key: settingsKey } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean()

    return res.status(200).json({ success: true, data: settings })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to update settings.' })
  }
}

const getPoints = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: settingsKey },
      { $setOnInsert: { key: settingsKey } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return res.status(200).json({ success: true, data: getPointSettings(settings) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch point settings.' })
  }
}

const updatePoints = async (req, res) => {
  try {
    const body = req.body || {}
    const fields = Object.keys(body)
    const updates = { ...body }

    if (Object.prototype.hasOwnProperty.call(updates, 'dailyVersePoints')) {
      if (
        Object.prototype.hasOwnProperty.call(updates, 'biblePoints') &&
        updates.biblePoints !== updates.dailyVersePoints
      ) {
        return res.status(400).json({
          success: false,
          message: 'biblePoints and dailyVersePoints must have the same value.',
        })
      }
      updates.biblePoints = updates.dailyVersePoints
      delete updates.dailyVersePoints
    }

    const updateFields = Object.keys(updates)
    if (
      fields.length === 0 ||
      fields.some((field) => ![...pointFields, 'dailyVersePoints'].includes(field)) ||
      updateFields.some((field) =>
        !Number.isInteger(updates[field]) || updates[field] < 0 || updates[field] > 1000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide whole point values from 0 to 1000 for supported actions.',
      })
    }

    const settings = await Settings.findOneAndUpdate(
      { key: settingsKey },
      { $set: updates, $setOnInsert: { key: settingsKey } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean()

    return res.status(200).json({ success: true, data: getPointSettings(settings) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to update point settings.' })
  }
}

module.exports = { getSettings, updateSettings, getPoints, updatePoints }