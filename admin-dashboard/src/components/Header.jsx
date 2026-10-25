import { LogOut, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'

const pageTitles = {
  '/': 'نظرة عامة',
  '/verses': 'الآيات اليومية',
  '/questions': 'الاختبارات اليومية',
  '/weekly-quizzes': 'الاختبارات الأسبوعية',
  '/ranking': 'الترتيب',
  '/users': 'المستخدمون',
  '/settings': 'الإعدادات',
}

export default function Header({ adminName = 'المسؤول' }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const auth = useAuth()
  const pageTitle = pathname.startsWith('/users/') ? 'تفاصيل المستخدم' : pageTitles[pathname] || 'لوحة الإدارة'

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-23 items-center justify-between gap-4 border-b border-line bg-white px-4 py-4 sm:px-6 lg:px-10"
    >
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-muted">القديس باييسيوس الآثوسي <span className="px-1 text-brass">/</span> لوحة الإدارة</p>
        <h1 className="truncate text-xl font-bold text-ink sm:text-2xl">{pageTitle}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-3 border-l border-line pl-4 sm:flex">
          <div className="text-left">
            <p className="text-sm font-bold text-ink">{adminName}</p>
            <p className="mt-0.5 text-xs text-muted">حساب الإدارة</p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[#eaf0e9] text-forest">
            <UserRound size={19} strokeWidth={1.8} />
          </div>
        </div>
        <button
          className="flex size-10 items-center justify-center gap-2 rounded-xl border border-line bg-white text-muted transition-colors hover:border-[#d9e1d8] hover:bg-canvas hover:text-forest sm:w-auto sm:px-3"
          type="button"
          onClick={handleLogout}
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
        >
          <LogOut size={18} />
          <span className="hidden text-sm font-bold sm:inline">خروج</span>
        </button>
      </div>
    </motion.header>
  )
}
