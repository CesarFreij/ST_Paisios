import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Check, CircleHelp, Clock3, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/apiClient.js'
import PaginationBar from '../components/PaginationBar.jsx'
import { formatCustomDate } from '../utils/dateFormatter.js'

const ITEMS_PER_PAGE = 20
const EMPTY_PAGINATION = { totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: ITEMS_PER_PAGE }
const getErrorMessage = (error) => error.response?.data?.message || 'تعذر تحميل نتائج الاختبار.'

function submissionTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function durationLabel(submission) {
  if (!submission.startedAt || !submission.submittedAt) return '—'
  const seconds = Math.max(0, Math.floor((new Date(submission.submittedAt) - new Date(submission.startedAt)) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function QuizResultsManagement() {
  const { quizType, quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [reloadKey, setReloadKey] = useState(0)
  const [submissions, setSubmissions] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [pagination, setPagination] = useState(EMPTY_PAGINATION)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backPath = quizType === 'weekly' ? '/weekly-quizzes' : '/questions'
  const typeLabel = quizType === 'weekly' ? 'اختبار أسبوعي' : 'اختبار يومي'
  const validRoute = ['daily', 'weekly'].includes(quizType) && /^[a-f\d]{24}$/i.test(quizId || '')

  useEffect(() => {
    let active = true
    if (!validRoute) {
      return () => { active = false }
    }

    const loadSubmissions = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/admin/quiz-submissions/${quizType}/${quizId}`, {
          params: { page: currentPage, limit: ITEMS_PER_PAGE },
        })
        if (active) {
          const nextPagination = response.data?.pagination || EMPTY_PAGINATION
          const lastPage = Math.max(1, nextPagination.totalPages)
          if (currentPage > lastPage) {
            setCurrentPage(lastPage)
            return
          }
          setSubmissions(Array.isArray(response.data?.data) ? response.data.data : [])
          setPagination(nextPagination)
          setQuiz(response.data?.quiz || null)
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSubmissions()
    return () => { active = false }
  }, [currentPage, quizId, quizType, validRoute, reloadKey])

  return (
    <section dir="rtl" className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <button type="button" onClick={() => navigate(backPath)} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800">
            <ArrowRight size={17} /> العودة إلى قائمة الاختبارات
          </button>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-700"><CircleHelp size={17} /> نتائج وتسليمات {typeLabel}</p>
          <h2 className="max-w-3xl text-2xl font-bold leading-relaxed text-ink sm:text-3xl">{quiz?.title || location.state?.quizTitle || typeLabel}</h2>
          <p className="mt-2 text-sm text-muted">إجابات المشاركين وتفاصيل كل سؤال.</p>
        </div>
        <div className="rounded-xl border border-line bg-white px-4 py-2.5">
          <p className="text-xs text-muted">إجمالي التسليمات</p>
          <p className="mt-0.5 font-sans text-lg font-extrabold text-ink">{loading ? '—' : pagination.totalItems.toLocaleString('en-US')}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36 }}
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(25,61,53,0.045)]"
      >
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h3 className="font-bold text-ink">قائمة المشاركين</h3>
          <p className="mt-1 text-xs text-muted">اضغط على تفاصيل أي مشارك لمراجعة إجاباته لكل سؤال.</p>
        </div>

        {loading && validRoute ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted" role="status">
            <LoaderCircle size={30} className="animate-spin text-primary-700" />
            <p className="text-sm">جارٍ تحميل التسليمات...</p>
          </div>
        ) : !validRoute || error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center" role="alert">
            <AlertCircle size={24} className="mb-3 text-[#a84731]" />
            <p className="max-w-lg text-sm leading-6 text-ink">{validRoute ? error : 'نوع الاختبار أو معرّفه غير صالح.'}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-800">
              <RefreshCw size={15} /> إعادة المحاولة
            </button>
          </div>
        ) : pagination.totalItems === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <CircleHelp size={26} className="mb-3 text-primary-700" />
            <p className="font-bold text-ink">لا توجد تسليمات لهذا الاختبار</p>
            <p className="mt-1 text-sm text-muted">ستظهر النتائج هنا بعد أن يرسل المستخدمون إجاباتهم.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse text-center">
                <thead className="bg-[#f7f8f5] text-xs font-bold text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-center">المشارك</th>
                    <th scope="col" className="px-5 py-3.5 text-center">النتيجة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">النسبة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">المدة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الحالة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">تاريخ ووقت التسليم</th>
                    <th scope="col" className="px-5 py-3.5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {submissions.map((submission) => {
                    const isExpanded = expandedId === submission._id
                    const user = submission.user
                    return (
                      <ParticipantRows
                        key={submission._id}
                        submission={submission}
                        user={user}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedId(isExpanded ? null : submission._id)}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar
              {...pagination}
              onPageChange={(page) => {
                setCurrentPage(page)
                setExpandedId(null)
              }}
            />
          </>
        )}
      </motion.div>
    </section>
  )
}

function ParticipantRows({ submission, user, isExpanded, onToggle }) {
  return (
    <>
      <tr className="transition-colors hover:bg-[#f7f9f6]">
        <td className="px-5 py-4 text-center">
          <p className="font-bold text-ink">{user?.username || 'مستخدم غير متاح'}</p>
          <p className="mt-0.5 text-xs text-muted">{user?.title || '—'}</p>
        </td>
        <td className="px-5 py-4 text-center">
          <span className="font-sans text-sm font-bold tabular-nums text-ink">
            {Number(submission.score).toLocaleString('en-US')} / {Number(submission.maxScore).toLocaleString('en-US')}
          </span>
        </td>
        <td className="px-5 py-4 text-center">
          <span className="rounded-full bg-primary-50 px-3 py-1 font-sans text-sm font-bold tabular-nums text-primary-700">
            {Number(submission.percentage).toLocaleString('en-US')}%
          </span>
        </td>
        <td className="px-5 py-4 text-center font-sans text-sm text-muted">{durationLabel(submission)}</td>
        <td className="px-5 py-4 text-center">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${submission.status === 'timed_out' ? 'bg-rose-50 text-rose-700' : submission.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {submission.status === 'timed_out' ? 'انتهى الوقت' : submission.status === 'in_progress' ? 'قيد التنفيذ' : 'مكتمل'}
          </span>
        </td>
        <td className="px-5 py-4 text-center text-sm text-muted">
          <span className="inline-flex items-center justify-center gap-2 font-sans">
            <Clock3 size={15} />
            {formatCustomDate(submission.submittedAt || submission.startedAt)} · {submissionTime(submission.submittedAt || submission.startedAt)}
          </span>
        </td>
        <td className="px-5 py-4 text-center">
          <button type="button" onClick={onToggle} aria-expanded={isExpanded} className="rounded-lg border border-primary-200/60 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50">
            {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-canvas/60 px-4 py-5 text-center sm:px-6">
            <div className="mx-auto max-w-4xl space-y-3">
              {submission.answers.map((answer, index) => (
                <div key={`${submission._id}-${index}`} className="rounded-xl border border-line bg-white p-4 text-center">
                  <p className="text-sm font-bold leading-6 text-ink">
                    <span className="me-2 font-sans text-xs text-muted">{(index + 1).toLocaleString('en-US')}.</span>
                    {answer.questionText}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${answer.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {answer.isCorrect ? <Check size={16} /> : <X size={16} />}
                      <span className="font-semibold">إجابة المشارك:</span> {answer.selectedOption || 'لم تتم الإجابة'}
                    </p>
                    <p className="flex items-center justify-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-primary-800">
                      <Check size={16} />
                      <span className="font-semibold">الإجابة الصحيحة:</span> {answer.correctOption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
