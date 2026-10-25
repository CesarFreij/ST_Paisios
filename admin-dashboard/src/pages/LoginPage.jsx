import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AlertCircle, Church, LoaderCircle, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth.js'
import api from '../api/apiClient.js'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password,
      })
      const { token, user } = response.data?.data || {}

      if (!token || !user) {
        throw new Error('تعذر التحقق من بيانات تسجيل الدخول.')
      }

      if (!['admin', 'owner'].includes(user.role)) {
        setError('هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.')
        return
      }

      auth.login(token, user)
      toast.success('تم تسجيل الدخول بنجاح.')
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main dir="rtl" className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4 py-10 font-sans">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,128,107,0.09),transparent_32%),radial-gradient(circle_at_82%_85%,rgba(229,180,110,0.12),transparent_30%)]" />
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-primary-200/60 bg-white shadow-[0_24px_80px_rgba(25,61,53,0.12)]"
      >
        <div className="h-1.5 bg-primary-700" />
        <div className="p-6 sm:p-9">
          <div className="mb-8 flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-200/60">
              <Church size={27} strokeWidth={1.7} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-primary-700">القديس باييسيوس الآثوسي</p>
              <h1 className="text-2xl font-bold text-ink">تسجيل الدخول</h1>
              <p className="mt-1 text-sm text-muted">لوحة الإدارة</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-bold text-ink">
              اسم المستخدم
              <input
                type="text"
                name="username"
                autoComplete="username"
                dir="auto"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
                className="mt-2 w-full rounded-xl border border-primary-200/60 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </label>

            <label className="block text-sm font-bold text-ink">
              كلمة المرور
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                className="mt-2 w-full rounded-xl border border-primary-200/60 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </label>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#f1d4ca] bg-[#fff7f3] px-3.5 py-3 text-sm leading-6 text-[#9c422b]">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(36,83,71,0.18)] transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isLoading ? <><LoaderCircle size={18} className="animate-spin" /> جارٍ تسجيل الدخول...</> : <><LogIn size={18} /> تسجيل الدخول</>}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  )
}
