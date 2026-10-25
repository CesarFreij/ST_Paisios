import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext.jsx'
import {
  Home,
  BookOpen,
  Church,
  HelpCircle,
  ClipboardList,
  Trophy,
  Users,
  Settings,
} from 'lucide-react'

const links = [
  { label: 'الرئيسية', path: '/', icon: Home },
  { label: 'الآيات اليومية', path: '/verses', icon: BookOpen },
  { label: 'الاختبارات اليومية', path: '/questions', icon: HelpCircle },
  { label: 'الاختبارات الأسبوعية', path: '/weekly-quizzes', icon: ClipboardList },
  { label: 'الترتيب', path: '/ranking', icon: Trophy, optional: true },
  { label: 'المستخدمون', path: '/users', icon: Users },
  { label: 'الإعدادات', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { settings } = useAppContext()

  const renderLinks = (compact = false) => links.map((item, index) => {
    if (item.optional && !settings.rankingVisible) {
      return null
    }

    const Icon = item.icon
    return (
      <motion.div
        key={item.path}
        initial={settings.animationsEnabled ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: settings.animationsEnabled ? index * 0.035 : 0 }}
        className={compact ? 'shrink-0' : undefined}
      >
        <NavLink
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => [
            'group flex items-center gap-3 rounded-xl transition-colors duration-200',
            compact ? 'px-3 py-2.5 text-sm' : 'px-3.5 py-3 text-[15px]',
            compact
              ? isActive
                ? 'bg-[#eaf0e9] font-bold text-forest'
                : 'text-muted hover:bg-canvas hover:text-forest'
              : isActive
                ? 'bg-white/12 font-bold text-white'
                : 'text-white/70 hover:bg-white/8 hover:text-white',
          ].join(' ')}
        >
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${compact ? 'bg-white text-forest group-hover:bg-[#eaf0e9]' : 'bg-white/8 text-white/85 group-hover:bg-white/12'}`}>
            <Icon size={18} strokeWidth={1.8} />
          </span>
          <span className="whitespace-nowrap">{item.label}</span>
        </NavLink>
      </motion.div>
    )
  })

  return (
    <>
      <motion.aside
        initial={settings.animationsEnabled ? { opacity: 0, x: 14 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: settings.animationsEnabled ? 0.4 : 0 }}
        className="fixed inset-y-0 right-0 z-40 hidden w-71.5 flex-col bg-forest px-5 py-7 text-white shadow-[0_18px_60px_rgba(25,61,53,0.12)] lg:flex"
      >
        <div className="mb-10 flex items-center gap-3 px-1">
          <div className="grid size-11 place-items-center rounded-xl bg-brass text-forest shadow-sm"><Church size={22} strokeWidth={1.8} /></div>
          <div>
            <p className="text-base font-bold leading-tight">القديس باييسيوس الآثوسي</p>
            <p className="mt-1 text-xs text-white/55">إدارة التطبيق</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[11px] font-bold tracking-wide text-white/40">القائمة الرئيسية</p>
        <nav aria-label="التنقل الرئيسي" className="grid gap-1.5">
          {renderLinks()}
        </nav>

        <div className="mt-auto border-t border-white/10 px-3 pt-5 text-xs text-white/45">
          لوحة إدارة القديس باييسيوس الآثوسي
        </div>
      </motion.aside>

      <nav aria-label="التنقل الرئيسي" className="mobile-nav sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-line bg-white/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden">
        {renderLinks(true)}
      </nav>
    </>
  )
}
