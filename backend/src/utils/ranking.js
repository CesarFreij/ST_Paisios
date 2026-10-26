const User = require('../models/User')

const getLeaderboardFilter = (role) => (
  role === 'owner'
    ? {}
    : role === 'admin'
      ? { role: { $in: ['user', 'admin'] } }
      : { role: 'user' }
)

const getUserRank = async (user, leaderboardFilter) => {
  const usersAhead = await User.countDocuments({
    ...leaderboardFilter,
    $or: [
      { totalPoints: { $gt: user.totalPoints ?? 0 } },
      { totalPoints: user.totalPoints ?? 0, _id: { $lt: user._id } },
    ],
  })

  return usersAhead + 1
}

module.exports = { getLeaderboardFilter, getUserRank }
