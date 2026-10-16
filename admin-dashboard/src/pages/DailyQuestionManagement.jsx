import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CalendarDays, CircleHelp, Eye, LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/apiClient.js'
import ManagementModal from '../components/ManagementModal.jsx'
import { formatRTLDate } from '../utils/dateFormatter.js'
import PaginationBar from '../components/PaginationBar.jsx'

const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const getErrorMessage = (error) => error.response?.data?.message || 'تعذر الاتصال بالخادم. تحقق من صلاحية المسؤول واتصال الشبكة.'
const ITEMS_PER_PAGE = 20
const emptyPagination = { totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: ITEMS_PER_PAGE }

const localToday = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const createForm = () => ({ question: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1, date: localToday() })

export default function DailyQuestionManagement() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deletingQuestion, setDeletingQuestion] = useState(null)
  const [submissionsQuestion, setSubmissionsQuestion] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsError, setSubmissionsError] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(emptyPagination)
  const [form, setForm] = useState(createForm)

  useEffect(() => {
    let active = true
    const loadQuestions = async () => {
      setLoading(true)
      try {
        const response = await api.get('/admin/questions', { params: { page: currentPage, limit: ITEMS_PER_PAGE } })
        if (active) {
          const nextPagination = response.data?.pagination || emptyPagination
          const lastPage = Math.max(1, nextPagination.totalPages)
          if (currentPage > lastPage) {
            setCurrentPage(lastPage)
            return
          }
          setQuestions(Array.isArray(response.data?.data) ? response.data.data : [])
          setPagination(nextPagination)
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadQuestions()
    return () => { active = false }
  }, [currentPage, reloadKey])

  const refreshQuestions = () => {
    setError('')
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  const openCreate = () => {
    setEditingQuestion(null)
    setForm(createForm())
    setModalOpen(true)
  }

  const openEdit = (question) => {
    setEditingQuestion(question)
    setForm({
      question: question.question || '',
      options: question.options?.length ? [...question.options] : ['', '', '', ''],
      correctOptionIndex: Number(question.correctOptionIndex ?? 0),
      points: Number(question.points ?? 1),
      date: question.date ? new Date(question.date).toISOString().slice(0, 10) : localToday(),
    })
    setModalOpen(true)
  }

  const updateQuestion = (updates) => setForm((current) => ({ ...current, ...updates }))

  const updateOption = (optionIndex, value) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, index) => index === optionIndex ? value : option),
    }))
  }

  const addOption = () => setForm((current) => ({ ...current, options: [...current.options, ''] }))

  const removeOption = (optionIndex) => {
    if (form.options.length <= 2) return
    const correctOptionIndex = form.correctOptionIndex === optionIndex
      ? 0
      : form.correctOptionIndex > optionIndex
        ? form.correctOptionIndex - 1
        : form.correctOptionIndex
    setForm((current) => ({
      ...current,
      options: current.options.filter((_, index) => index !== optionIndex),
      correctOptionIndex,
    }))
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingQuestion(null)
  }

  const saveQuestion = async (event) => {
    event.preventDefault()
    const payload = {
      question: form.question.trim(),
      options: form.options.map((option) => option.trim()),
      correctOptionIndex: Number(form.correctOptionIndex),
      points: Number(form.points),
      date: form.date,
    }
    if (!payload.question || payload.options.length < 2 || payload.options.some((option) => !option) || !payload.date || !Number.isInteger(payload.points) || payload.points < 0) {
      toast.error('أكمل السؤال وخيارين على الأقل والنقاط والتاريخ قبل الحفظ.')
      return
    }

    setSaving(true)
    try {
      if (editingQuestion) {
        await api.patch(`/admin/questions/${editingQuestion._id}`, payload)
        toast.success('تم تحديث الاختبار اليومي.')
      } else {
        await api.post('/admin/questions', payload)
        toast.success('تمت إضافة الاختبار اليومي.')
      }
      setModalOpen(false)
      setEditingQuestion(null)
      refreshQuestions()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async () => {
    if (!deletingQuestion) return
    setSaving(true)
    try {
      await api.delete(`/admin/questions/${deletingQuestion._id}`)
      toast.success('تم حذف الاختبار اليومي.')
      setDeletingQuestion(null)
      refreshQuestions()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const openSubmissions = async (question) => {
    setSubmissionsQuestion(question)
    setSubmissions([])
    setSubmissionsError('')
    setSubmissionsLoading(true)
    try {
      const response = await api.get(`/admin/daily-questions/${question._id}/submissions`)
      setSubmissions(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (requestError) {
      setSubmissionsError(getErrorMessage(requestError))
    } finally {
      setSubmissionsLoading(false)
    }
  }

  return (
    <section dir="rtl" className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-700"><CircleHelp size={17} /> إدارة المحتوى اليومي</p>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">الاختبارات اليومية</h2>
          <p className="mt-2 text-sm text-muted">أنشئ أسئلة مجدولة مع عدد خيارات مرن وإجابة صحيحة محددة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-24 rounded-xl border border-line bg-white px-4 py-2.5"><p className="text-xs text-muted">إجمالي الاختبارات</p><p className="mt-0.5 font-sans text-lg font-extrabold text-ink">{loading ? '—' : pagination.totalItems.toLocaleString('en-US')}</p></div>
          <button type="button" onClick={refreshQuestions} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`} aria-label="تحديث الاختبارات اليومية"><RefreshCw size={16} /> تحديث</button>
          <button type="button" onClick={openCreate} className={`${buttonClass} bg-primary-700 text-white shadow-sm hover:bg-primary-800`}><Plus size={17} /> اختبار جديد</button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(25,61,53,0.045)]">
        <div className="border-b border-line px-5 py-4 sm:px-6"><h3 className="font-bold text-ink">جدول الاختبارات اليومية</h3><p className="mt-1 text-xs text-muted">البيانات المعروضة من الخادم</p></div>
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted" role="status"><LoaderCircle size={30} className="animate-spin text-primary-700" /><p className="text-sm">جارٍ تحميل الاختبارات اليومية...</p></div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center" role="alert"><span className="mb-3 grid size-11 place-items-center rounded-full bg-[#fff0e9] text-[#b75a36]"><AlertCircle size={21} /></span><p className="max-w-lg text-sm leading-6 text-ink">{error}</p><button type="button" onClick={refreshQuestions} className={`${buttonClass} mt-4 bg-primary-700 text-white hover:bg-primary-800`}><RefreshCw size={15} /> إعادة المحاولة</button></div>
        ) : pagination.totalItems === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center"><span className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary-50 text-primary-700"><CircleHelp size={22} /></span><p className="font-bold text-ink">لا توجد اختبارات يومية بعد</p><p className="mt-1 text-sm text-muted">أضف أول اختبار ليظهر هنا.</p></div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
              <table className="w-full min-w-220 border-collapse text-center">
                <thead className="bg-[#f7f8f5] text-xs font-bold text-muted"><tr><th className="px-6 py-3.5 text-center">السؤال</th><th className="px-5 py-3.5 text-center">الخيارات</th><th className="px-5 py-3.5 text-center">النقاط الممنوحة</th><th className="px-5 py-3.5 text-center">التاريخ</th><th className="px-5 py-3.5 text-center">الإجراءات</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {questions.map((item) => (
                    <tr key={item._id} className="transition-colors hover:bg-[#f7f9f6]">
                      <td className="max-w-xs whitespace-normal px-6 py-4 text-center text-sm font-bold leading-6 text-ink">{item.question}</td>
                      <td className="px-5 py-4 text-center"><ol className="grid gap-1.5 text-sm">{item.options?.map((option, index) => <li key={`${item._id}-${index}`} className={`flex items-center justify-center gap-2 ${item.correctOptionIndex === index ? 'font-bold text-primary-700' : 'font-normal text-gray-600'}`}><span dir="ltr" className="grid size-5 shrink-0 place-items-center rounded-full bg-canvas font-sans text-[10px] font-bold text-muted">{index + 1}</span>{option}</li>)}</ol></td>
                      <td className="whitespace-nowrap px-5 py-4 text-center text-sm font-bold text-primary-700">{Number(item.points ?? 1).toLocaleString('en-US')}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-center text-sm text-muted"><span className="inline-flex items-center gap-2 font-sans"><CalendarDays size={15} />{formatRTLDate(item.date)}</span></td>
                      <td className="px-5 py-4 text-center"><div className="flex items-center justify-center gap-1.5"><button type="button" onClick={() => openSubmissions(item)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50"><Eye size={15} /></button><button type="button" onClick={() => openEdit(item)} aria-label="تعديل الاختبار" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-primary-50 hover:text-primary-700"><Pencil size={16} /></button><button type="button" onClick={() => setDeletingQuestion(item)} aria-label="حذف الاختبار" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-[#fff0e9] hover:text-[#a84731]"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
            <PaginationBar {...pagination} onPageChange={setCurrentPage} />
          </>
        )}
      </motion.div>

      <ManagementModal open={modalOpen} title={editingQuestion ? 'تعديل الاختبار اليومي' : 'إضافة اختبار يومي'} eyebrow="المحتوى اليومي" onClose={closeModal} wide>
        <form onSubmit={saveQuestion} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">نص السؤال</label>
            <textarea required rows={3} maxLength={1000} value={form.question} onChange={(event) => updateQuestion({ question: event.target.value })} className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-y leading-7" placeholder="اكتب نص السؤال" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">تاريخ الاختبار</label>
            <div className="relative mb-5 flex items-center w-full rounded-xl border border-line bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition overflow-hidden">
              <div className="absolute left-3.5 text-muted pointer-events-none flex items-center justify-center">
                <CalendarDays size={18} />
              </div>
              <input required type="date" dir="ltr" lang="en-US" value={form.date} onChange={(event) => updateQuestion({ date: event.target.value })} className="w-full bg-transparent py-3 px-3.5 text-right font-sans text-sm font-bold text-ink outline-none pl-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
            </div>
            <div>
              <label htmlFor="daily-question-points" className="block text-sm font-bold text-ink mb-1.5">النقاط الممنوحة</label>
              <input id="daily-question-points" required type="number" min="0" step="1" value={form.points} onChange={(event) => updateQuestion({ points: event.target.value })} className="rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-bold text-ink">الخيارات والإجابة الصحيحة</legend>
            <p className="mb-3 text-xs text-muted">أربعة خيارات افتراضيًا، ويمكن إضافة خيارات أو حذفها مع الإبقاء على خيارين على الأقل.</p>
            
            {/* التصميم النظيف للخيارات بدون حواف متداخلة */}
            {form.options.map((option, index) => {
              const isCorrect = Number(form.correctOptionIndex) === index
              return (
                <div key={index} className="flex items-center gap-3 w-full">
                  <input type="radio" name="daily-correct-option" checked={isCorrect} onChange={() => updateQuestion({ correctOptionIndex: index })} aria-label={`الخيار ${index + 1} هو الإجابة الصحيحة`} className="size-4 shrink-0 accent-primary-700 cursor-pointer" />
                  <span className="font-sans text-xs font-bold text-muted w-4 text-center">{index + 1}</span>
                  <input required value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`اكتب الخيار ${index + 1}`} className={`flex-1 min-w-0 rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${isCorrect ? 'font-bold text-primary-700' : 'text-ink'}`} />
                  <button type="button" disabled={form.options.length <= 2} onClick={() => removeOption(index)} aria-label={`حذف الخيار ${index + 1}`} title="حذف الخيار" className="grid size-10 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-[#fff0e9] hover:text-[#a84731] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={16} /></button>
                </div>
              )
            })}
            <button type="button" onClick={addOption} className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold text-primary-700 transition hover:bg-primary-50" style={{width: 'fit-content'}}><Plus size={15} /> إضافة خيار</button>
          </fieldset>
          
          <div className="flex justify-start gap-2 border-t border-line pt-4"><button type="button" onClick={closeModal} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button><button type="submit" disabled={saving} className={`${buttonClass} bg-primary-700 text-white hover:bg-primary-800`}>{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحفظ...' : editingQuestion ? 'حفظ التغييرات' : 'حفظ الاختبار'}</button></div>
        </form>
      </ManagementModal>

      <ManagementModal
        open={Boolean(submissionsQuestion)}
        title="إجابات السؤال اليومي"
        eyebrow={submissionsQuestion?.question}
        onClose={() => setSubmissionsQuestion(null)}
        wide
      >
        {submissionsLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-3 text-muted" role="status">
            <LoaderCircle size={24} className="animate-spin text-primary-700" />
            <p className="text-sm">جارٍ تحميل الإجابات...</p>
          </div>
        ) : submissionsError ? (
          <p role="alert" className="rounded-xl bg-[#fff0e9] p-4 text-sm leading-6 text-[#a84731]">{submissionsError}</p>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">لا توجد إجابات لهذا السؤال بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-center">
              <thead className="bg-[#f7f8f5] text-xs font-bold text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">اسم المستخدم</th>
                  <th scope="col" className="px-4 py-3">الإجابة المختارة</th>
                  <th scope="col" className="px-4 py-3">الحالة</th>
                  <th scope="col" className="px-4 py-3">وقت الإجابة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {submissions.map((submission) => (
                  <tr key={submission._id}>
                    <td className="px-4 py-3 text-sm font-bold text-ink">{submission.userName}</td>
                    <td className="px-4 py-3 text-sm text-ink">{submission.selectedOption}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${submission.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-[#fff0e9] text-[#a84731]'}`}>
                        {submission.isCorrect ? 'صحيحة' : 'خاطئة'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                      {new Date(submission.submittedAt).toLocaleString('ar-SY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ManagementModal>

      <ManagementModal open={Boolean(deletingQuestion)} title="تأكيد حذف الاختبار" eyebrow="إجراء نهائي" onClose={() => !saving && setDeletingQuestion(null)}><p className="text-sm leading-7 text-muted">سيتم حذف هذا الاختبار اليومي نهائيًا.</p><div className="mt-5 flex justify-start gap-2 border-t border-line pt-4"><button type="button" onClick={() => setDeletingQuestion(null)} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button><button type="button" onClick={deleteQuestion} disabled={saving} className={`${buttonClass} bg-[#a84731] text-white hover:bg-[#8e3928]`}>{saving ? 'جارٍ الحذف...' : 'حذف الاختبار'}</button></div></ManagementModal>
    </section>
  )
}