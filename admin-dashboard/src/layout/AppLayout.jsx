import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'

export default function AppLayout({ adminName = 'المسؤول' }) {
  const location = useLocation()
  const { settings } = useAppContext()

  return (
    <div dir="rtl" className="min-h-screen bg-canvas font-sans text-ink">
      <Sidebar />
      <div className="min-h-screen lg:pr-71.5">
        <Header adminName={adminName} />
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-9">
          <motion.div
            key={location.pathname}
            initial={settings.animationsEnabled ? { opacity: 0, x: 12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: settings.animationsEnabled ? 0.28 : 0 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
