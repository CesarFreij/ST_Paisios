const rewardMilestones = [
  { level: 1, name: 'مواظب', pointsNeeded: 1000 },
  { level: 2, name: 'متقدم', pointsNeeded: 3500 },
  { level: 3, name: 'متميز', pointsNeeded: 8000 },
  { level: 4, name: 'رائد', pointsNeeded: 14000 },
  { level: 5, name: 'بطل السنة', pointsNeeded: 20000 },
]

const getRewardMilestone = (points) => (
  [...rewardMilestones].reverse().find((milestone) => points >= milestone.pointsNeeded) || null
)

module.exports = { rewardMilestones, getRewardMilestone }
