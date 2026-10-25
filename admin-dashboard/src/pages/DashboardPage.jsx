import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UsersRound, CalendarClock, BookOpen } from 'lucide-react'
import api from '../api/apiClient'

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, exams: 0, verses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchDashboardStats = async () => {
      try {
        const [usersRes, examsRes, versesRes] = await Promise.all([
          api.get('/admin/users').catch(() => ({ data: { data: [] } })),
          api.get('/admin/weekly-quizzes').catch(() => ({ data: { data: [] } })),
          api.get('/admin/verses').catch(() => ({ data: { data: [] } }))
        ])
        
        if (active) {
          setStats({
            users: usersRes.data?.data?.length || 0,
            exams: examsRes.data?.data?.length || 0,
            verses: versesRes.data?.data?.length || 0,
          })
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchDashboardStats()
    return () => { active = false }
  }, [])

  return (
    <section dir="rtl" aria-labelledby="workspace-title" className="space-y-8 min-h-[56vh]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
        <p className="mb-2 text-sm font-bold text-primary-700">مساحة العمل</p>
        <h2 id="workspace-title" className="text-2xl font-bold leading-snug text-ink sm:text-3xl">
          مرحبًا بك في لوحة إدارة القديس باييسيوس الآثوسي
        </h2>
        <p className="mt-2 text-base leading-7 text-muted">
          نظرة عامة ومباشرة على نشاط النظام والمحتوى الروحي والتسجيلي.
        </p>
      </motion.div>

      {/* بطاقات الإحصائيات الشاملة */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(25,61,53,0.03)]">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-primary-50 text-primary-700">
              <UsersRound size={22} />
            </span>
            <span className="font-sans text-2xl font-extrabold text-ink">
              {loading ? '—' : stats.users.toLocaleString('en-US')}
            </span>
          </div>
          <p className="mt-4 font-bold text-ink">إجمالي المستخدمين</p>
          <p className="text-xs text-muted">الملاّك والمدراء والمستخدمون المسجلون</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(25,61,53,0.03)]">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <CalendarClock size={22} />
            </span>
            <span className="font-sans text-2xl font-extrabold text-ink">
              {loading ? '—' : stats.exams.toLocaleString('en-US')}
            </span>
          </div>
          <p className="mt-4 font-bold text-ink">الاختبارات الأسبوعية</p>
          <p className="text-xs text-muted">الاختبارات المجدولة والمنتهية</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_4px_20px_rgba(25,61,53,0.03)]">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <BookOpen size={22} />
            </span>
            <span className="font-sans text-2xl font-extrabold text-ink">
              {loading ? '—' : stats.verses.toLocaleString('en-US')}
            </span>
          </div>
          <p className="mt-4 font-bold text-ink">سجل الآيات اليومية</p>
          <p className="text-xs text-muted">الآيات الدورية والمخصصة</p>
        </div>
      </motion.div>
    </section>
  )
}