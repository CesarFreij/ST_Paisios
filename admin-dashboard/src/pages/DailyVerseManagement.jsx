import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, BookOpen, CalendarDays, LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/apiClient.js'
import ManagementModal from '../components/ManagementModal.jsx'
import PaginationBar from '../components/PaginationBar.jsx'
import { formatRTLDate } from '../utils/dateFormatter.js'

const fieldClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const getErrorMessage = (error) => error.response?.data?.message || 'تعذر الاتصال بالخادم. تحقق من صلاحية المسؤول واتصال الشبكة.'
const ITEMS_PER_PAGE = 20
const emptyPagination = { totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: ITEMS_PER_PAGE }

function getDateKey(value) {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/)
  if (!match) return null

  const [, year, month, day] = match
  const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (
    parsedDate.getUTCFullYear() !== Number(year)
    || parsedDate.getUTCMonth() !== Number(month) - 1
    || parsedDate.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return `${year}-${month}-${day}`
}

function getVerseDate(verse) {
  return verse.scheduledDate || verse.specificDate || verse.date
}

function isSequentialVerse(verse) {
  return verse.type ? verse.type === 'cyclic' : verse.isSpecificDate === false || !getDateKey(getVerseDate(verse))
}

export default function DailyVerseManagement() {
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVerse, setEditingVerse] = useState(null)
  const [deletingVerse, setDeletingVerse] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(emptyPagination)
  const [filterCounts, setFilterCounts] = useState({ all: 0, cyclic: 0, scheduled: 0 })
  const [form, setForm] = useState({ text: '', reference: '', type: 'cyclic', scheduledDate: '' })
  const filteredVerses = verses

  useEffect(() => {
    let active = true

    const loadVerses = async () => {
      setLoading(true)
      try {
        const response = await api.get('/admin/verses', {
          params: { page: currentPage, limit: ITEMS_PER_PAGE, ...(activeFilter !== 'all' && { type: activeFilter }) },
        })
        if (active) {
          const nextPagination = response.data?.pagination || emptyPagination
          const lastPage = Math.max(1, nextPagination.totalPages)
          if (currentPage > lastPage) {
            setCurrentPage(lastPage)
            return
          }
          setVerses(Array.isArray(response.data?.data) ? response.data.data : [])
          setPagination(nextPagination)
          setFilterCounts(response.data?.counts || { all: 0, cyclic: 0, scheduled: 0 })
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadVerses()
    return () => {
      active = false
    }
  }, [activeFilter, currentPage, reloadKey])

  const refreshVerses = () => {
    setError('')
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  const changeFilter = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  const openCreateModal = () => {
    setEditingVerse(null)
    setForm({ text: '', reference: '', type: 'cyclic', scheduledDate: '' })
    setModalOpen(true)
  }

  const openEditModal = (verse) => {
    setEditingVerse(verse)
    setForm({
      text: verse.text || '',
      reference: verse.reference || '',
      type: verse.type || (verse.isSpecificDate || getVerseDate(verse) ? 'scheduled' : 'cyclic'),
      scheduledDate: getDateKey(getVerseDate(verse)) || '',
    })
    setModalOpen(true)
  }

  const closeFormModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingVerse(null)
  }

  const saveVerse = async (event) => {
    event.preventDefault()
    if (form.type === 'scheduled' && verses.some((verse) =>
      String(verse._id) !== String(editingVerse?._id)
      && !isSequentialVerse(verse)
      && getDateKey(getVerseDate(verse)) === form.scheduledDate
    )) {
      toast.error('يوجد آية مخصصة لهذا التاريخ بالفعل. يرجى اختيار تاريخ آخر.')
      return
    }

    const payload = {
      text: form.text.trim(),
      reference: form.reference.trim(),
      type: form.type,
      scheduledDate: form.type === 'scheduled' ? form.scheduledDate : null,
    }

    setSaving(true)
    try {
      if (editingVerse) {
        await api.patch(`/admin/verses/${editingVerse._id}`, payload)
        toast.success('تم تحديث الآية اليومية.')
      } else {
        await api.post('/admin/verses', payload)
        toast.success('تمت إضافة الآية اليومية.')
      }
      setModalOpen(false)
      setEditingVerse(null)
      refreshVerses()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const deleteVerse = async () => {
    if (!deletingVerse) return
    setSaving(true)
    try {
      await api.delete(`/admin/verses/${deletingVerse._id}`)
      toast.success('تم حذف الآية اليومية.')
      setDeletingVerse(null)
      refreshVerses()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section dir="rtl" className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
      >
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-700"><BookOpen size={17} /> إدارة المحتوى الروحي</p>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">الآيات اليومية</h2>
          <p className="mt-2 text-sm text-muted">أضف آية ومرجعها، واختر عرضها بالتتابع أو في تاريخ محدد.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-24 rounded-xl border border-line bg-white px-4 py-2.5">
            <p className="text-xs text-muted">إجمالي الآيات</p>
            <p className="mt-0.5 font-sans text-lg font-extrabold text-ink">{loading ? '—' : filterCounts.all.toLocaleString('en-US')}</p>
          </div>
          <button type="button" onClick={refreshVerses} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`} aria-label="تحديث الآيات"><RefreshCw size={16} /> تحديث</button>
          <button type="button" onClick={openCreateModal} className={`${buttonClass} bg-primary-700 text-white shadow-sm hover:bg-primary-800`}><Plus size={17} /> إضافة آية</button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(25,61,53,0.045)]"
      >
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h3 className="font-bold text-ink">سجل الآيات</h3>
          <p className="mt-1 text-xs text-muted">المحتوى المعروض من قاعدة البيانات</p>
        </div>

        <div role="tablist" aria-label="تصفية الآيات حسب نوع العرض" className="flex flex-wrap gap-2 border-b border-line px-4 py-4 sm:px-6">
          {[
            { key: 'all', label: 'الكل', count: filterCounts.all },
            { key: 'cyclic', label: 'دوري', count: filterCounts.cyclic },
            { key: 'scheduled', label: 'تواريخ محددة', count: filterCounts.scheduled },
          ].map((filter) => {
            const active = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeFilter(filter.key)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${active ? 'border-primary-700 bg-primary-700 text-white' : 'border-primary-200/60 bg-white text-muted hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800'}`}
              >
                {filter.label}
                <span className={`rounded-full px-2 py-0.5 font-sans text-xs tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-canvas text-muted'}`}>{filter.count.toLocaleString('en-US')}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted" role="status" aria-live="polite">
            <LoaderCircle size={30} className="animate-spin text-primary-700" />
            <p className="text-sm">جارٍ تحميل الآيات...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center" role="alert">
            <span className="mb-3 grid size-11 place-items-center rounded-full bg-[#fff0e9] text-[#b75a36]"><AlertCircle size={21} /></span>
            <p className="max-w-lg text-sm leading-6 text-ink">{error}</p>
            <button type="button" onClick={refreshVerses} className={`${buttonClass} mt-4 bg-primary-700 text-white hover:bg-primary-800`}><RefreshCw size={15} /> إعادة المحاولة</button>
          </div>
        ) : pagination.totalItems === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary-50 text-primary-700"><BookOpen size={22} /></span>
            <p className="font-bold text-ink">{activeFilter === 'all' ? 'لا توجد آيات بعد' : 'لا توجد آيات ضمن هذا التصنيف'}</p>
            <p className="mt-1 text-sm text-muted">{activeFilter === 'all' ? 'أضف أول آية لتظهر في هذا السجل.' : 'اختر تصنيفًا آخر أو أضف آية جديدة.'}</p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="overflow-x-auto">
              <table className="w-full min-w-200 border-collapse text-center">
                <thead className="bg-[#f7f8f5] text-xs font-bold text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-center">نص الآية</th>
                    <th scope="col" className="px-5 py-3.5 text-center">المرجع / الإصحاح</th>
                    <th scope="col" className="px-5 py-3.5 text-center">تاريخ العرض</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredVerses.map((verse) => {
                    const verseDate = getVerseDate(verse)
                    const displayDate = isSequentialVerse(verse) ? null : formatRTLDate(verseDate)
                    return (
                      <tr key={verse._id} className="transition-colors hover:bg-[#f7f9f6]">
                        <td className="max-w-2xl whitespace-normal px-6 py-4 text-center text-sm leading-7 text-ink">{verse.text}</td>
                        <td className="px-5 py-4 text-center text-sm font-semibold text-primary-700">{verse.reference}</td>
                        <td className="px-5 py-4 text-center text-sm text-muted">
                          {displayDate && displayDate !== '-' ? (
                            <span className="inline-flex items-center gap-2 font-sans font-normal">
                              <CalendarDays size={15} />
                              {displayDate}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">دوري</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button type="button" onClick={() => openEditModal(verse)} aria-label="تعديل الآية" title="تعديل الآية" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-primary-50 hover:text-primary-700"><Pencil size={16} /></button>
                            <button type="button" onClick={() => setDeletingVerse(verse)} aria-label="حذف الآية" title="حذف الآية" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-[#fff0e9] hover:text-[#a84731]"><Trash2 size={16} /></button>
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

      <ManagementModal open={modalOpen} title={editingVerse ? 'تعديل آية يومية' : 'إضافة آية يومية'} eyebrow="المحتوى اليومي" onClose={closeFormModal}>
        <form onSubmit={saveVerse} className="space-y-4">
          <label className="block text-sm font-bold text-ink">نص الآية
            <textarea required rows={4} maxLength={2000} value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} placeholder="اكتب نص الآية" className={`${fieldClass} resize-y leading-7`} />
          </label>
          <label className="block text-sm font-bold text-ink">المرجع / الإصحاح
            <input required maxLength={120} value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="مثال: مزمور 23:1" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-ink">نوع العرض
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className={fieldClass}>
              <option value="cyclic">دورية</option>
              <option value="scheduled">مخصصة بتاريخ</option>
            </select>
          </label>
          {form.type === 'scheduled' && (
            <label className="block text-sm font-bold text-ink">تاريخ العرض
              <div className="relative mt-1.5 flex w-full items-center rounded-xl border border-line bg-white px-3.5 py-3 transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                <CalendarDays className="pointer-events-none absolute left-3.5 text-muted" size={18} />
                <input style={{border: 'none'}} required type="date" dir="ltr" lang="en-US" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} className="w-full bg-transparent pl-8 text-right font-sans text-sm font-bold text-ink outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0" />
              </div>
            </label>
          )}
          <div className="flex justify-start gap-2 border-t border-line pt-4">
            <button type="button" onClick={closeFormModal} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button>
            <button type="submit" disabled={saving} className={`${buttonClass} bg-primary-700 text-white hover:bg-primary-800`}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحفظ...' : editingVerse ? 'حفظ التغييرات' : 'حفظ الآية'}
            </button>
          </div>
        </form>
      </ManagementModal>

      <ManagementModal open={Boolean(deletingVerse)} title="تأكيد حذف الآية" eyebrow="إجراء نهائي" onClose={() => !saving && setDeletingVerse(null)}>
        <p className="text-sm leading-7 text-muted">سيتم حذف هذه الآية نهائيًا. لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="mt-5 flex justify-start gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => setDeletingVerse(null)} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button>
          <button type="button" onClick={deleteVerse} disabled={saving} className={`${buttonClass} bg-[#a84731] text-white hover:bg-[#8e3928]`}>
            {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحذف...' : 'حذف الآية'}
          </button>
        </div>
      </ManagementModal>
    </section>
  )
}