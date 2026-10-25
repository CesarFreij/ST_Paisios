import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Crown, Gift, LoaderCircle, Pencil, RefreshCw, Search, ShieldCheck, Trash2, UserRound, UsersRound, X, Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/apiClient.js'
import ManagementModal from '../components/ManagementModal.jsx'

const fieldClass = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const ITEMS_PER_PAGE = 20
const emptyPagination = { totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: ITEMS_PER_PAGE }

const getErrorMessage = (error) => error.response?.data?.message || 'تعذر الاتصال بالخادم. تحقق من صلاحية المسؤول واتصال الشبكة.'
const roleDetails = {
  owner: { label: 'مالك', classes: 'bg-[#fff5dc] text-[#94620b] ring-1 ring-[#e9cf8d]', icon: Crown },
  admin: { label: 'مدير', classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', icon: ShieldCheck },
  user: { label: 'مستخدم', classes: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200', icon: UserRound },
}
const pointTypeLabels = {
  prayer: 'الصلاة',
  fasting: 'الصوم',
  bible: 'قراءة الكتاب المقدس',
  church: 'الذهاب إلى الكنيسة',
  good_deed: 'عمل الخير',
  achievement: 'إنجاز',
  quiz_weekly: 'اختبار أسبوعي',
  quiz_daily: 'سؤال يومي',
  admin_gift: 'مكافأة إدارية',
  admin_deduction: 'خصم إداري',
}

const formatPointTimestamp = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('st_paisios_user') || 'null')
  } catch {
    return null
  }
}

export default function UsersManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(emptyPagination)
  const [roleCounts, setRoleCounts] = useState({ all: 0, owner: 0, admin: 0, user: 0 })
  const [sessionUser] = useState(getSessionUser)
  const [changingRoleId, setChangingRoleId] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [pointsUser, setPointsUser] = useState(null)
  const [pointLogs, setPointLogs] = useState([])
  const [pointLogsLoading, setPointLogsLoading] = useState(false)
  const [pointLogsError, setPointLogsError] = useState('')
  const [pointLogsReload, setPointLogsReload] = useState(0)
  const [pointLogsPage, setPointLogsPage] = useState(1)
  const [pointLogsPagination, setPointLogsPagination] = useState(emptyPagination)
  const [adjustingUser, setAdjustingUser] = useState(null)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentIsPositive, setAdjustmentIsPositive] = useState(true)
  const [adjustmentSaving, setAdjustmentSaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', title: '', totalPoints: '0' })

  useEffect(() => {
    let active = true

    const loadUsers = async () => {
      setLoading(true)
      try {
        const response = await api.get('/admin/users', {
          params: {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            sort: sortBy,
            ...(activeFilter !== 'all' && { role: activeFilter }),
            ...(search.trim() && { search: search.trim() }),
          },
        })
        if (active) {
          const nextPagination = response.data?.pagination || emptyPagination
          const lastPage = Math.max(1, nextPagination.totalPages)
          if (currentPage > lastPage) {
            setCurrentPage(lastPage)
            return
          }
          setUsers(Array.isArray(response.data?.users)
            ? response.data.users
            : Array.isArray(response.data?.data)
              ? response.data.data
              : [])
          setPagination({
            ...nextPagination,
            currentPage: response.data?.currentPage ?? nextPagination.currentPage,
            totalPages: response.data?.totalPages ?? nextPagination.totalPages,
            totalItems: response.data?.totalUsers ?? nextPagination.totalItems,
          })
          setRoleCounts(response.data?.counts || { all: 0, owner: 0, admin: 0, user: 0 })
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()
    return () => {
      active = false
    }
  }, [activeFilter, currentPage, reloadKey, search, sortBy])

  useEffect(() => {
    if (!pointsUser) return undefined
    let active = true

    const loadPointLogs = async () => {
      setPointLogsLoading(true)
      setPointLogsError('')
      try {
        const response = await api.get(`/admin/users/${pointsUser._id}/point-logs`, {
          params: { page: pointLogsPage, limit: ITEMS_PER_PAGE },
        })
        if (active) {
          setPointLogs(Array.isArray(response.data?.data) ? response.data.data : [])
          setPointLogsPagination(response.data?.pagination || emptyPagination)
        }
      } catch (requestError) {
        if (active) setPointLogsError(getErrorMessage(requestError))
      } finally {
        if (active) setPointLogsLoading(false)
      }
    }

    loadPointLogs()
    return () => {
      active = false
    }
  }, [pointLogsPage, pointLogsReload, pointsUser])

  const filteredUsers = users
  const countFor = (role) => roleCounts[role] ?? 0
  const isOwner = sessionUser?.role === 'owner'
  const sessionUserId = sessionUser?.id || sessionUser?._id

  const refreshUsers = () => {
    setError('')
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  const updateSearch = (value) => {
    setCurrentPage(1)
    setSearch(value)
  }

  const togglePointsSort = () => {
    setCurrentPage(1)
    setSortBy((current) => current === 'points-desc' ? 'points-asc' : 'points-desc')
  }

  const openPointsHistory = (user) => {
    setPointLogs([])
    setPointLogsError('')
    setPointLogsPage(1)
    setPointLogsPagination(emptyPagination)
    setPointLogsLoading(true)
    setPointsUser(user)
  }

  const openAdjustment = (user) => {
    setAdjustmentAmount('')
    setAdjustmentIsPositive(true)
    setAdjustingUser(user)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({
      username: user.username || '',
      email: user.email || '',
      title: user.title || '',
      totalPoints: String(user.totalPoints ?? 0),
    })
  }

  const closeEdit = () => {
    if (saving) return
    setEditingUser(null)
  }

  const saveUser = async (event) => {
    event.preventDefault()
    if (!editingUser) return

    setSaving(true)
    try {
      await api.patch(`/admin/users/${editingUser._id}`, {
        username: form.username.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
        totalPoints: Number(form.totalPoints),
      })
      toast.success('تم تحديث بيانات المستخدم.')
      setEditingUser(null)
      refreshUsers()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const submitPointAdjustment = async (event) => {
    event.preventDefault()
    if (!adjustingUser) return

    const amount = Number(adjustmentAmount)
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      toast.error('أدخل عددًا صحيحًا موجبًا من النقاط.')
      return
    }

    setAdjustmentSaving(true)
    try {
      await api.post(`/admin/users/${adjustingUser._id}/adjust-points`, {
        amount,
        isPositive: adjustmentIsPositive,
      })
      toast.success(adjustmentIsPositive ? 'تمت إضافة النقاط وإرسال إشعار للمستخدم.' : 'تم خصم النقاط وإرسال إشعار للمستخدم.')
      setAdjustingUser(null)
      refreshUsers()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setAdjustmentSaving(false)
    }
  }

  const deleteUser = async () => {
    if (!deletingUser) return

    setSaving(true)
    try {
      await api.delete(`/admin/users/${deletingUser._id}`)
      toast.success('تم حذف المستخدم.')
      setDeletingUser(null)
      refreshUsers()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const changeUserRole = async (user) => {
    if (!isOwner || String(user._id) === String(sessionUserId)) return
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setChangingRoleId(user._id)
    try {
      await api.patch('/admin/users/role', { userId: user._id, newRole })
      refreshUsers()
      toast.success(newRole === 'admin' ? 'تمت ترقية الحساب إلى مدير.' : 'تم تغيير الحساب إلى مستخدم.')
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setChangingRoleId(null)
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
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-forest"><UsersRound size={17} /> إدارة المستخدمين</p>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">جميع الحسابات</h2>
          <p className="mt-2 text-sm text-muted">إدارة حسابات الملاك والمدراء والمستخدمين من مصدر البيانات المباشر.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-28 rounded-xl border border-line bg-white px-4 py-2.5">
            <p className="text-xs text-muted">إجمالي الحسابات</p>
            <p className="mt-0.5 font-sans text-lg font-extrabold text-ink">{loading ? '—' : roleCounts.all.toLocaleString('en-US')}</p>
          </div>
          <button type="button" onClick={refreshUsers} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`} aria-label="تحديث القائمة">
            <RefreshCw size={16} /> تحديث
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(25,61,53,0.045)]"
      >
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="font-bold text-ink">قائمة المستخدمين</h3>
            <p className="mt-1 text-xs text-muted">البيانات محدثة مباشرة من الخادم</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="ابحث باسم المستخدم"
              aria-label="ابحث باسم المستخدم"
              className="w-full rounded-xl border border-line bg-canvas/60 py-2.5 pe-10 ps-9 text-sm outline-none transition placeholder:text-[#9aa69f] focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
            />
            {search && (
              <button type="button" onClick={() => updateSearch('')} aria-label="مسح البحث" className="absolute left-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-white">
                <X size={14} />
              </button>
            )}
          </label>
        </div>

        <div role="tablist" aria-label="تصفية الحسابات حسب الدور" className="flex flex-wrap gap-2 border-b border-line px-4 pb-4 sm:px-6 mt-4">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'owner', label: 'المُلاّك' },
            { key: 'admin', label: 'المدراء' },
            { key: 'user', label: 'المستخدمين' },
          ].map((filter) => {
            const active = activeFilter === filter.key
            const count = countFor(filter.key)
            return (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveFilter(filter.key)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${active ? 'border-primary-700 bg-primary-700 text-white' : 'border-primary-200/60 bg-white text-muted hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800'}`}
              >
                {filter.label}
                <span className={`rounded-full px-2 py-0.5 font-sans text-xs tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-canvas text-muted'}`}>{count.toLocaleString('en-US')}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted" role="status" aria-live="polite">
            <LoaderCircle size={30} className="animate-spin text-forest" />
            <p className="text-sm">جارٍ تحميل المستخدمين...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center" role="alert">
            <span className="mb-3 grid size-11 place-items-center rounded-full bg-[#fff0e9] text-[#b75a36]"><AlertCircle size={21} /></span>
            <p className="max-w-lg text-sm leading-6 text-ink">{error}</p>
            <button type="button" onClick={refreshUsers} className={`${buttonClass} mt-4 bg-forest text-white hover:bg-forest-light`}><RefreshCw size={15} /> إعادة المحاولة</button>
          </div>
        ) : pagination.totalItems === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-canvas text-forest"><UsersRound size={22} /></span>
            <p className="font-bold text-ink">{search ? 'لا توجد نتائج مطابقة' : 'لا توجد حسابات ضمن هذا التصنيف'}</p>
            <p className="mt-1 text-sm text-muted">{search ? 'جرّب اسمًا آخر.' : 'ستظهر الحسابات هنا عند توفرها في الخادم.'}</p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="overflow-x-auto">
              <table className="w-full min-w-220 border-collapse text-center">
                <thead className="bg-[#f7f8f5] text-xs font-bold text-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-center">الاسم والبريد الإلكتروني</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الصلاحية</th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={togglePointsSort}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-white hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label={sortBy === 'points-desc' ? 'ترتيب النقاط تصاعديًا' : 'ترتيب النقاط تنازليًا'}
                        aria-pressed={sortBy.startsWith('points-')}
                      >
                        النقاط الكلية
                        {sortBy === 'points-desc' ? <ArrowDown size={14} /> : sortBy === 'points-asc' ? <ArrowUp size={14} /> : <ArrowUpDown size={14} />}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">الإنجازات ومسار الجوائز</th>
                    <th scope="col" className="px-5 py-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredUsers.map((user) => {
                  const role = roleDetails[user.role] || roleDetails.user
                  const RoleIcon = role.icon
                  const isCurrentAccount = String(user._id) === String(sessionUserId)
                  const canChangeRole = isOwner && !isCurrentAccount && user.role !== 'owner'
                  return (
                    <tr key={user._id} className="group transition-colors hover:bg-[#f7f9f6]">
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${user.role === 'owner' ? 'bg-[#fff5dc] text-[#94620b]' : user.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-primary-50 text-primary-700'}`}>{user.username?.trim().charAt(0) || '؟'}</span>
                        <div>
                          <button
                            type="button"
                            onClick={() => openPointsHistory(user)}
                            className="font-bold text-ink transition hover:text-primary-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            aria-label={`عرض تفاصيل ${user.username}`}
                          >
                            {user.username}
                          </button>
                          <p className="mt-0.5 text-xs text-muted">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${role.classes}`}><RoleIcon size={13} />{role.label}</span></td>
                    <td className="px-5 py-4 text-center"><span className="inline-flex rounded-lg bg-[#f4f6ee] px-2.5 py-1 font-sans font-bold tabular-nums text-forest">{(user.totalPoints ?? 0).toLocaleString('en-US')}</span></td>
                    <td className="px-5 py-4 text-center">
                      <span className="block text-sm font-bold text-ink">{user.completedAchievements ?? 0} / 6 إنجازات مكتملة</span>
                      <span className="mt-1 block text-xs text-muted">{user.rewardMilestoneTitle || 'بداية الطريق'}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canChangeRole && (
                          <button
                            type="button"
                            onClick={() => changeUserRole(user)}
                            disabled={changingRoleId === user._id}
                            aria-label={user.role === 'user' ? `ترقية ${user.username} إلى مدير` : `إرجاع ${user.username} إلى مستخدم`}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${user.role === 'user' ? 'text-blue-700 hover:bg-blue-50' : 'text-primary-700 hover:bg-primary-50'}`}
                          >
                            {changingRoleId === user._id ? <LoaderCircle size={14} className="animate-spin" /> : user.role === 'user' ? <ShieldCheck size={14} /> : <UserRound size={14} />}
                            {user.role === 'user' ? 'ترقية لمدير' : 'إرجاع لمستخدم'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openPointsHistory(user)}
                          title={`تفاصيل نقاط ${user.username}`}
                          aria-label={`عرض سجل نقاط ${user.username}`}
                          className="grid size-9 place-items-center rounded-lg text-primary-700 transition hover:bg-primary-50"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openAdjustment(user)}
                          title={`تعديل نقاط ${user.username}`}
                          aria-label={`تعديل نقاط ${user.username}`}
                          className="grid size-9 place-items-center rounded-lg text-amber-700 transition hover:bg-amber-50"
                        >
                          <Gift size={16} />
                        </button>
                        <button type="button" onClick={() => openEdit(user)} title={`تعديل ${user.username}`} aria-label={`تعديل ${user.username}`} className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-[#eaf0e9] hover:text-forest"><Pencil size={16} /></button>
                        <button type="button" onClick={() => setDeletingUser(user)} title={`حذف ${user.username}`} aria-label={`حذف ${user.username}`} className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-[#fff0e9] hover:text-[#b75a36]"><Trash2 size={16} /></button>
                      </div>
                    </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </motion.div>
            <nav aria-label="التنقل بين صفحات المستخدمين" className="flex items-center justify-between gap-3 border-t border-line px-4 py-4 sm:px-6">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}
              >
                Previous Page
              </button>
              <p className="text-sm font-bold text-muted">
                Page <span className="font-sans tabular-nums">{currentPage}</span> of <span className="font-sans tabular-nums">{Math.max(1, pagination.totalPages)}</span>
              </p>
              <button
                type="button"
                disabled={currentPage >= Math.max(1, pagination.totalPages)}
                onClick={() => setCurrentPage((page) => Math.min(Math.max(1, pagination.totalPages), page + 1))}
                className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}
              >
                Next Page
              </button>
            </nav>
          </>
        )}
      </motion.div>

      <ManagementModal open={Boolean(editingUser)} title="تعديل بيانات المستخدم" eyebrow="إدارة الحساب" onClose={closeEdit}>
        <form onSubmit={saveUser} className="space-y-4">
          <label className="block text-sm font-bold text-ink">اسم المستخدم
            <input required minLength={3} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-ink">البريد الإلكتروني
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-ink">اللقب
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-ink">إجمالي النقاط
            <input required type="number" min="0" step="1" dir="ltr" value={form.totalPoints} onChange={(event) => setForm({ ...form, totalPoints: event.target.value })} className={`${fieldClass} text-right font-sans`} />
          </label>
          <div className="flex justify-start gap-2 border-t border-line pt-4">
            <button type="button" onClick={closeEdit} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button>
            <button type="submit" disabled={saving} className={`${buttonClass} bg-forest text-white hover:bg-forest-light`}>
              {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </ManagementModal>

      <ManagementModal open={Boolean(deletingUser)} title="تأكيد حذف المستخدم" eyebrow="إجراء نهائي" onClose={() => !saving && setDeletingUser(null)}>
        <p className="text-sm leading-7 text-muted">سيتم حذف حساب <strong className="text-ink">{deletingUser?.username}</strong> نهائيًا. لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="mt-5 flex justify-start gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => setDeletingUser(null)} disabled={saving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>إلغاء</button>
          <button type="button" onClick={deleteUser} disabled={saving} className={`${buttonClass} bg-[#a84731] text-white hover:bg-[#8e3928]`}>
            {saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'جارٍ الحذف...' : 'حذف الحساب'}
          </button>
        </div>
      </ManagementModal>

      <ManagementModal
        open={Boolean(adjustingUser)}
        title="تعديل نقاط المستخدم"
        eyebrow={adjustingUser?.username || 'إدارة النقاط'}
        onClose={() => !adjustmentSaving && setAdjustingUser(null)}
      >
        <form onSubmit={submitPointAdjustment} className="space-y-4 text-right">
          <label className="block text-sm font-bold text-ink" htmlFor="point-adjustment-amount">
            عدد النقاط
            <input
              id="point-adjustment-amount"
              required
              min="1"
              step="1"
              type="number"
              inputMode="numeric"
              dir="rtl"
              value={adjustmentAmount}
              onChange={(event) => setAdjustmentAmount(event.target.value)}
              className={`${fieldClass} text-right font-sans`}
            />
          </label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="نوع تعديل النقاط">
            <button
              type="button"
              aria-pressed={adjustmentIsPositive}
              onClick={() => setAdjustmentIsPositive(true)}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${adjustmentIsPositive ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-line bg-white text-muted hover:bg-canvas'}`}
            >
              منح نقاط (+)
            </button>
            <button
              type="button"
              aria-pressed={!adjustmentIsPositive}
              onClick={() => setAdjustmentIsPositive(false)}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${!adjustmentIsPositive ? 'border-[#b75a36] bg-[#fff0e9] text-[#8e3928]' : 'border-line bg-white text-muted hover:bg-canvas'}`}
            >
              خصم نقاط (−)
            </button>
          </div>
          <div className="flex justify-start gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setAdjustingUser(null)} disabled={adjustmentSaving} className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}>
              إلغاء
            </button>
            <button type="submit" disabled={adjustmentSaving} className={`${buttonClass} bg-forest text-white hover:bg-forest-light`}>
              {adjustmentSaving && <LoaderCircle size={16} className="animate-spin" />}
              {adjustmentSaving ? 'جارٍ التحديث...' : 'تأكيد التعديل'}
            </button>
          </div>
        </form>
      </ManagementModal>

      <ManagementModal
        open={Boolean(pointsUser)}
        title="كشف حساب النقاط"
        eyebrow="سجل النشاط"
        onClose={() => setPointsUser(null)}
        wide
      >
        <div className="space-y-5 text-center">
          <div className="rounded-xl border border-line bg-canvas/60 px-4 py-4 text-center">
            <h3 className="text-lg font-bold text-ink">{pointsUser?.username}</h3>
            <p className="mt-4 text-sm font-bold text-muted">إجمالي النقاط</p>
            <p className="mt-1 font-sans text-3xl font-extrabold tabular-nums text-forest">
              {(pointsUser?.totalPoints ?? 0).toLocaleString('en-US')}
            </p>
          </div>

          {pointLogsLoading ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-muted" role="status" aria-live="polite">
              <LoaderCircle size={26} className="animate-spin text-forest" />
              <p className="text-sm">جارٍ تحميل سجل النقاط...</p>
            </div>
          ) : pointLogsError ? (
            <div className="space-y-3 rounded-xl bg-[#fff0e9] p-4 text-center" role="alert">
              <p className="text-sm text-[#8e3928]">{pointLogsError}</p>
              <button
                type="button"
                onClick={() => setPointLogsReload((current) => current + 1)}
                className={`${buttonClass} bg-forest text-white hover:bg-forest-light`}
              >
                <RefreshCw size={15} /> إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-line text-center">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full min-w-120 border-collapse text-center">
                    <thead className="sticky top-0 bg-[#f7f8f5] text-xs font-bold text-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-center">نوع العملية / الوصف</th>
                        <th scope="col" className="px-4 py-3 text-center">النقاط</th>
                        <th scope="col" className="px-4 py-3 text-center">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {pointLogs.length > 0 ? pointLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="px-4 py-3 text-center text-sm text-ink">
                            <span className="font-bold">{pointTypeLabels[log.type] || log.type}</span>
                            {log.description && <span className="mt-1 block text-xs text-muted">{log.description}</span>}
                          </td>
                          <td className={`px-4 py-3 text-center font-sans font-bold tabular-nums ${log.amount > 0 ? 'text-emerald-700' : 'text-[#a84731]'}`}>
                            {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString('en-US')} {log.amount < 0 || Math.abs(log.amount) === 1 ? 'نقطة' : 'نقاط'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted">
                            <time className="font-sans tabular-nums" dir="ltr" dateTime={log.createdAt}>
                              {formatPointTimestamp(log.createdAt)}
                            </time>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">
                            لا توجد حركات نقاط مسجلة لهذا المستخدم بعد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {pointLogsPagination.totalPages > 1 && (
                <nav aria-label="التنقل بين صفحات سجل النقاط" className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={pointLogsPage <= 1 || pointLogsLoading}
                    onClick={() => setPointLogsPage((page) => Math.max(1, page - 1))}
                    className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}
                  >
                    الصفحة السابقة
                  </button>
                  <p className="text-sm font-bold text-muted" aria-live="polite">
                    صفحة {pointLogsPagination.currentPage} من {pointLogsPagination.totalPages}
                  </p>
                  <button
                    type="button"
                    disabled={pointLogsPage >= pointLogsPagination.totalPages || pointLogsLoading}
                    onClick={() => setPointLogsPage((page) => Math.min(pointLogsPagination.totalPages, page + 1))}
                    className={`${buttonClass} border border-line bg-white text-ink hover:bg-canvas`}
                  >
                    الصفحة التالية
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </ManagementModal>
    </section>
  )
}