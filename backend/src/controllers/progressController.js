const mongoose = require('mongoose')
const Progress = require('../models/Progress')
const User = require('../models/User')
const Settings = require('../models/Settings')
const PointTransaction = require('../models/PointTransaction')
const PointLog = require('../models/PointLog')
const { actionPointDefaults, pointSettingFields, perfectMonthRewardPoints } = require('../config/pointConfig')

const achievementTargets = {
  prayer: [10, 30, 100],
  fasting: [10, 30, 100],
  bible: [10, 30, 100],
  church: [10, 30, 100],
  goodDeed: [10, 30, 100],
  perfectDay: [10, 30, 100],
}
const grandPrizeMilestones = [
  { level: 1, name: 'مواظب', pointsNeeded: 1000 },
  { level: 2, name: 'متقدم', pointsNeeded: 3500 },
  { level: 3, name: 'متميز', pointsNeeded: 8000 },
  { level: 4, name: 'رائد', pointsNeeded: 14000 },
  { level: 5, name: 'بطل السنة', pointsNeeded: 20000 },
]

const counterFields = [
  'prayerCount',
  'fastingCount',
  'bibleCount',
  'churchCount',
  'goodDeedCount',
]
const pointsActionByCounter = {
  prayerCount: 'prayer',
  fastingCount: 'fasting',
  bibleCount: 'bible',
  churchCount: 'church',
  goodDeedCount: 'goodDeed',
}
const pointSourceByAction = {
  prayer: 'prayer',
  fasting: 'fasting',
  bible: 'bible',
  church: 'church',
  goodDeed: 'goodDeed',
}
const actionAchievementByCounter = {
  prayerCount: 'prayer',
  fastingCount: 'fasting',
  bibleCount: 'bible',
  churchCount: 'church',
  goodDeedCount: 'mercy',
}
const achievementDefinitions = {
  prayer: { title: 'المصلي الدائم', levelField: 'prayerAchievedLevel', countField: 'prayer', thresholds: achievementTargets.prayer, rewards: [30, 100, 500] },
  fasting: { title: 'الصائم الملتزم', levelField: 'fastingAchievedLevel', countField: 'fasting', thresholds: achievementTargets.fasting, rewards: [30, 100, 500] },
  bible: { title: 'محب الكلمة', levelField: 'bibleAchievedLevel', countField: 'bible', thresholds: achievementTargets.bible, rewards: [30, 100, 500] },
  church: { title: 'ابن الكنيسة', levelField: 'churchAchievedLevel', countField: 'church', thresholds: achievementTargets.church, rewards: [30, 100, 500] },
  mercy: { title: 'القلب الرحيم', levelField: 'goodDeedAchievedLevel', countField: 'goodDeed', thresholds: achievementTargets.goodDeed, rewards: [30, 100, 500] },
  perfectCombo: { title: 'اليوم المثالي', levelField: 'perfectDayAchievedLevel', thresholds: achievementTargets.perfectDay, rewards: [30, 100, 500] },
}
const dailyActionFields = Object.keys(actionAchievementByCounter)
const achievementLevelFields = {
  prayer: 'prayerAchievedLevel',
  fasting: 'fastingAchievedLevel',
  bible: 'bibleAchievedLevel',
  church: 'churchAchievedLevel',
  goodDeed: 'goodDeedAchievedLevel',
  perfectDay: 'perfectDayAchievedLevel',
}
const achievementCounterKeys = {
  prayer: 'prayer',
  fasting: 'fasting',
  bible: 'bible',
  church: 'church',
  goodDeed: 'goodDeed',
  perfectDay: 'perfectDaysCount',
}
const achievementProgressKeyById = {
  prayer: 'prayer',
  fasting: 'fasting',
  bible: 'bible',
  church: 'church',
  mercy: 'goodDeed',
  perfectCombo: 'perfectDay',
}
const getRewardMilestone = (points) => (
  [...grandPrizeMilestones].reverse().find((milestone) => points >= milestone.pointsNeeded) || null
)

const awardAchievementLevels = (achievementId, count, currentLevel) => {
  const definition = achievementDefinitions[achievementId]
  const rewards = []
  while (
    currentLevel < definition.thresholds.length &&
    count >= definition.thresholds[currentLevel]
  ) {
    currentLevel += 1
    const rewardPoints = definition.rewards[currentLevel - 1]
    rewards.push({
      achievementId,
      title: definition.title,
      level: currentLevel,
      amount: rewardPoints,
    })
  }
  return { currentLevel, rewards }
}

const getSyriaDateString = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Damascus',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

const getDaysInMonth = (year, month) => {
  const daysByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (month === 2 && (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))) return 29
  return daysByMonth[month - 1]
}

const getSyriaMonthContext = (dateString) => {
  const [year, month] = dateString.split('-').map(Number)
  return {
    monthYear: dateString.slice(0, 7),
    daysInMonth: getDaysInMonth(year, month),
  }
}

const getConfiguredPoints = async () => {
  const settings = await Settings.findOne({ key: 'global' })
    .select(Object.values(pointSettingFields).join(' '))
    .lean()
  return Object.fromEntries(
    Object.entries(pointSettingFields).map(([action, field]) => [
      action,
      settings?.[field] ?? actionPointDefaults[action],
    ])
  )
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0

const getProgress = async (req, res) => {
  try {
    const [progress, user, activityTotals] = await Promise.all([
      Progress.findOneAndUpdate(
        { user: req.user._id },
        { $setOnInsert: { user: req.user._id } },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      ).lean(),
      User.findById(req.user._id)
        .select('_id username title totalPoints totalEarnedPoints totalDeductedPoints quizPoints extraPoints pointNotifications')
        .lean(),
      PointTransaction.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$source', points: { $sum: '$points' } } },
      ]),
    ])

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود.',
      })
    }

    const pointsByActivity = {
      prayer: 0,
      fasting: 0,
      bible: 0,
      church: 0,
      goodDeed: 0,
    }
    for (const activity of activityTotals) {
      if (Object.prototype.hasOwnProperty.call(pointsByActivity, activity._id)) {
        pointsByActivity[activity._id] = activity.points
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        progress,
        user: {
          id: user._id,
          username: user.username,
          title: user.title,
          totalPoints: user.totalPoints ?? 0,
          totalEarnedPoints: user.totalEarnedPoints ?? Math.max(user.totalPoints ?? 0, 0),
          totalDeductedPoints: user.totalDeductedPoints ?? Math.max(-(user.totalPoints ?? 0), 0),
          quizPoints: user.quizPoints ?? 0,
          extraPoints: user.extraPoints ?? 0,
        },
        totalPoints: user.totalPoints ?? 0,
        totalEarnedPoints: user.totalEarnedPoints ?? Math.max(user.totalPoints ?? 0, 0),
        totalDeductedPoints: user.totalDeductedPoints ?? Math.max(-(user.totalPoints ?? 0), 0),
        quizPoints: user.quizPoints ?? 0,
        extraPoints: user.extraPoints ?? 0,
        perfectMonthRewardPoints,
        pointNotifications: (user.pointNotifications ?? []).filter((notification) => !notification.isRead),
        pointsByActivity,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التقدم.',
    })
  }
}

const getCalendarDates = async (req, res) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id }).select('calendarLogs').lean()
    const todaySyria = getSyriaDateString()
    return res.status(200).json({
      success: true,
      data: {
        calendarLogs: {
          prayerDays: progress?.calendarLogs?.prayerDays ?? [],
          bibleDays: progress?.calendarLogs?.bibleDays ?? [],
        },
        currentMonthYear: todaySyria.slice(0, 7),
      },
    })
  } catch (error) {
    console.error('Failed to load calendar dates:', error)
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب أيام التقويم.',
    })
  }
}

const getRewardsProgress = async (req, res) => {
  try {
    const [user, progress] = await Promise.all([
      User.findById(req.user._id).select('_id totalPoints').lean(),
      Progress.findOne({ user: req.user._id }).lean(),
    ])
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' })
    }

    const totalPoints = user.totalPoints ?? 0
    const currentMilestone = getRewardMilestone(totalPoints)
    const nextMilestone = grandPrizeMilestones.find((milestone) => totalPoints < milestone.pointsNeeded) || null
    const previousPoints = currentMilestone?.pointsNeeded ?? 0
    const progressPoints = nextMilestone
      ? Math.max(0, Math.min(totalPoints - previousPoints, nextMilestone.pointsNeeded - previousPoints))
      : 0
    const requiredPoints = nextMilestone ? nextMilestone.pointsNeeded - previousPoints : 0

    return res.status(200).json({
      success: true,
      data: {
        totalPoints,
        milestones: grandPrizeMilestones.map((milestone) => ({
          ...milestone,
          reached: totalPoints >= milestone.pointsNeeded,
        })),
        currentMilestone,
        nextMilestone,
        segmentProgress: {
          fromPoints: previousPoints,
          toPoints: nextMilestone?.pointsNeeded ?? previousPoints,
          currentPoints: totalPoints,
          progressPoints,
          requiredPoints,
          percentage: requiredPoints
            ? Math.round((progressPoints / requiredPoints) * 100)
            : 100,
        },
        achievements: progress?.achievements ?? {},
        achievementCounts: progress?.achievementCounts ?? {},
        perfectDaysCount: progress?.perfectDaysCount ?? 0,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب مسار الجوائز.' })
  }
}

const getMyAchievementsProgress = async (req, res) => {
  try {
    const [progress, user] = await Promise.all([
      Progress.findOne({ user: req.user._id }).lean(),
      User.findById(req.user._id)
        .select('_id totalEarnedPoints totalPoints achievementsProgress')
        .lean(),
    ])

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' })
    }

    const storedAchievementsProgress = user.achievementsProgress ?? {}
    const userAchievements = Object.fromEntries(
      Object.entries(achievementLevelFields).map(([achievement, field]) => [
        achievement,
        Math.min(3, Math.max(
          Number(storedAchievementsProgress[achievement]?.currentTier) || 0,
          Number(progress?.achievements?.[field]) || 0
        )),
      ])
    )
    const achievementsProgress = Object.fromEntries(
      Object.entries(achievementCounterKeys).map(([achievement, counterKey]) => {
        const legacyCurrentValue = achievement === 'perfectDay'
          ? progress?.perfectDaysCount ?? 0
          : progress?.achievementCounts?.[counterKey]
            ?? progress?.[`${counterKey}Count`]
            ?? 0
        return [
          achievement,
          {
            currentValue: Math.max(
              Number(storedAchievementsProgress[achievement]?.currentValue) || 0,
              Number(legacyCurrentValue) || 0
            ),
            currentTier: userAchievements[achievement],
          },
        ]
      })
    )
    const userStats = {
      prayerCount: achievementsProgress.prayer.currentValue,
      fastingCount: achievementsProgress.fasting.currentValue,
      bibleCount: achievementsProgress.bible.currentValue,
      churchCount: achievementsProgress.church.currentValue,
      goodDeedCount: achievementsProgress.goodDeed.currentValue,
      perfectDaysCount: achievementsProgress.perfectDay.currentValue,
      totalPoints: Number(user.totalPoints ?? 0),
      totalEarnedPoints: Number(user.totalEarnedPoints ?? Math.max(user.totalPoints ?? 0, 0)),
    }

    return res.status(200).json({
      success: true,
      data: {
        globalConfig: {
          achievementTargets,
          achievementRewards: Object.fromEntries(
            Object.entries(achievementDefinitions).map(([id, definition]) => [id, definition.rewards])
          ),
          grandPrizeMilestones,
        },
        achievementsProgress,
        userStats,
        userAchievements,
      },
    })
  } catch (error) {
    console.error('Failed to load achievements progress:', error)
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب تقدم الإنجازات.' })
  }
}

const logAction = async (req, res) => {
  const action = req.body?.action
  const expectedPoints = req.body?.expectedPoints
  const field = actionAchievementByCounter[action] ? action : (
    Object.entries(pointsActionByCounter).find(([, actionKey]) => actionKey === action)?.[0]
  )
  if (!field) {
    return res.status(400).json({
      success: false,
      message: 'النشاط المرسل غير صالح.',
    })
  }
  if (expectedPoints !== undefined && (!Number.isSafeInteger(expectedPoints) || expectedPoints < 0)) {
    return res.status(400).json({
      success: false,
      message: 'قيمة النقاط المتوقعة غير صالحة.',
    })
  }
  req.expectedActionPoints = expectedPoints
  req.body = { counterIncrements: { [field]: 1 } }
  return updateProgress(req, res)
}

const updateProgress = async (req, res) => {
  try {
    const body = req.body || {}
    const counterIncrements = body.counterIncrements ?? {}
    if (Object.keys(body).some((field) => field !== 'counterIncrements')) {
      return res.status(400).json({
        success: false,
        message: 'يحتوي الطلب على حقول غير مدعومة.',
      })
    }

    if (!isObject(counterIncrements)) {
      return res.status(400).json({
        success: false,
        message: 'صيغة تحديث التقدم غير صحيحة.',
      })
    }

    if (
      Object.keys(counterIncrements).some((field) => !counterFields.includes(field)) ||
      Object.entries(counterIncrements).some(([, value]) => !isNonNegativeInteger(value) || value > 1) ||
      Object.values(counterIncrements).filter((value) => value > 0).length > 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'تحديث العدادات يحتوي على حقول أو قيم غير صالحة. يمكن تسجيل كل نشاط مرة واحدة فقط.',
      })
    }

    const hasCounterUpdates = Object.values(counterIncrements).some((value) => value > 0)
    let actionPoints = 0
    let configuredPoints = actionPointDefaults
    if (Object.keys(counterIncrements).length > 0) {
      configuredPoints = await getConfiguredPoints()
      const action = Object.entries(counterIncrements).find(([, increment]) => increment > 0)
      if (
        req.expectedActionPoints !== undefined &&
        action &&
        configuredPoints[pointsActionByCounter[action[0]]] !== req.expectedActionPoints
      ) {
        return res.status(409).json({
          success: false,
          code: 'POINT_SETTINGS_CHANGED',
          message: 'تم تحديث إعدادات النقاط. أعد المحاولة بالقيمة الجديدة.',
        })
      }
      actionPoints = Object.entries(counterIncrements).reduce((total, [counter, increment]) => {
        const action = pointsActionByCounter[counter]
        return total + increment * configuredPoints[action]
      }, 0)
    }

    if (!hasCounterUpdates) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم إرسال أي تحديث.',
      })
    }

    const pointTransactions = Object.entries(counterIncrements)
      .filter(([, increment]) => increment > 0)
      .map(([counter, increment]) => {
        const action = pointsActionByCounter[counter]
        return {
          user: req.user._id,
          source: pointSourceByAction[action],
          points: increment * configuredPoints[action],
          awardedAt: new Date(),
        }
      })
      .filter((transaction) => transaction.points > 0)

    const session = await mongoose.startSession()
    let progress
    let user
    let totalPoints = req.user.totalPoints
    let alreadyCompletedToday = false
    let achievementRewards = []
    let perfectMonthRewards = []
    const todaySyria = getSyriaDateString()
    const { monthYear, daysInMonth } = getSyriaMonthContext(todaySyria)
    try {
      await session.withTransaction(async () => {
        achievementRewards = []
        perfectMonthRewards = []
        alreadyCompletedToday = false
        progress = await Progress.findOne({ user: req.user._id }).session(session)
          || new Progress({ user: req.user._id })
        user = await User.findById(req.user._id).session(session)
        if (!user) {
          const error = new Error('User not found.')
          error.code = 'USER_NOT_FOUND'
          throw error
        }
        user.initializePointTotals()
        progress.achievements ||= {}
        progress.achievementCounts ||= {}
        progress.claimedPerfectMonths ||= []
        for (const [field, achievementId] of Object.entries(actionAchievementByCounter)) {
          const definition = achievementDefinitions[achievementId]
          const countField = definition.countField
          if (!progress.achievementCounts[countField]) {
            progress.achievementCounts[countField] = progress[field] || 0
          }
        }

        for (const [field, increment] of Object.entries(counterIncrements)) {
          if (increment > 0 && progress.lastActionDates?.[field] === todaySyria) {
            alreadyCompletedToday = true
            return
          }
        }

        for (const [field, increment] of Object.entries(counterIncrements)) {
          progress[field] += increment
          if (increment > 0) {
            progress.lastActionDates[field] = todaySyria
          }
        }

        for (const [field, increment] of Object.entries(counterIncrements)) {
          if (increment <= 0) continue
          const achievementId = actionAchievementByCounter[field]
          const definition = achievementDefinitions[achievementId]
          progress.achievementCounts[definition.countField] += increment
          const userAchievement = user.achievementsProgress[achievementProgressKeyById[achievementId]]
          const legacyTier = progress.achievements[definition.levelField] || 0
          const currentValue = Math.max(
            Number(userAchievement.currentValue) || 0,
            progress.achievementCounts[definition.countField] - increment
          ) + increment
          const currentTier = Math.max(Number(userAchievement.currentTier) || 0, legacyTier)
          const { currentLevel, rewards } = awardAchievementLevels(
            achievementId,
            currentValue,
            currentTier
          )
          progress.achievements[definition.levelField] = currentLevel
          userAchievement.currentValue = currentValue
          userAchievement.currentTier = currentLevel
          achievementRewards.push(...rewards)
        }

        if (
          hasCounterUpdates &&
          dailyActionFields.every((field) => progress.lastActionDates[field] === todaySyria)
        ) {
          progress.perfectDaysCount += 1
          const combo = achievementDefinitions.perfectCombo
          const userAchievement = user.achievementsProgress[achievementProgressKeyById.perfectCombo]
          const currentValue = Math.max(
            Number(userAchievement.currentValue) || 0,
            progress.perfectDaysCount - 1
          ) + 1
          const { currentLevel, rewards } = awardAchievementLevels(
            'perfectCombo',
            currentValue,
            Math.max(
              Number(userAchievement.currentTier) || 0,
              progress.achievements[combo.levelField] || 0
            )
          )
          progress.achievements[combo.levelField] = currentLevel
          userAchievement.currentValue = currentValue
          userAchievement.currentTier = currentLevel
          achievementRewards.push(...rewards)
        }

        const achievementPoints = achievementRewards.reduce((total, reward) => total + reward.amount, 0)

        const actionType = counterIncrements.prayerCount > 0
          ? 'prayer'
          : counterIncrements.bibleCount > 0
            ? 'bible'
            : null
        if (actionType === 'prayer' || actionType === 'bible') {
          const calendarAction = actionType === 'prayer'
            ? { logField: 'prayerDays', title: 'الصلاة' }
            : { logField: 'bibleDays', title: 'قراءة الكتاب المقدس' }
          progress.calendarLogs ||= { prayerDays: [], bibleDays: [] }
          progress.calendarLogs[calendarAction.logField] ||= []
          if (progress.isNew) {
            await progress.save({ session })
          }

          await Progress.updateOne(
            { user: req.user._id },
            { $addToSet: { [`calendarLogs.${calendarAction.logField}`]: todaySyria } },
            { session }
          )

          const monthPrefix = `${monthYear}-`
          const completedDays = new Set(
            [
              ...progress.calendarLogs[calendarAction.logField],
              todaySyria,
            ].filter((date) => date.startsWith(monthPrefix))
          ).size
          const alreadyClaimed = progress.claimedPerfectMonths.some(
            (claim) => claim.actionType === actionType && claim.monthYear === monthYear
          )
          if (completedDays === daysInMonth && !alreadyClaimed) {
            progress.claimedPerfectMonths.push({ actionType, monthYear })
            perfectMonthRewards.push({ actionType, title: calendarAction.title, amount: perfectMonthRewardPoints })
          }
        }

        await progress.save({ session })

        const perfectMonthPoints = perfectMonthRewards.reduce((total, reward) => total + reward.amount, 0)
        const points = actionPoints + achievementPoints + perfectMonthPoints
        if (points > 0) {
          user.totalEarnedPoints += points
        }
        await user.save({ session })
        totalPoints = user.totalPoints
        if (points > 0) {
          if (pointTransactions.length > 0) {
            await PointTransaction.insertMany(pointTransactions, { session })
          }
          await PointLog.insertMany(
            [
              ...pointTransactions.map((transaction) => ({
                userId: req.user._id,
                amount: transaction.points,
                type: transaction.source === 'goodDeed' ? 'good_deed' : transaction.source,
                description: {
                  prayer: 'الصلاة',
                  fasting: 'الصوم',
                  bible: 'قراءة الكتاب المقدس',
                  church: 'الذهاب إلى الكنيسة',
                  goodDeed: 'عمل الرحمة',
                }[transaction.source],
              })),
              ...achievementRewards.map((reward) => ({
                userId: req.user._id,
                amount: reward.amount,
                type: 'achievement',
                description: `إنجاز: ${reward.title} - مستوى ${reward.level}`,
              })),
              ...perfectMonthRewards.map((reward) => ({
                userId: req.user._id,
                amount: reward.amount,
                type: 'perfect_month',
                description: `إكمال شهر كامل 100% - ${reward.title}`,
              })),
            ],
            { session }
          )
        }
      })
    } finally {
      await session.endSession()
    }

    if (alreadyCompletedToday) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_COMPLETED_TODAY',
        message: 'Action already completed today',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث التقدم بنجاح.',
      data: {
        progress,
        totalPoints,
        baseActionPoints: actionPoints,
        awardedPoints: actionPoints
          + achievementRewards.reduce((total, reward) => total + reward.amount, 0)
          + perfectMonthRewards.reduce((total, reward) => total + reward.amount, 0),
        achievementRewards,
        newlyUnlocked: achievementRewards.map((reward) => ({
          achievementId: reward.achievementId,
          name: reward.title,
          level: reward.level,
          points: reward.amount,
        })),
        perfectMonthAchieved: perfectMonthRewards.length > 0,
        perfectMonthAction: perfectMonthRewards[0]?.title ?? null,
        perfectMonthPoints: perfectMonthRewards.reduce((total, reward) => total + reward.amount, 0),
      },
    })
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود.',
      })
    }
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التقدم.',
    })
  }
}

module.exports = {
  getProgress,
  getCalendarDates,
  updateProgress,
  logAction,
  getRewardsProgress,
  getMyAchievementsProgress,
}
