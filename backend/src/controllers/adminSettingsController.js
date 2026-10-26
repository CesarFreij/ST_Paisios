const AdminSettings = require('../models/AdminSettings')
const User = require('../models/User')
const { actionPointDefaults } = require('../config/pointConfig')

const settingsKey = 'global'
const pointActions = Object.keys(actionPointDefaults)

const getOrCreateSettings = () => AdminSettings.findOneAndUpdate(
  { key: settingsKey },
  { $setOnInsert: { key: settingsKey } },
  { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
)

const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    return res.status(200).json({
      success: true,
      data: {
        defaultPoints: settings.defaultPoints,
        admin: { id: req.user._id, username: req.user.username, role: req.user.role },
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.' })
  }
}

const updateSettings = async (req, res) => {
  try {
    const points = req.body.defaultPoints
    if (
      !points || typeof points !== 'object' || Array.isArray(points) ||
      Object.keys(points).some((action) => !pointActions.includes(action)) ||
      pointActions.some((action) => !Number.isInteger(points[action]) || points[action] < 0 || points[action] > 1000)
    ) {
      return res.status(400).json({ success: false, message: 'Set a whole number from 0 to 1000 for every action.' })
    }

    const settings = await AdminSettings.findOneAndUpdate(
      { key: settingsKey },
      { $set: { defaultPoints: points }, $setOnInsert: { key: settingsKey } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json({ success: true, data: settings.defaultPoints })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to update settings.' })
  }
}

const updateAdminProfile = async (req, res) => {
  try {
    const username = req.body.username
    if (typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' })
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.user._id, role: { $in: ['admin', 'owner'] } },
      { $set: { username: username.trim() } },
      { returnDocument: 'after', runValidators: true }
    ).select('_id username role')

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' })
    }
    return res.status(200).json({ success: true, data: admin })
  } catch (error) {
    console.error(error)
    const status = error.code === 11000 || error.name === 'ValidationError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to update admin profile.' })
  }
}

module.exports = { getSettings, updateSettings, updateAdminProfile }