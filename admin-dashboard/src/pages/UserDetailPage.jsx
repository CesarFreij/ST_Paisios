import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import AnimatedPage from '../components/AnimatedPage.jsx'
import { userService } from '../services/mockService.js'
import './UserDetailPage.css'

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useMemo(() => userService.getById(Number(id)), [id])

  if (!user) {
    return <Navigate to="/users" replace />
  }

  return (
    <AnimatedPage>
      <section className="page-grid">
        <div className="page-header-block">
          <div>
            <p className="page-tag">تفاصيل المستخدم</p>
            <h2>عرض تفاصيل الحساب والتحكم في الصلاحيات.</h2>
          </div>
        </div>

        <div className="user-detail-card">
          <div className="user-detail-row">
            <span>الاسم</span>
            <strong>{user.name}</strong>
          </div>
          <div className="user-detail-row">
            <span>البريد الإلكتروني</span>
            <strong>{user.email}</strong>
          </div>
          <div className="user-detail-row">
            <span>الصلاحية</span>
            <strong>{user.role}</strong>
          </div>
          <div className="user-detail-row">
            <span>آخر تسجيل دخول</span>
            <strong>{user.lastLogin}</strong>
          </div>
          <div className="user-detail-row">
            <span>عدد الأسئلة</span>
            <strong>{user.stats.questions}</strong>
          </div>
          <div className="user-detail-row">
            <span>المجموعات</span>
            <strong>{user.stats.exams}</strong>
          </div>
          <button className="close-btn" onClick={() => navigate('/users')}>
            العودة إلى المستخدمين
          </button>
        </div>
      </section>
    </AnimatedPage>
  )
}
