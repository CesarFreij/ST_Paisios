import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { FontAwesome5 } from '@expo/vector-icons'
import api from '../../../api/apiClient'
import { cacheKnownPoints } from '../../../utils/pointBalanceCache'
import { useUserPoints } from '../../../context/UserPointsContext'

const palette = {
  background: '#f0f8ff',
  blue: '#348cb2',
  dark: '#162d50',
  muted: '#63738f',
  red: '#bd3535',
  green: '#27865c',
  white: '#ffffff',
}

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = safeSeconds % 60
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':')
}

export default function ActiveQuizScreen() {
  const { setUser } = useUserPoints()
  const navigation = useNavigation()
  const route = useRoute()
  const {
    quiz,
    submissionId,
    remainingSeconds: serverRemainingSeconds,
    durationMinutes: receivedDurationMinutes,
  } = route.params || {}
  const questions = quiz?.questions ?? []
  const durationMinutes = Number(receivedDurationMinutes ?? quiz?.durationMinutes)
  const getInitialSeconds = () => {
    if (Number.isSafeInteger(serverRemainingSeconds) && serverRemainingSeconds >= 0) {
      return serverRemainingSeconds
    }
    return Number.isFinite(durationMinutes) && durationMinutes > 0
      ? Math.floor(durationMinutes * 60)
      : 0
  }
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null))
  const [secondsRemaining, setSecondsRemaining] = useState(getInitialSeconds)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const answersRef = useRef(answers)
  const submittingRef = useRef(false)
  const timedOutRef = useRef(false)
  const submitRef = useRef(null)
  const userIdRef = useRef(null)
  useEffect(() => {
    let active = true
    api.get('/api/auth/me')
      .then((response) => {
        const currentUser = response.data?.data
        const userId = currentUser?.id ?? currentUser?._id
        if (active && currentUser) setUser(currentUser)
        if (active && userId) userIdRef.current = userId
      })
      .catch((error) => {
        console.error('Failed to load the current user for weekly quiz points caching:', error)
      })
    return () => {
      active = false
    }
  }, [])

  const returnToExams = useCallback(() => {
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'WeeklyExam' }],
    })
  }, [navigation])

  const submitAttempt = useCallback(async (timedOut = false) => {
    if (submittingRef.current || result || !submissionId || !quiz?.id) return
    submittingRef.current = true
    if (timedOut) timedOutRef.current = true
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const response = await api.post(`/api/quizzes/${quiz.id}/submit`, {
        submissionId,
        answers: answersRef.current,
        status: timedOut ? 'timed_out' : 'completed',
      })
      const resultData = response.data?.data
      if (!resultData || typeof resultData !== 'object') {
        throw new Error('The quiz submission response did not include result data.')
      }
      const submission = resultData?.submission ?? null
      if (!submission) {
        throw new Error('The quiz submission response did not include a result.')
      }
      const totalPoints = Number(resultData.totalPoints)
      if (Number.isSafeInteger(totalPoints)) {
        const responseMaxPoints = Number(resultData.maxPoints)
        setUser((current) => current
          ? {
              ...current,
              totalPoints,
              maxPoints: Math.max(
                Number(current.maxPoints) || 0,
                Number.isSafeInteger(responseMaxPoints) ? responseMaxPoints : 0,
                totalPoints
              ),
            }
          : {
              totalPoints,
              maxPoints: Math.max(
                Number.isSafeInteger(responseMaxPoints) ? responseMaxPoints : 0,
                totalPoints
              ),
            })
        try {
          if (!userIdRef.current) {
            const userResponse = await api.get('/api/auth/me')
            userIdRef.current = userResponse.data?.data?.id ?? userResponse.data?.data?._id
          }
          await cacheKnownPoints(userIdRef.current, totalPoints)
        } catch (cacheError) {
          console.error('Failed to cache the points balance after weekly quiz submission:', cacheError)
        }
      } else {
        console.error('Weekly quiz submission response contained an invalid points balance:', resultData.totalPoints)
      }
      setResult(submission)
    } catch (requestError) {
      setSubmitError(requestError.response?.data?.message || 'تعذر إرسال إجاباتك. تحقق من اتصالك ثم أعد المحاولة.')
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }, [quiz?.id, result, setUser, submissionId])

  submitRef.current = submitAttempt

  useEffect(() => {
    const handleHardwareBack = () => {
      if (!isSubmitting) navigation.replace('WeeklyExam')
      return true
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack)
    return () => backHandler.remove()
  }, [isSubmitting, navigation])

  useEffect(() => {
    setSecondsRemaining(getInitialSeconds())
  }, [serverRemainingSeconds, receivedDurationMinutes, quiz?.durationMinutes])

  useEffect(() => {
    if (result || isSubmitting) return undefined
    const interval = setInterval(() => {
      setSecondsRemaining((remaining) => Math.max(0, remaining - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [isSubmitting, result])

  useEffect(() => {
    if (secondsRemaining > 0 || result || isSubmitting || timedOutRef.current) return
    timedOutRef.current = true
    submitRef.current?.(true)
  }, [isSubmitting, result, secondsRemaining])

  const chooseAnswer = (questionIndex, optionIndex) => {
    if (isSubmitting || timedOutRef.current || result) return
    const updated = [...answersRef.current]
    updated[questionIndex] = optionIndex
    answersRef.current = updated
    setAnswers(updated)
  }

  if (!quiz || !submissionId || questions.length === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>بيانات الاختبار غير مكتملة.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('WeeklyExam')}>
            <Text style={styles.primaryButtonText}>العودة إلى الاختبارات</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const score = result?.score ?? 0
  const maxScore = result?.maxScore ?? quiz.totalPoints ?? 0
  const passed = maxScore > 0 && (score / maxScore) * 100 >= 80

  return (
    <View style={styles.safeArea}>
      <View style={styles.stickyHeader}>
        <TouchableOpacity
          onPress={() => navigation.replace('WeeklyExam')}
          style={styles.backButton}
          disabled={isSubmitting}
        >
          <FontAwesome5 name={Platform.OS === 'web' ? 'chevron-right' : 'chevron-left'} size={16} color={palette.blue} />
          <Text style={styles.backText}>الاختبارات</Text>
        </TouchableOpacity>
        <View style={styles.timerWrap}>
          <FontAwesome5 name="clock" size={16} color={secondsRemaining <= 60 ? palette.red : palette.blue} />
          <Text style={[styles.timer, secondsRemaining <= 60 && styles.timerWarning]}>
            {formatTime(secondsRemaining)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{quiz.title}</Text>
        <Text style={styles.instructions}>أجب عن الأسئلة قبل انتهاء الوقت. يمكنك ترك أي سؤال دون إجابة.</Text>

        {questions.map((question, questionIndex) => (
          <View key={`${questionIndex}-${question.questionText}`} style={styles.questionCard}>
            <View style={styles.questionMeta}>
              <Text style={styles.questionNumber}>السؤال {questionIndex + 1} من {questions.length}</Text>
              <Text style={styles.points}>{Number(question?.points ?? 1).toLocaleString('en-US')} نقاط</Text>
            </View>
            <Text style={styles.questionText}>{question.questionText}</Text>
            {question.options.map((option, optionIndex) => {
              const selected = answers[questionIndex] === optionIndex
              return (
                <TouchableOpacity
                  key={`${optionIndex}-${option}`}
                  style={[styles.option, selected && styles.optionSelected, (isSubmitting || timedOutRef.current || result) && styles.optionLocked]}
                  onPress={() => chooseAnswer(questionIndex, optionIndex)}
                  disabled={isSubmitting || timedOutRef.current || Boolean(result)}
                  activeOpacity={0.82}
                >
                  <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
                    {selected && <View style={styles.optionRadioDot} />}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}

        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submitError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => submitAttempt(timedOutRef.current)}
              disabled={isSubmitting}
            >
              {isSubmitting && <ActivityIndicator color={palette.white} />}
              <Text style={styles.primaryButtonText}>إعادة الإرسال</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
          onPress={() => submitAttempt(false)}
          disabled={isSubmitting || Boolean(result)}
          activeOpacity={0.85}
        >
          {isSubmitting && <ActivityIndicator color={palette.white} />}
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'جارٍ إرسال الإجابات...' : 'تسليم الاختبار'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={Boolean(result)}
        transparent
        animationType="fade"
        onRequestClose={returnToExams}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModal}>
            <FontAwesome5
              name={passed ? 'trophy' : result?.status === 'timed_out' ? 'clock' : 'clipboard-check'}
              size={42}
              color={passed ? '#d29b27' : palette.blue}
            />
            <Text style={styles.resultTitle}>{passed ? 'أحسنت! 🎉' : 'تم تسجيل نتيجتك'}</Text>
            <Text style={styles.resultScore}>
              حصلت على {Number(score).toLocaleString('en-US')} من {Number(maxScore).toLocaleString('en-US')}
            </Text>
            <Text style={styles.resultStatus}>
              {result?.status === 'timed_out' ? 'تم التسليم تلقائيًا عند انتهاء الوقت.' : 'اكتمل الاختبار بنجاح.'}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={returnToExams}>
              <Text style={styles.primaryButtonText}>العودة إلى الاختبارات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = {
  safeArea: { flex: 1, backgroundColor: palette.background },
  stickyHeader: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.white, elevation: 5, zIndex: 2 },
  backButton: { flexDirection: 'row-reverse', ...Platform.select({ web: { flexDirection: 'row' }, default: {} }), alignItems: 'center', gap: 8, paddingVertical: 10 },
  backText: { color: palette.blue, fontWeight: '700', ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  timerWrap: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#edf6fa', borderRadius: 12 },
  timer: { color: palette.blue, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerWarning: { color: palette.red },
  content: { padding: 18, paddingBottom: 36 },
  title: { color: palette.dark, fontSize: 23, fontWeight: '900', textAlign: 'left', marginTop: 8, ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  instructions: { color: palette.muted, fontSize: 14, lineHeight: 22, textAlign: 'left', marginTop: 8, marginBottom: 18, ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  questionCard: { backgroundColor: palette.white, borderRadius: 18, padding: 17, marginBottom: 14, elevation: 2 },
  questionMeta: { flexDirection: 'row-reverse', ...Platform.select({ web: { flexDirection: 'row' }, default: {} }), justifyContent: 'space-between', marginBottom: 12 },
  questionNumber: { color: palette.blue, fontSize: 12, fontWeight: '800', ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  points: { color: palette.muted, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  questionText: { color: palette.dark, fontSize: 17, fontWeight: '800', textAlign: 'left', lineHeight: 26, marginBottom: 14, ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  option: { minHeight: 48, flexDirection: 'row-reverse', ...Platform.select({ web: { flexDirection: 'row' }, default: {} }), alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#dce8ee', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 8 },
  optionSelected: { borderColor: palette.blue, backgroundColor: '#edf8fc' },
  optionLocked: { opacity: 0.72 },
  optionRadio: { width: 20, height: 20, borderWidth: 2, borderColor: '#93a7b4', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionRadioSelected: { borderColor: palette.blue },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.blue },
  optionText: { color: palette.dark, fontSize: 15, textAlign: 'left', flex: 1, ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  optionTextSelected: { color: palette.blue, fontWeight: '800', ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  primaryButton: { minHeight: 50, backgroundColor: palette.blue, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13, marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonDisabled: { backgroundColor: '#95adba' },
  primaryButtonText: { color: palette.white, textAlign: 'center', fontWeight: '800', fontSize: 15 },
  errorBox: { backgroundColor: '#fff0ef', borderRadius: 14, padding: 14, marginTop: 8 },
  errorText: { color: palette.red, textAlign: 'left', lineHeight: 21, ...Platform.select({ web: { textAlign: 'right' }, default: {} }) },
  retryButton: { alignSelf: 'flex-end', ...Platform.select({ web: { alignSelf: 'flex-start' }, default: {} }), flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.blue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginTop: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(8,24,39,0.58)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  resultModal: { width: '100%', maxWidth: 420, backgroundColor: palette.white, borderRadius: 24, padding: 26, alignItems: 'center' },
  resultTitle: { color: palette.dark, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  resultScore: { color: palette.blue, fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 12, fontVariant: ['tabular-nums'] },
  resultStatus: { color: palette.muted, textAlign: 'center', marginTop: 10, lineHeight: 21 },
}
