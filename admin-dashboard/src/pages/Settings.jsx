import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, BookOpen, Church, HeartHandshake, LoaderCircle, Save, ShieldCheck, UsersRound } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/apiClient.js'

const pointActions = [
  { key: 'prayerPoints', label: 'الصلاة', icon: ShieldCheck },
  { key: 'fastingPoints', label: 'الصوم', icon: UsersRound },
  { key: 'biblePoints', label: 'قراءة الكتاب المقدس والآية اليومية', icon: BookOpen },
  { key: 'churchPoints', label: 'حضور الكنيسة', icon: Church },
  { key: 'goodDeedPoints', label: 'عمل الخير', icon: HeartHandshake },
]

const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const inputClass = 'w-28 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-right font-sans text-sm font-bold tabular-nums text-ink outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
const errorMessage = (error) => error.response?.data?.message || 'تعذر الاتصال بالخادم. تحقق من صلاحية المسؤول واتصال الشبكة.'

export default function Settings() {
  const [points, setPoints] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const loadSettings = async () => {
      try {
        const response = await api.get('/admin/settings')
        if (active) setPoints(response.data?.data || {})
      } catch (requestError) {
        if (active) setError(errorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSettings()
    return () => { active = false }
  }, [reloadKey])

  const retry = () => {
    setError('')
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  const updatePoint = (key, value) => {
    setPoints((current) => ({ ...current, [key]: value === '' ? '' : Number(value) }))
  }

  const saveSettings = async (event) => {
    event.preventDefault()
    if (pointActions.some(({ key }) => !Number.isInteger(Number(points[key])) || Number(points[key]) < 0 || Number(points[key]) > 1000)) {
      toast.error('أدخل قيمة صحيحة من 0 إلى 1000 لكل نشاط.')
      return
    }

    setSaving(true)
    try {
      const payload = Object.fromEntries(pointActions.map(({ key }) => [key, Number(points[key])]))
      const response = await api.put('/admin/settings/points', payload)
      setPoints(response.data?.data || payload)
      toast.success('تم حفظ إعدادات النقاط بنجاح.')
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div dir="rtl" className="flex min-h-72 flex-col items-center justify-center gap-3 text-muted" role="status"><LoaderCircle size={30} className="animate-spin text-primary-700" /><p className="text-sm">جارٍ تحميل إعدادات النقاط...</p></div>
  }

  if (error || !points) {
    return <div dir="rtl" className="flex min-h-72 flex-col items-center justify-center px-5 text-center" role="alert"><span className="mb-3 grid size-11 place-items-center rounded-full bg-[#fff0e9] text-[#b75a36]"><AlertCircle size={21} /></span><p className="max-w-lg text-sm leading-6 text-ink">{error || 'تعذر تحميل إعدادات النقاط.'}</p><button type="button" onClick={retry} className={`${buttonClass} mt-4 bg-primary-700 text-white hover:bg-primary-800`}>إعادة المحاولة</button></div>
  }

  return (
    <section dir="rtl" className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-700"><ShieldCheck size={17} /> إعدادات النظام</p>
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">نظام النقاط</h2>
        <p className="mt-2 text-sm text-muted">حدد رصيد النقاط الذي يحصل عليه المستخدم مقابل كل نشاط يومي.</p>
      </motion.div>

      <motion.form onSubmit={saveSettings} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.04 }} className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(25,61,53,0.045)]">
        <div className="flex items-start gap-3 border-b border-line px-5 py-5 sm:px-7">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><BookOpen size={20} /></span>
          <div><h3 className="font-bold text-ink">النقاط الافتراضية للأنشطة</h3><p className="mt-1 text-sm leading-6 text-muted">تُطبّق القيم المحفوظة على مكافآت الأنشطة داخل التطبيق.</p></div>
        </div>

        <div className="grid gap-x-10 px-5 sm:grid-cols-2 sm:px-7">
          {pointActions.map(({ key, label, icon: Icon }) => (
            <label key={key} className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-b-0 sm:nth-last-[-n+2]:border-b-0">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink"><Icon size={17} className="text-primary-700" />{label}</span>
              <span className="flex items-center gap-2 text-xs text-muted font-sans"><input required type="number" min="0" max="1000" step="1" lang="en-US" dir="rtl" value={points[key] ?? ''} onChange={(event) => updatePoint(key, event.target.value)} className={inputClass} aria-label={`النقاط: ${label}`} /> نقطة</span>
            </label>
          ))}
        </div>

        <div className="flex justify-start border-t border-line px-5 py-4 sm:px-7"><button type="submit" disabled={saving} className={`${buttonClass} min-w-40 bg-primary-700 text-white shadow-sm hover:bg-primary-800`}>{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}{saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}</button></div>
      </motion.form>
    </section>
  )
}