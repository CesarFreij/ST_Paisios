const User = require('../models/User')
const mongoose = require('mongoose')
const Progress = require('../models/Progress')
const { rewardMilestones, getRewardMilestone } = require('../utils/rewards')
const WeeklyQuiz = require('../models/WeeklyQuiz')
const PointTransaction = require('../models/PointTransaction')
const PointLog = require('../models/PointLog')
const { getPagination, paginationMetadata } = require('../utils/pagination')
const { getLeaderboardFilter, getUserRank } = require('../utils/ranking')

const resolveQuizWindow = (quiz) => {
  if (quiz.windowStart && quiz.windowEnd) {
    return { start: new Date(quiz.windowStart), end: new Date(quiz.windowEnd) }
  }
  if (!quiz.examDate) return { start: null, end: null }

  const start = new Date(quiz.examDate)
  const [startHour, startMinute] = (quiz.startTime || '00:00').split(':').map(Number)
  start.setHours(startHour, startMinute, 0, 0)
  const end = new Date(quiz.examDate)
  const [endHour, endMinute] = (quiz.endTime || '23:59').split(':').map(Number)
  end.setHours(endHour, endMinute, 59, 999)
  return { start, end }
}

const getShortQuizStatus = async (now) => {
  const quizzes = await WeeklyQuiz.find({ isActive: { $ne: false } })
    .select('windowStart windowEnd examDate startTime endTime')
    .lean()
  const candidates = quizzes
    .map((quiz) => ({ ...resolveQuizWindow(quiz), quiz }))
    .filter(({ start, end }) => start && end && end >= now)
    .sort((first, second) => first.start - second.start)

  if (candidates.some(({ start, end }) => start <= now && end >= now)) return 'متاح الآن'
  const upcoming = candidates.find(({ start }) => start > now)
  if (!upcoming) return 'لا يوجد حالياً'

  const millisecondsUntilStart = upcoming.start.getTime() - now.getTime()
  const hoursUntilStart = Math.ceil(millisecondsUntilStart / 3600000)
  if (hoursUntilStart < 24) return `يبدأ بعد ${Math.max(1, hoursUntilStart)} ساعة`
  const daysUntilStart = Math.ceil(millisecondsUntilStart / 86400000)
  if (daysUntilStart === 1) return 'غداً'
  return `يبدأ بعد ${daysUntilStart} أيام`
}

const getSettingsSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('_id totalEarnedPoints totalPoints role')
      .lean()
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' })
    }

    const totalPoints = Number(user.totalPoints ?? 0)
    const leaderboardFilter = getLeaderboardFilter(user.role)
    const [rank, quizStatus] = await Promise.all([
      getUserRank(user, leaderboardFilter),
      getShortQuizStatus(new Date()),
    ])
    const title = getRewardMilestone(totalPoints)?.name || 'مبتدئ'
    return res.status(200).json({
      success: true,
      data: {
        totalPoints,
        rank,
        currentRank: rank,
        currentTitle: title,
        rewardMilestones,
        quizStatus,
      },
    })
  } catch (error) {
    console.error('Failed to load settings summary:', error)
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب ملخص الإعدادات.',
    })
  }
}

const getRankings = async (req, res) => {
  try {
    const leaderboardFilter = getLeaderboardFilter(req.user.role)
    const requestedPage = Number.parseInt(req.query.page, 10)
    const requestedLimit = Number.parseInt(req.query.limit, 10)
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20
    const skip = (page - 1) * limit

    const [currentUser, rankedUsers] = await Promise.all([
      User.findById(req.user._id).select('_id username totalPoints role').lean(),
      User.find(leaderboardFilter)
        .select('_id username totalPoints role')
        .sort({ totalPoints: -1, _id: 1 })
        .skip(skip)
        .limit(limit + 1)
        .lean(),
    ])

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود.',
      })
    }

    const hasMore = rankedUsers.length > limit
    const users = rankedUsers.slice(0, limit).map((user, index) => ({
      id: user._id.toString(),
      name: user.username,
      points: user.totalPoints ?? 0,
      rank: skip + index + 1,
      role: user.role,
      isCurrentUser: user._id.toString() === req.user._id.toString(),
    }))

    const currentUserPoints = currentUser.totalPoints ?? 0
    const currentUserIsInLeaderboard = await User.exists({
      _id: currentUser._id,
      ...leaderboardFilter,
    })
    const currentUserRank = currentUserIsInLeaderboard
      ? await getUserRank(currentUser, leaderboardFilter)
      : null

    return res.status(200).json({
      success: true,
      data: {
        users,
        currentUser: {
          id: currentUser._id.toString(),
          name: currentUser.username,
          points: currentUserPoints,
          rank: currentUserRank,
          role: currentUser.role,
        },
        page,
        limit,
        hasMore,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الترتيب.',
    })
  }
}

const getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const search = String(req.query.search || '').trim()
    const role = ['owner', 'admin', 'user'].includes(req.query.role) ? req.query.role : null
    const sort = ['points-desc', 'points-asc'].includes(req.query.sort)
      ? req.query.sort
      : 'createdAt'
    const searchFilter = search
      ? { username: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      : {}
    const filter = role ? { ...searchFilter, role } : searchFilter
    const sortOrder = sort === 'points-desc'
      ? { totalPoints: -1, _id: 1 }
      : sort === 'points-asc'
        ? { totalPoints: 1, _id: 1 }
        : { createdAt: -1, _id: 1 }

    const [queriedUsers, totalItems, allCount, roleCounts] = await Promise.all([
      User.find(filter)
        .select('_id username email title role createdAt totalPoints totalEarnedPoints totalDeductedPoints quizPoints extraPoints')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments(searchFilter),
      User.aggregate([
        { $match: searchFilter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ])
    const userProgress = queriedUsers.length
      ? await Progress.find({ user: { $in: queriedUsers.map((user) => user._id) } })
        .select('user achievements')
        .lean()
      : []
    const progressByUser = new Map(userProgress.map((progress) => [String(progress.user), progress]))
    const users = queriedUsers.map((user) => {
      const achievements = progressByUser.get(String(user._id))?.achievements || {}
      const completedAchievements = [
        'prayerAchievedLevel',
        'fastingAchievedLevel',
        'bibleAchievedLevel',
        'churchAchievedLevel',
        'goodDeedAchievedLevel',
        'perfectDayAchievedLevel',
      ].filter((field) => achievements[field] >= 3).length
      const totalEarnedPoints = user.totalEarnedPoints ?? Math.max(user.totalPoints ?? 0, 0)
      return {
        ...user,
        totalEarnedPoints,
        totalDeductedPoints: user.totalDeductedPoints ?? Math.max(-(user.totalPoints ?? 0), 0),
        quizPoints: user.quizPoints ?? 0,
        extraPoints: user.extraPoints ?? 0,
        completedAchievements,
        rewardMilestoneTitle: getRewardMilestone(user.totalPoints ?? 0)?.name ?? 'بداية الطريق',
      }
    })
    const counts = { all: allCount, owner: 0, admin: 0, user: 0 }
    for (const item of roleCounts) {
      if (['owner', 'admin', 'user'].includes(item._id)) counts[item._id] = item.count
    }

    return res.status(200).json({
      success: true,
      data: users,
      users,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalUsers: totalItems,
      pagination: paginationMetadata(totalItems, page, limit),
      counts,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' })
  }
}

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password').lean()
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    return res.status(200).json({ success: true, data: user })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid user ID.' })
  }
}

const getUserPointsDetails = async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' })
    }

    const [user, transactions] = await Promise.all([
      User.findById(userId).select('_id username title totalPoints').lean(),
      PointTransaction.find({ user: userId })
        .select('source points awardedAt')
        .sort({ awardedAt: -1, _id: -1 })
        .lean(),
    ])
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const totalPoints = user.totalPoints ?? 0
    const recordedPoints = transactions.reduce((total, transaction) => total + transaction.points, 0)
    return res.status(200).json({
      success: true,
      data: {
        user: { ...user, totalPoints },
        transactions,
        historyComplete: recordedPoints === totalPoints,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch user points history.' })
  }
}

const getUserPointLogs = async (req, res) => {
  const userId = req.params.id || req.params.userId
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID.' })
  }

  try {
    const user = await User.findById(userId).select('_id username totalPoints')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const { page, limit, skip } = getPagination(req.query)
    const [logs, totalItems] = await Promise.all([
      PointLog.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PointLog.countDocuments({ userId }),
    ])

    return res.status(200).json({
      success: true,
      data: logs,
      user: {
        id: user._id,
        username: user.username,
        totalPoints: user.totalPoints ?? 0,
      },
      pagination: paginationMetadata(totalItems, page, limit),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch user point logs.' })
  }
}

const adjustUserPoints = async (req, res) => {
  try {
    const { userId } = req.params
    const { amount, isPositive } = req.body || {}
    if (
      !mongoose.isValidObjectId(userId) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      typeof isPositive !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid user ID, positive integer amount, and isPositive value are required.',
      })
    }

    const session = await mongoose.startSession()
    let user
    try {
      await session.withTransaction(async () => {
        user = await User.findById(userId).session(session)
        if (!user) {
          const error = new Error('User not found.')
          error.code = 'USER_NOT_FOUND'
          throw error
        }

        user.initializePointTotals()
        if (isPositive) {
          user.totalEarnedPoints += amount
          user.extraPoints += amount
        } else {
          user.totalDeductedPoints += amount
        }
        user.hasUnseenPointsUpdate = true
        user.unseenPointsDifference = isPositive ? amount : -amount
        user.pointNotifications.push({
          amount,
          isPositive,
          isRead: false,
          createdAt: new Date(),
        })
        await user.save({ session })
        await PointLog.create([{
          userId: user._id,
          amount: isPositive ? amount : -amount,
          type: isPositive ? 'admin_gift' : 'admin_deduction',
          description: isPositive ? 'مكافأة إدارية' : 'خصم إداري',
        }], { session })
      })
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'User not found.' })
      }
      throw error
    } finally {
      await session.endSession()
    }

    return res.status(200).json({
      success: true,
      message: 'Points adjusted successfully.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          title: user.title,
          totalPoints: user.totalPoints,
          totalEarnedPoints: user.totalEarnedPoints,
          totalDeductedPoints: user.totalDeductedPoints,
          extraPoints: user.extraPoints,
        },
        adjustment: { amount, isPositive },
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to adjust user points.' })
  }
}

const saveExpoPushToken = async (req, res) => {
  try {
    const { Expo } = await import('expo-server-sdk')
    const { expoPushToken } = req.body || {}
    if (typeof expoPushToken !== 'string' || !Expo.isExpoPushToken(expoPushToken)) {
      return res.status(400).json({ success: false, message: 'A valid Expo push token is required.' })
    }

    await User.updateMany(
      { expoPushToken, _id: { $ne: req.user._id } },
      { $unset: { expoPushToken: 1 } }
    )
    await User.updateOne({ _id: req.user._id }, { $set: { expoPushToken } })
    return res.status(200).json({ success: true, message: 'Push token registered.' })
  } catch (error) {
    console.error('Failed to save Expo push token:', error)
    return res.status(500).json({ success: false, message: 'Failed to register push token.' })
  }
}

const markPointNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body || {}
    if (
      !Array.isArray(notificationIds) ||
      notificationIds.length === 0 ||
      notificationIds.some((id) => !mongoose.isValidObjectId(id))
    ) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty array of valid notification IDs is required.',
      })
    }

    await User.updateOne(
      { _id: req.user._id },
      { $set: { 'pointNotifications.$[notification].isRead': true } },
      {
        arrayFilters: [
          {
            'notification._id': { $in: notificationIds.map((id) => new mongoose.Types.ObjectId(id)) },
            'notification.isRead': false,
          },
        ],
      }
    )
    return res.status(200).json({ success: true, message: 'Point notifications marked as read.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to update point notifications.' })
  }
}

const createUser = async (req, res) => {
  try {
    const { username, password, totalPoints = 0, title } = req.body
    if (!username?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      })
    }
    const session = await mongoose.startSession()
    let user
    try {
      await session.withTransaction(async () => {
        const createdUsers = await User.create([{
          username: username.trim(),
          password,
          totalPoints,
          totalEarnedPoints: Math.max(Number(totalPoints) || 0, 0),
          totalDeductedPoints: Math.max(-(Number(totalPoints) || 0), 0),
          title,
          role: 'user',
        }], { session })
        user = createdUsers[0]
        if (user.totalPoints !== 0) {
          await PointLog.create([{
            userId: user._id,
            amount: user.totalPoints,
            type: user.totalPoints > 0 ? 'admin_gift' : 'admin_deduction',
            description: 'رصيد افتتاحي',
          }], { session })
        }
      })
    } finally {
      await session.endSession()
    }
    const safeUser = await User.findById(user._id).select('-password').lean()
    return res.status(201).json({ success: true, data: safeUser })
  } catch (error) {
    console.error(error)
    const status = error.code === 11000 || error.name === 'ValidationError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to create user.' })
  }
}

const updateUser = async (req, res) => {
  try {
    const allowedFields = ['username', 'password', 'email', 'totalPoints', 'title']
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    )
    if (updates.username !== undefined) updates.username = updates.username.trim()
    if (updates.email !== undefined) updates.email = updates.email.trim().toLowerCase()

    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    user.initializePointTotals()
    const requestedTotalPoints = updates.totalPoints
    delete updates.totalPoints
    Object.assign(user, updates)
    let pointsLog
    let pointsDifference = 0
    if (requestedTotalPoints !== undefined) {
      if (!Number.isSafeInteger(requestedTotalPoints)) {
        return res.status(400).json({ success: false, message: 'Total points must be a whole number.' })
      }
      pointsDifference = requestedTotalPoints - user.totalPoints
      if (pointsDifference > 0) {
        user.totalEarnedPoints += pointsDifference
        pointsLog = {
          userId: user._id,
          amount: pointsDifference,
          type: 'admin_gift',
          description: 'تعديل إداري للرصيد',
        }
      } else if (pointsDifference < 0) {
        user.totalDeductedPoints += Math.abs(pointsDifference)
        pointsLog = {
          userId: user._id,
          amount: pointsDifference,
          type: 'admin_deduction',
          description: 'تعديل إداري للرصيد',
        }
      }
      if (pointsDifference !== 0) {
        user.hasUnseenPointsUpdate = true
        user.unseenPointsDifference = pointsDifference
        user.pointNotifications.push({
          amount: Math.abs(pointsDifference),
          isPositive: pointsDifference > 0,
          isRead: false,
          createdAt: new Date(),
        })
      }
    }
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await user.save({ session })
        if (pointsLog) await PointLog.create([pointsLog], { session })
      })
    } finally {
      await session.endSession()
    }
    const safeUser = await User.findById(user._id).select('-password').lean()
    return res.status(200).json({ success: true, data: safeUser })
  } catch (error) {
    console.error(error)
    const status = error.code === 11000 || error.name === 'ValidationError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to update user.' })
  }
}

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    await PointTransaction.deleteMany({ user: user._id })
    await PointLog.deleteMany({ userId: user._id })
    return res.status(200).json({ success: true, message: 'User deleted.' })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid user ID.' })
  }
}

const changeUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body || {}
    if (!userId || !['user', 'admin', 'owner'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'A valid userId and newRole (user, admin, or owner) are required.',
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (user.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await User.countDocuments({ role: 'owner' })
      if (ownerCount <= 1) {
        return res.status(409).json({
          success: false,
          message: 'The last owner cannot be demoted.',
        })
      }
    }

    user.role = newRole
    await user.save()
    const safeUser = await User.findById(user._id).select('-password').lean()
    return res.status(200).json({ success: true, data: safeUser })
  } catch (error) {
    console.error(error)
    const status = error.name === 'CastError' || error.name === 'ValidationError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to change user role.' })
  }
}

module.exports = {
  getSettingsSummary,
  saveExpoPushToken,
  getRankings,
  getUsers,
  getUser,
  getUserPointsDetails,
  getUserPointLogs,
  adjustUserPoints,
  markPointNotificationsRead,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
}