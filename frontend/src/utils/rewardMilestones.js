export const getCurrentRewardMilestone = (points, milestones) => (
  [...milestones].reverse().find((milestone) => points >= milestone.pointsNeeded) || null
)
