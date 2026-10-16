const User = require('../models/User')

const getRankings = async (req, res) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10)
    const requestedLimit = Number.parseInt(req.query.limit, 10)
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20
    const skip = (page - 1) * limit

    const [currentUser, rankedUsers] = await Promise.all([
      User.findOne({ _id: req.user._id, role: 'user' }).select('_id username totalPoints').lean(),
      User.find({ role: 'user' })
        .select('_id username totalPoints')
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
      isCurrentUser: user._id.toString() === req.user._id.toString(),
    }))

    const currentUserPoints = currentUser.totalPoints ?? 0
    const usersAhead = await User.countDocuments({
      role: 'user',
      $or: [
        { totalPoints: { $gt: currentUserPoints } },
        { totalPoints: currentUserPoints, _id: { $lt: currentUser._id } },
      ],
    })

    return res.status(200).json({
      success: true,
      data: {
        users,
        currentUser: {
          id: currentUser._id.toString(),
          name: currentUser.username,
          points: currentUserPoints,
          rank: usersAhead + 1,
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

module.exports = { getRankings }