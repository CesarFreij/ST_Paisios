import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CalendarClock, ClipboardList, Clock3, Eye, LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import api from '../api/apiClient.js'
import ManagementModal from '../components/ManagementModal.jsx'
import { formatCustomDate, formatRTLTime } from '../utils/dateFormatter.js'
import PaginationBar from '../components/PaginationBar.jsx'

const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const getErrorMessage = (error) => error.response?.data?.message || 'تعذر الاتصال بالخادم. تحقق من صلاحية المسؤول واتصال الشبكة.'
const ITEMS_PER_PAGE = 20
const emptyPagination = { totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: ITEMS_PER_PAGE }

const createQuestion = () => ({ question: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 })

// هنا فكرتك الذكية: استخراج تاريخ اليوم افتراضياً
const localToday = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
// تطبيق تاريخ اليوم وأوقات افتراضية لكي لا تظهر الخانات فارغة أبداً
const createForm = () => ({ title: '', description: '', windowStart: `${localToday()}T08:00`, windowEnd: `${localToday()}T22:00`, durationMinutes: '10', isActive: true, questions: [createQuestion()] })

function localDateTimeValue(value, fallbackDate, fallbackTime) {
  if (!value) return ''
  try {
    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return `${fallbackDate}T${fallbackTime}`
  }
}

function getScheduleStatus(exam) {
  const start = exam.windowStart
    ? new Date(exam.windowStart)
    : new Date(`${localDateTimeValue(exam.examDate, localToday(), '00:00')}`)
  const end = exam.windowEnd
    ? new Date(exam.windowEnd)
    : new Date(`${localDateTimeValue(exam.examDate, localToday(), '23:59')}`)
  const now = new Date()

  if (exam.isActive === false) return { label: 'غير نشط', className: 'bg-canvas text-muted' }
  if (now < start) return { label: 'قادم', className: 'bg-[#fff6e9] text-[#8d6426]' }
  if (now <= end) return { label: 'مفتوح الآن', className: 'bg-primary-50 text-primary-700' }
  return { label: 'انتهى', className: 'bg-canvas text-muted' }
}

export default function WeeklyQuizzesManagement() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [deletingExam, setDeletingExam] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(createForm)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(emptyPagination)

  useEffect(() => {
    let active = true
    const loadExams = async () => {
      setLoading(true)
      try {
        const response = await api.get('/admin/quizzes', { params: { page: currentPage, limit: ITEMS_PER_PAGE } })
        if (active) {
          const nextPagination = response.data?.pagination || emptyPagination
          const lastPage = Math.max(1, nextPagination.totalPages)
          if (currentPage > lastPage) {
            setCurrentPage(lastPage)
            return
          }
          setExams(Array.isArray(response.data?.data) ? response.data.data : [])
          setPagination(nextPagination)
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadExams()
    return () => { active = false }
  }, [currentPage, reloadKey])

  const refreshExams = () => {
    setError('')
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  const openCreateModal = () => {
    setEditingExam(null)
    setForm(createForm())
    setModalOpen(true)
  }

  const openEditModal = (exam) => {
    setEditingExam(exam)
    setForm({
      title: exam.title || '',
      description: exam.description || '',
      windowStart: exam.windowStart
        ? localDateTimeValue(exam.windowStart)
        : localDateTimeValue(exam.examDate, localToday(), exam.startTime || '08:00'),
      windowEnd: exam.windowEnd
        ? localDateTimeValue(exam.windowEnd)
        : localDateTimeValue(exam.examDate, localToday(), exam.endTime || '22:00'),
      durationMinutes: String(exam.durationMinutes ?? 10),
      isActive: exam.isActive !== false,
      questions: exam.questions?.length
        ? exam.questions.map((question) => ({
          question: question.questionText || question.question || '',
          options: Array.from({ length: 4 }, (_, index) => question.options?.[index] || ''),
          correctOptionIndex: Number(question.correctOptionIndex ?? 0),
          points: Number(question.points ?? 1),
        }))
        : [createQuestion()],
    })
    setModalOpen(true)
  }

  const updateQuestion = (questionIndex, updates) => {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, index) => index === questionIndex ? { ...question, ...updates } : question),
    }))
  }

  const updateOption = (questionIndex, optionIndex, value) => {
    const question = form.questions[questionIndex]
    updateQuestion(questionIndex, {
      options: question.options.map((option, index) => index === optionIndex ? value : option),
    })
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingExam(null)
  }

  const saveExam = async (event) => {
    event.preventDefault()
    const windowStart = new Date(form.windowStart)
    const windowEnd = new Date(form.windowEnd)
    if (!Number.isFinite(windowStart.getTime()) || !Number.isFinite(windowEnd.getTime()) || windowEnd <= windowStart) {
      toast.error('يجب أن يكون تاريخ ووقت الانتهاء بعد تاريخ ووقت البدء.')
      return
    }

    const questions = form.questions.map((question) => ({
      questionText: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correctOptionIndex: Number(question.correctOptionIndex),
      points: Number(question.points),
    }))
    if (questions.some((question) => !question.questionText || question.options.length !== 4 || question.options.some((option) => !option) || !Number.isFinite(question.points) || question.points < 0)) {
      toast.error('أكمل نص كل سؤال والخيارات الأربعة وقيمة نقاط صحيحة قبل الحفظ.')
      return
    }
    const durationMinutes = Number(form.durationMinutes)
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 240) {
      toast.error('مدة الاختبار يجب أن تكون بين دقيقة و240 دقيقة.')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      durationMinutes,
      isActive: form.isActive,
      questions,
    }

    setSaving(true)
    try {
      if (editingExam) {
        await api.patch(`/admin/quizzes/${editingExam._id}`, payload)
        toast.success('تم تحديث الاختبار الأسبوعي.')
      } else {
        await api.post('/admin/quizzes', payload)
        toast.success('تم إنشاء الاختبار الأسبوعي.')
      }
      setModalOpen(false)
      setEditingExam(null)
      refreshExams()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const deleteExam = async () => {
    if (!deletingExam) return
    setSaving(true)
    try {
      await api.delete(`/admin/quizzes/${deletingExam._id}`)
      toast.success('تم حذف الاختبار الأسبوعي.')
      setDeletingExam(null)
      refreshExams()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section dir="rtl" className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-700"><CalendarClock size={17} /> الاختبارات المجدولة</p>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">الاختبارات الأسبوعية</h2>
          <p className="mt-2 text-sm text-muted">حدد يوم الاختبار وساعات فتحه، ثم أضف أسئلته.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-24 rounded-xl border border-line bg-white px-4 py-2.5">
            <p className="text-xs text-muted">إجمالي الاختبارات</p>
            <p className="mt-0.5 font-sans text-lg font-extrabold text-ink">{loading ? '—' : pagination.totalItems.toLocaleString('en-US')}</p>
          </div>
          <button type="button" onClick={refreshExams} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`} aria-label="تحديث الاختبارات"><RefreshCw size={16} /> تحديث</button>
          <button type="button" onClick={openCreateModal} className={`${buttonClass} bg-primary-700 text-white shadow-sm hover:bg-primary-800`}><Plus size={17} /> اختبار جديد</button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(25,61,53,0.045)]">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h3 className="font-bold text-ink">جدول الاختبارات</h3>
          <p className="mt-1 text-xs text-muted">تتضمن كل بطاقة نافذة إتاحة الاختبار.</p>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted" role="status" aria-live="polite">
            <LoaderCircle size={30} className="animate-spin text-primary-700" />
            <p className="text-sm">جارٍ تحميل الاختبارات الأسبوعية...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center" role="alert">
            <span className="mb-3 grid size-11 place-items-center rounded-full bg-[#fff0e9] text-[#b75a36]"><AlertCircle size={21} /></span>
            <p className="max-w-lg text-sm leading-6 text-ink">{error}</p>
            <button type="button" onClick={refreshExams} className={`${buttonClass} mt-4 bg-primary-700 text-white hover:bg-primary-800`}><RefreshCw size={15} /> إعادة المحاولة</button>
          </div>
        ) : pagination.totalItems === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary-50 text-primary-700"><ClipboardList size={22} /></span>
            <p className="font-bold text-ink">لا توجد اختبارات أسبوعية بعد</p>
            <p className="mt-1 text-sm text-muted">أنشئ أول اختبار وحدد موعد فتحه وإغلاقه.</p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="overflow-x-auto">
              <table className="w-full min-w-212.5 border-collapse text-center">
                <thead className="bg-[#f7f8f5] text-xs font-bold text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-center">الاختبار</th>
                    <th scope="col" className="px-5 py-3.5 text-center">نافذة الإتاحة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">تاريخ الإنشاء</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الأسئلة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">العلامة / المدة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الحالة</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {exams.map((exam) => {
                    const status = getScheduleStatus(exam)
                    return (
                      <tr key={exam._id} className="transition-colors hover:bg-[#f7f9f6]">
                        <td className="max-w-sm px-6 py-4 text-center">
                          <p className="font-bold text-ink">{exam.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{exam.description || 'بدون وصف'}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <span className="inline-flex flex-col items-center gap-1 text-sm font-semibold text-ink font-sans">
                            <span><Clock3 size={15} className="inline text-primary-700" /> {formatCustomDate(exam.windowStart || exam.examDate)} {formatRTLTime(exam.windowStart || exam.startTime)}</span>
                            <span className="text-muted">{formatCustomDate(exam.windowEnd || exam.examDate)} {formatRTLTime(exam.windowEnd || exam.endTime)}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-center font-sans text-sm text-muted">{formatCustomDate(exam.createdAt)}</td>
                        <td className="px-5 py-4 text-center"><span className="rounded-lg bg-canvas px-2.5 py-1 font-sans text-sm font-bold text-ink">{exam.questions?.length ?? 0}</span></td>
                        <td className="px-5 py-4 text-center font-sans text-sm text-ink">{(exam.totalPoints ?? exam.questions?.reduce((sum, question) => sum + (question.points ?? 1), 0) ?? 0).toLocaleString('en-US')} / {exam.durationMinutes ?? 10} د</td>
                        <td className="px-5 py-4 text-center"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button type="button" onClick={() => navigate(`/quiz-results/weekly/${exam._id}`, { state: { quizTitle: exam.title } })} aria-label={`عرض نتائج ${exam.title}`} title="النتائج والتسليمات" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-primary-50 hover:text-primary-700"><Eye size={16} /></button>
                            <button type="button" onClick={() => openEditModal(exam)} aria-label={`تعديل ${exam.title}`} title="تعديل" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-primary-50 hover:text-primary-700"><Pencil size={16} /></button>
                            <button type="button" onClick={() => setDeletingExam(exam)} aria-label={`حذف ${exam.title}`} title="حذف" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-[#fff0e9] hover:text-[#a84731]"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>
            <PaginationBar {...pagination} onPageChange={setCurrentPage} />
          </>
        )}
      </motion.div>

      <ManagementModal open={modalOpen} title={editingExam ? 'تعديل الاختبار الأسبوعي' : 'إنشاء اختبار أسبوعي'} eyebrow="جدولة الاختبار" onClose={closeModal} wide>
        <form onSubmit={saveExam} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">عنوان الاختبار</label>
              <input required maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="مثال: اختبار الأسبوع الأول" className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">مدة الاختبار بالدقائق</label>
              <input required type="number" min="1" max="240" step="1" dir="ltr" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-right font-sans text-sm text-ink outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <label className="flex items-center gap-3 self-end rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="size-4 accent-primary-700" />
              الاختبار نشط ومتاح ضمن نافذته
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">الوصف أو التعليمات</label>
            <textarea rows={2} maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="أضف تعليمات مختصرة للاختبار" className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-y" />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">بداية الإتاحة</label>
              <div className="relative flex items-center w-full rounded-xl border border-line bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition overflow-hidden">
                <div className="absolute left-3.5 text-muted pointer-events-none flex items-center justify-center">
                  <Clock3 size={18} />
                </div>
                <input required type="datetime-local" dir="ltr" lang="en-US" value={form.windowStart} onChange={(event) => setForm({ ...form, windowStart: event.target.value })} className="w-full bg-transparent py-3 px-3.5 text-right font-sans text-sm font-bold text-ink outline-none pl-10" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">نهاية الإتاحة</label>
              <div className="relative flex items-center w-full rounded-xl border border-line bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition overflow-hidden">
                <div className="absolute left-3.5 text-muted pointer-events-none flex items-center justify-center">
                  <Clock3 size={18} />
                </div>
                <input required type="datetime-local" dir="ltr" lang="en-US" min={form.windowStart || undefined} value={form.windowEnd} onChange={(event) => setForm({ ...form, windowEnd: event.target.value })} className="w-full bg-transparent py-3 px-3.5 text-right font-sans text-sm font-bold text-ink outline-none pl-10" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-ink">أسئلة الاختبار</h3>
                <p className="mt-1 text-xs text-muted">أضف سؤالًا واحدًا على الأقل، وأدخل أربعة خيارات وحدد الإجابة الصحيحة ونقاط السؤال.</p>
              </div>
              <button type="button" onClick={() => setForm((current) => ({ ...current, questions: [...current.questions, createQuestion()] }))} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50"><Plus size={15} /> إضافة سؤال</button>
            </div>

            {form.questions.map((question, questionIndex) => (
              <fieldset key={questionIndex} className="rounded-xl border border-line bg-[#fafbf9] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <legend className="text-sm font-extrabold text-primary-700">السؤال <span className="font-sans">{questionIndex + 1}</span></legend>
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => setForm((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }))} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted transition hover:bg-[#fff0e9] hover:text-[#a84731]"><Trash2 size={14} /> حذف السؤال</button>
                  )}
                </div>
                
                <label className="block text-sm font-bold text-ink mb-1.5">نص السؤال</label>
                <textarea required rows={2} value={question.question} onChange={(event) => updateQuestion(questionIndex, { question: event.target.value })} placeholder="اكتب السؤال هنا" className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-y" />
                
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = question.correctOptionIndex === optionIndex
                    return (
                      <div key={optionIndex} className="flex items-center gap-2 w-full">
                        <input type="radio" name={`weekly-correct-${questionIndex}`} checked={isCorrect} onChange={() => updateQuestion(questionIndex, { correctOptionIndex: optionIndex })} aria-label={`الخيار ${optionIndex + 1} هو الإجابة الصحيحة`} className="size-4 shrink-0 accent-primary-700 cursor-pointer" />
                        <span className="font-sans text-xs font-bold text-muted w-3 text-center">{optionIndex + 1}</span>
                        <input required value={option} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} placeholder={`الخيار ${optionIndex + 1}`} className={`flex-1 min-w-0 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${isCorrect ? 'font-bold text-primary-700' : 'text-ink'}`} />
                      </div>
                    )
                  })}
                </div>
                <label className="mt-4 block max-w-xs text-sm font-bold text-ink">
                  نقاط السؤال
                  <input required type="number" min="0" step="1" dir="ltr" value={question.points} onChange={(event) => updateQuestion(questionIndex, { points: event.target.value })} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-right font-sans text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </label>
              </fieldset>
            ))}
          </div>

          <div className="flex justify-start gap-2 border-t border-line pt-4">
            <button type="button" onClick={closeModal} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button>
            <button type="submit" disabled={saving} className={`${buttonClass} bg-primary-700 text-white hover:bg-primary-800`}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحفظ...' : editingExam ? 'حفظ التعديلات' : 'حفظ الاختبار'}
            </button>
          </div>
        </form>
      </ManagementModal>

      <ManagementModal open={Boolean(deletingExam)} title="تأكيد حذف الاختبار" eyebrow="إجراء نهائي" onClose={() => !saving && setDeletingExam(null)}>
        <p className="text-sm leading-7 text-muted">سيتم حذف اختبار <strong className="text-ink">{deletingExam?.title}</strong> نهائيًا.</p>
        <div className="mt-5 flex justify-start gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => setDeletingExam(null)} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button>
          <button type="button" onClick={deleteExam} disabled={saving} className={`${buttonClass} bg-[#a84731] text-white hover:bg-[#8e3928]`}>
            {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحذف...' : 'حذف الاختبار'}
          </button>
        </div>
      </ManagementModal>
    </section>
  )
}