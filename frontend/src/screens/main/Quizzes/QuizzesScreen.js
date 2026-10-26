import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { FontAwesome5 } from '@expo/vector-icons'
import api from '../../../api/apiClient'

const colors = {
  background: '#f0f8ff',
  blue: '#348cb2',
  dark: '#162d50',
  muted: '#63738f',
  card: '#ffffff',
  green: '#27865c',
  amber: '#94620b',
  red: '#b23b37',
}

const clockText = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export default function QuizzesScreen() {
  const navigation = useNavigation()
  const [quiz, setQuiz] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [history, setHistory] = useState([])
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [serverOffset, setServerOffset] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const loadingMoreRef = useRef(false)

  const fetchHistory = useCallback(async (pageNumber) => {
    const isFirstPage = pageNumber === 1
    if (isFirstPage) setLoading(true)
    else {
      if (loadingMoreRef.current) return
      loadingMoreRef.current = true
      setLoadingMore(true)
    }

    try {
      const response = await api.get('/api/quizzes/history', {
        params: { page: pageNumber, limit: 20 },
      })
      const payload = response.data?.data ?? response.data ?? {}
      const submissions = Array.isArray(payload.submissions) ? payload.submissions : []
      const currentPage = Number(payload.currentPage) || pageNumber
      const totalPages = Number(payload.totalPages) || 0

      setHistory((current) => isFirstPage
        ? submissions
        : [...current, ...submissions.filter((item) => !current.some((existing) => existing.id === item.id))])
      setPage(currentPage)
      setHasMore(typeof payload.hasMore === 'boolean' ? payload.hasMore : currentPage < totalPages)
      return true
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'تعذر تحميل سجل الاختبارات.')
      return false
    } finally {
      if (isFirstPage) setLoading(false)
      else {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }, [])

  const loadQuizzes = useCallback(async (isRefresh = false) => {
    setError('')
    if (isRefresh) setRefreshing(true)
    setLoading(true)
    try {
      const [currentResponse] = await Promise.all([
        api.get('/api/quizzes/current'),
        fetchHistory(1),
      ])
      const current = currentResponse.data?.data ?? {}
      setQuiz(current.quiz ?? null)
      setSubmission(current.submission ?? null)
      setServerOffset(new Date(current.serverNow).getTime() - Date.now())
      setNow(Date.now())
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'تعذر تحميل الاختبارات. تحقق من اتصالك وحاول مجددًا.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fetchHistory])

  useEffect(() => {
    loadQuizzes()
  }, [loadQuizzes])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const schedule = useMemo(() => {
    if (!quiz) return null
    const serverNow = now + serverOffset
    const startAt = new Date(quiz.windowStart).getTime()
    const endAt = new Date(quiz.windowEnd).getTime()
    const untilStart = startAt - serverNow
    if (submission?.status === 'in_progress') return { state: 'active', startAt, endAt }
    if (submission && submission.status !== 'in_progress') return { state: 'submitted', startAt, endAt }
    if (serverNow < startAt) {
      return { state: 'upcoming', remaining: untilStart, startAt, endAt }
    }
    if (serverNow <= endAt) return { state: 'active', startAt, endAt }
    return { state: 'ended', startAt, endAt }
  }, [now, quiz, serverOffset, submission])

  const startQuiz = async () => {
    if (!quiz) return
    setError('')
    try {
      const response = await api.post(`/api/quizzes/${quiz.id}/start`)
      const data = response.data?.data
      console.log('Received Remaining Seconds:', data?.remainingSeconds)
      const hasValidRemainingSeconds = Number.isSafeInteger(data?.remainingSeconds) && data.remainingSeconds >= 0
      const durationMinutes = Number(data?.durationMinutes ?? data?.quiz?.durationMinutes)
      if (!hasValidRemainingSeconds && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
        throw new Error('The quiz start response is missing timer data.')
      }
      navigation.navigate('ActiveQuiz', {
        ...data,
      })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'تعذر بدء الاختبار.')
      loadQuizzes(true)
    }
  }

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyTop}>
        <Text style={styles.historyTitle}>{item.title}</Text>
        <Text style={[styles.statusBadge, item.status === 'timed_out' ? styles.timedOutBadge : styles.completedBadge]}>
          {item.status === 'timed_out' ? 'انتهى الوقت' : 'مكتمل'}
        </Text>
      </View>
      <Text style={styles.historyMeta}>{formatDateTimeToEnglish(item.submittedAt)}</Text>
      <Text style={styles.historyScore}>
        العلامة: {Number(item.score ?? 0).toLocaleString('en-US')} / {Number(item.maxScore ?? 0).toLocaleString('en-US')}
        <Text style={styles.historyQuestionCount}> · {item.totalQuestions ?? 0} أسئلة</Text>
      </Text>
    </View>
  )

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchHistory(page + 1)
    }
  }

  const formatDateTimeToEnglish = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date)) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${year}/${month}/${day} ${hours}:${minutes} ${ampm}`;
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="رجوع">
          <FontAwesome5 name="chevron-left" size={17} color={colors.blue} />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>الاختبارات الأسبوعية</Text>
      </View>

      {quiz ? (
        <View style={styles.quizCard}>
          <View style={styles.quizIcon}>
            <FontAwesome5 name="book-open" size={21} color={colors.blue} />
          </View>
          <Text style={styles.quizTitle}>{quiz.title}</Text>
          {!!quiz.description && <Text style={styles.description}>{quiz.description}</Text>}
          <View style={styles.quizStats}>
            <Text style={styles.statText}>الأسئلة: {quiz.totalQuestions}</Text>
            <Text style={styles.statText}>العلامة: {Number(quiz.totalPoints ?? 0).toLocaleString('en-US')}</Text>
            <Text style={styles.statText}>المدة: {quiz.durationMinutes} دقيقة</Text>
          </View>
          <Text style={[styles.availability, schedule?.state === 'active' ? styles.available : null]}>
            {schedule?.state === 'upcoming'
              ? schedule.remaining > 24 * 60 * 60 * 1000
                ? `يبدأ بعد ${Math.ceil(schedule.remaining / (24 * 60 * 60 * 1000))} أيام`
                : `يبدأ خلال ${clockText(schedule.remaining)}`
              : schedule?.state === 'active'
                ? submission?.status === 'in_progress'
                  ? 'لديك محاولة قيد التنفيذ'
                  : 'الاختبار متاح الآن'
                : schedule?.state === 'submitted'
                  ? `تم تقديم الاختبار · علامتك ${Number(submission.score ?? 0).toLocaleString('en-US')} / ${Number(submission.maxScore ?? 0).toLocaleString('en-US')}`
                  : 'انتهى وقت الاختبار'}
          </Text>
          <Text style={styles.windowText}>يفتح: {formatDateTimeToEnglish(quiz.windowStart)}</Text>
          <Text style={styles.windowText}>يغلق: {formatDateTimeToEnglish(quiz.windowEnd)}</Text>
          <TouchableOpacity
            style={[styles.startButton, schedule?.state !== 'active' && styles.disabledButton]}
            onPress={startQuiz}
            disabled={schedule?.state !== 'active'}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>
              {submission?.status === 'in_progress' ? 'متابعة الاختبار' : 'بدء الاختبار'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <FontAwesome5 name="calendar-check" size={28} color={colors.blue} />
          <Text style={styles.emptyText}>لا يوجد اختبار أسبوعي متاح حاليًا</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>سجل الاختبارات السابقة</Text>
      {history.length === 0 && !loading && <Text style={styles.emptyHistory}>لم تشارك في أي اختبار بعد.</Text>}
    </>
  )

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.blue} /></View>
      </View>
    )
  }

  return (
    <View style={styles.safeArea}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadQuizzes(true)}>
            <Text style={styles.startButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderHistoryItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.listFooter} size="small" color={colors.blue} /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadQuizzes(true)} tintColor={colors.blue} />}
      />
    </View>
  )
}

const styles = {
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingBottom: 28 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 18 },
  pageTitle: { color: colors.dark, fontSize: 23, fontWeight: '800', textAlign: 'left' },
  backButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8 },
  backText: { color: colors.blue, fontSize: 15, fontWeight: '700' },
  quizCard: { backgroundColor: colors.card, borderRadius: 22, padding: 20, marginBottom: 24, elevation: 4 },
  quizIcon: { alignSelf: 'flex-start', width: 44, height: 44, borderRadius: 14, backgroundColor: '#eaf6fb', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quizTitle: { color: colors.dark, fontSize: 21, fontWeight: '800', textAlign: 'left' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'left', marginTop: 8 },
  quizStats: { flexDirection: 'row-reverse', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 16, gap: 8 },
  statText: { color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'left' },
  availability: { color: colors.amber, backgroundColor: '#fff6e5', borderRadius: 12, overflow: 'hidden', padding: 12, marginTop: 16, textAlign: 'center', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  available: { color: colors.green, backgroundColor: '#e9f7ef' },
  windowText: { color: colors.muted, marginTop: 8, textAlign: 'left', fontSize: 12 },
  startButton: { marginTop: 18, backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  disabledButton: { backgroundColor: '#aab9c4' },
  startButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  emptyCard: { backgroundColor: colors.card, borderRadius: 22, padding: 28, alignItems: 'center', gap: 12, marginBottom: 24 },
  emptyText: { color: colors.muted, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { color: colors.dark, fontSize: 19, fontWeight: '800', textAlign: 'left', marginBottom: 12 },
  emptyHistory: { color: colors.muted, textAlign: 'center', padding: 18 },
  historyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 10, elevation: 2 },
  historyTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  historyTitle: { color: colors.dark, fontSize: 15, fontWeight: '800', textAlign: 'left', flex: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, overflow: 'hidden', fontSize: 11, fontWeight: '800' },
  completedBadge: { color: colors.green, backgroundColor: '#e9f7ef' },
  timedOutBadge: { color: colors.red, backgroundColor: '#fff0ef' },
  historyMeta: { color: colors.muted, textAlign: 'left', fontSize: 12, marginTop: 8 },
  historyScore: { color: colors.blue, textAlign: 'left', fontSize: 15, fontWeight: '800', marginTop: 8, fontVariant: ['tabular-nums'] },
  historyQuestionCount: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  listFooter: { paddingVertical: 18 },
  errorBox: { padding: 16, backgroundColor: '#fff0ef' },
  errorText: { color: colors.red, textAlign: 'left', lineHeight: 22 },
  retryButton: { alignSelf: 'flex-end', backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, marginTop: 10 },
}
