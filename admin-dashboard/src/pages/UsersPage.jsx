import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.jsx'
import AnimatedPage from '../components/AnimatedPage.jsx'
import './UsersPage.css'

export default function UsersPage() {
  const navigate = useNavigate()
  const { users } = useAppContext()
  const [searchText, setSearchText] = useState('')

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <AnimatedPage>
      <section className="page-grid">
        <div className="page-header-block">
          <div>
            <p className="page-tag">إدارة المستخدمين</p>
            <h2>عرض المستخدمين المسجلين وإدارة صلاحياتهم بسهولة.</h2>
          </div>
        </div>

        <div className="table-actions">
          <input
            type="search"
            placeholder="ابحث باسم المستخدم أو البريد الإلكتروني"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="users-grid">
          {filteredUsers.map((user) => (
            <article key={user.id} className="user-card" onClick={() => navigate(`/users/${user.id}`)}>
              <div className="user-card-top">
                <div>
                  <h3>{user.name}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
                <span className={`user-role user-role--${user.role}`}>{user.role}</span>
              </div>
              <p className="user-meta">آخر تسجيل دخول: {user.lastLogin}</p>
            </article>
          ))}
        </div>
      </section>
    </AnimatedPage>
  )
}
