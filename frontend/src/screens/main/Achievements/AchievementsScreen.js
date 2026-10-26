import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import api from '../../../api/apiClient'
import { formatArabicPoints } from '../../../utils/formatArabicPoints'
import styles from './styles'

const achievementCards = [
  { id: 'prayer', rewardKey: 'prayer', targetKey: 'prayer', countKey: 'prayerCount', title: 'المصلي الدائم', icon: 'praying-hands', iconSet: FontAwesome5 },
  { id: 'fasting', rewardKey: 'fasting', targetKey: 'fasting', countKey: 'fastingCount', title: 'الصائم الملتزم', icon: 'moon', iconSet: FontAwesome5 },
  { id: 'bible', rewardKey: 'bible', targetKey: 'bible', countKey: 'bibleCount', title: 'محب الكلمة', icon: 'bible', iconSet: FontAwesome5 },
  { id: 'church', rewardKey: 'church', targetKey: 'church', countKey: 'churchCount', title: 'ابن الكنيسة', icon: 'church', iconSet: FontAwesome5 },
  { id: 'goodDeed', rewardKey: 'mercy', targetKey: 'goodDeed', countKey: 'goodDeedCount', title: 'القلب الرحيم', icon: 'hand-holding-heart', iconSet: FontAwesome6 },
  { id: 'perfectDay', rewardKey: 'perfectCombo', targetKey: 'perfectDay', countKey: 'perfectDaysCount', title: 'اليوم المثالي', icon: 'star', iconSet: FontAwesome5 },
]

const defaultAchievementTargets = {
  prayer: [10, 30, 100],
  fasting: [10, 30, 100],
  bible: [10, 30, 100],
  church: [10, 30, 100],
  goodDeed: [10, 30, 100],
  perfectDay: [10, 30, 100],
}
const defaultAchievementRewards = {
  prayer: [30, 100, 500],
  fasting: [30, 100, 500],
  bible: [30, 100, 500],
  church: [30, 100, 500],
  mercy: [30, 100, 500],
  perfectCombo: [30, 100, 500],
}
const defaultGrandPrizeMilestones = [
  { level: 1, name: 'مواظب', pointsNeeded: 1000 },
  { level: 2, name: 'متقدم', pointsNeeded: 3500 },
  { level: 3, name: 'متميز', pointsNeeded: 8000 },
  { level: 4, name: 'رائد', pointsNeeded: 14000 },
  { level: 5, name: 'بطل السنة', pointsNeeded: 20000 },
]
const achievementCountKeys = {
  prayer: 'prayerCount',
  fasting: 'fastingCount',
  bible: 'bibleCount',
  church: 'churchCount',
  goodDeed: 'goodDeedCount',
  perfectDay: 'perfectDaysCount',
}
const textStyles = { textAlign: 'right', writingDirection: 'rtl' }
const formatPoints = (points) => Number(points || 0).toLocaleString('en-US')

export default function AchievementsScreen() {
  const navigation = useNavigation()
  const [payload, setPayload] = useState(null)
  const [userTotalPoints, setUserTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const trailAnimation = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      let active = true
      const loadProgress = async () => {
        setLoading(true)
        setError('')
        try {
          const [response, userResponse] = await Promise.all([
            api.get('/api/achievements/my-progress'),
            api.get('/api/auth/me'),
          ])
          console.log('Raw Achievements:', response.data)
          const responseData = response.data ?? {}
          const result = responseData.data ?? responseData
          const currentUser = userResponse.data?.data
          const achievements = responseData.achievements
            ?? responseData.progress
            ?? result.achievementsProgress
            ?? result.userAchievements
            ?? {}
          const targets = {
            ...defaultAchievementTargets,
            ...result.globalConfig?.achievementTargets,
          }
          const achievementRewards = {
            ...defaultAchievementRewards,
            ...result.globalConfig?.achievementRewards,
          }
          const milestones = result.globalConfig?.grandPrizeMilestones ?? defaultGrandPrizeMilestones
          const userStats = result.userStats ?? result.progress ?? {}
          const userAchievements = result.userAchievements ?? achievements
          const achievementsProgress = Object.fromEntries(
            achievementCards.map((item) => {
              const saved = result.achievementsProgress?.[item.id] ?? achievements?.[item.id] ?? {}
              return [
                item.id,
                {
                  currentValue: Math.max(
                    0,
                    Number(saved.currentValue ?? userStats[achievementCountKeys[item.id]]) || 0
                  ),
                  currentTier: Math.min(
                    3,
                    Math.max(0, Number(saved.currentTier ?? userAchievements?.[item.id]) || 0)
                  ),
                },
              ]
            })
          )
          const normalizedResult = {
            ...result,
            globalConfig: {
              ...result.globalConfig,
              achievementTargets: targets,
              achievementRewards,
              grandPrizeMilestones: milestones,
            },
            achievementsProgress,
            userStats: {
              ...userStats,
              ...Object.fromEntries(
                achievementCards.map((item) => [
                  achievementCountKeys[item.id],
                  achievementsProgress[item.id].currentValue,
                ])
              ),
              totalEarnedPoints: Number(userStats.totalEarnedPoints) || 0,
            },
            userAchievements: Object.fromEntries(
              achievementCards.map((item) => [
                item.id,
                achievementsProgress[item.id].currentTier,
              ])
            ),
          }
          if (active) {
            setPayload(normalizedResult)
            setUserTotalPoints(Number(currentUser?.totalPoints) || 0)
          }
        } catch (requestError) {
          console.error('Failed to load achievements progress:', requestError)
          if (active) setError('تعذر تحميل الإنجازات ومسار الجوائز.')
        } finally {
          if (active) setLoading(false)
        }
      }

      loadProgress()
      return () => {
        active = false
      }
    }, [retryKey])
  )

  const globalConfig = payload?.globalConfig
  const userStats = payload?.userStats
  const userAchievements = payload?.userAchievements
  const milestones = globalConfig?.grandPrizeMilestones ?? []
  const totalEarnedPoints = Number(userStats?.totalEarnedPoints || 0)
  const highestMilestone = milestones.reduce(
    (highest, milestone) => Math.max(highest, Number(milestone.pointsNeeded) || 0),
    0
  )
  const trailPercent = highestMilestone > 0
    ? Math.min(100, (totalEarnedPoints / highestMilestone) * 100)
    : 0

  useEffect(() => {
    Animated.timing(trailAnimation, {
      toValue: trailPercent,
      duration: 700,
      useNativeDriver: false,
    }).start()
  }, [trailAnimation, trailPercent])

  const currentMilestone = [...milestones].reverse()
    .find((milestone) => totalEarnedPoints >= milestone.pointsNeeded)
  const nextMilestone = milestones.find((milestone) => totalEarnedPoints < milestone.pointsNeeded)

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
            <Text style={[styles.backText, textStyles]}>رجوع</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles]}>الإنجازات والألقاب</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#348cb2" />
        </View>
      </View>
    )
  }

  if (error || !payload) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
            <Text style={[styles.backText, textStyles]}>رجوع</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, textStyles]}>الإنجازات والألقاب</Text>
        </View>
        <View style={styles.stateContainer}>
          <Text style={[styles.stateText, textStyles]}>{error || 'تعذر تحميل البيانات.'}</Text>
          <TouchableOpacity
            onPress={() => setRetryKey((current) => current + 1)}
            style={styles.retryButton}
            accessibilityRole="button"
          >
            <Text style={[styles.retryText, textStyles]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
          <Text style={[styles.backText, textStyles]}>رجوع</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles]}>الإنجازات والألقاب</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, textStyles]}>الإنجازات</Text>
          <FontAwesome5 name="medal" size={19} color="#d69e16" style={{marginRight: 'auto'}}/>
        </View>

        {achievementCards.map((item) => {
          const targetList = globalConfig.achievementTargets[item.targetKey] ?? defaultAchievementTargets[item.targetKey]
          const rewardList = globalConfig.achievementRewards?.[item.rewardKey] ?? defaultAchievementRewards[item.rewardKey]
          const achievementProgress = payload.achievementsProgress?.[item.id] ?? { currentValue: 0, currentTier: 0 }
          const level = Math.min(3, Math.max(0, Number(
            achievementProgress?.currentTier ?? userAchievements[item.id]
          ) || 0))
          const count = Math.max(0, Number(
            achievementProgress?.currentValue ?? userStats[item.countKey]
          ) || 0)
          const nextTierIndex = targetList.findIndex((target) => count < Number(target))
          const nextTarget = nextTierIndex >= 0 ? Number(targetList[nextTierIndex]) : null
          const rewardValue = nextTierIndex >= 0 ? Number(rewardList[nextTierIndex]) : null
          const progressPercent = nextTarget
            ? Math.min(100, (count / nextTarget) * 100)
            : 100
          const Icon = item.iconSet

          return (
            <View key={item.id} style={styles.achievementCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Icon name={item.icon} size={22} color="#348cb2" />
                </View>
                <View style={styles.cardHeading}>
                  <Text style={[styles.cardTitle, textStyles]}>{item.title}</Text>
                  <Text style={[styles.cardDescription, textStyles]}>
                    {nextTarget === null
                      ? 'اكتمل الإنجاز'
                      : Number.isSafeInteger(rewardValue) && rewardValue > 0
                        ? `مكافأة الهدف القادم: ${formatArabicPoints(rewardValue)}`
                        : 'مكافأة الهدف القادم'}
                  </Text>
                </View>
              </View>

              <View style={styles.starsRow} accessibilityLabel={`مستوى ${level} من 3`}>
                <Text style={[styles.levelText, textStyles]}>{level} / 3 نجوم</Text>
                {[1, 2, 3].map((star) => (
                  <FontAwesome
                    key={star}
                    name="star"
                    size={22}
                    color={star <= level ? '#e5ad1f' : '#c7cdd5'}
                  />
                ))}
              </View>

              <View style={styles.countRow}>
                <Text style={[styles.countText, textStyles]}>
                  {nextTarget === null
                    ? `أكملت ${formatPoints(count)} / MAX`
                    : `أكملت ${formatPoints(count)} / ${formatPoints(nextTarget)}`}
                </Text>
                <Text style={[styles.nextTierText, textStyles]}>
                  {nextTarget === null ? 'اكتمل الإنجاز' : `المستوى التالي: ${level + 1}`}
                </Text>
              </View>
              <View
                style={styles.achievementTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: nextTarget ?? count,
                  now: nextTarget === null ? count : Math.min(count, nextTarget),
                }}
              >
                <View style={[styles.achievementFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )
        })}

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, textStyles]}>المسار السنوي</Text>
          <FontAwesome5 name="trophy" size={19} color="#d69e16" />
        </View>

        <View style={styles.pathCard}>
          <View style={styles.pathSummary}>
            <Text style={[styles.pointsTotal, textStyles]}>
              {formatPoints(userTotalPoints)} نقطة مكتسبة
            </Text>
            {currentMilestone ? (
              <Text style={[styles.currentTitle, textStyles]}>{currentMilestone.name}</Text>
            ) : null}
          </View>
          <View style={styles.pathTrack}>
            {milestones.map((milestone, index) => {
              const reached = totalEarnedPoints >= milestone.pointsNeeded
              const segmentStart = (index / Math.max(milestones.length - 1, 1)) * 100
              const segmentEnd = ((index + 1) / Math.max(milestones.length - 1, 1)) * 100
              return (
                <View key={milestone.level} style={styles.milestoneItem}>
                  {index < milestones.length - 1 ? (
                    <View style={styles.milestoneConnector}>
                      <Animated.View
                        style={[
                          styles.milestoneConnectorFill,
                          {
                            height: trailAnimation.interpolate({
                              inputRange: [segmentStart, segmentEnd],
                              outputRange: ['0%', '100%'],
                              extrapolate: 'clamp',
                            }),
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                  <View style={styles.milestoneRow}>
                    <View style={[styles.milestoneDot, reached ? styles.milestoneUnlocked : styles.milestoneLocked]}>
                      {reached
                        ? <FontAwesome name="check" size={13} color="#ffffff" />
                        : <Text style={[styles.milestoneNumber, textStyles]}>{milestone.level}</Text>}
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={[styles.milestoneName, textStyles, reached && styles.milestoneNameUnlocked]}>
                        {milestone.name}
                      </Text>
                      <Text style={[styles.milestonePoints, textStyles]}>
                        {formatPoints(milestone.pointsNeeded)} نقطة
                      </Text>
                    </View>
                    <Text style={[styles.milestoneStatus, textStyles, reached && styles.milestoneNameUnlocked]}>
                      {reached ? 'تم الفتح' : 'مقفلة'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
          <Text style={[styles.pathHint, textStyles]}>
            {nextMilestone
              ? `باقي ${formatPoints(nextMilestone.pointsNeeded - totalEarnedPoints)} نقطة للوصول إلى ${nextMilestone.name}`
              : 'أحسنت! وصلت إلى أعلى مستوى في المسار السنوي.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
