import { useAppContext } from '../context/AppContext.jsx'
import AnimatedPage from '../components/AnimatedPage.jsx'
import './RankingPage.css'

export default function RankingPage() {
  const { settings, toggleRanking } = useAppContext()

  return (
    <AnimatedPage>
      <section className="page-grid">
        <div className="page-header-block">
          <div>
            <p className="page-tag">إدارة الترتيب</p>
            <h2>تحكم بظهور صفحة الترتيب داخل التطبيق.</h2>
          </div>
        </div>

        <article className="toggle-card">
          <div>
            <p className="toggle-title">إظهار صفحة الترتيب للمستخدمين</p>
            <p className="toggle-description">إذا كان الزر مغلقًا، يخفي التطبيق صفحة الترتيب من الواجهة.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.rankingVisible} onChange={(event) => toggleRanking(event.target.checked)} />
            <span className="slider" />
          </label>
        </article>
      </section>
    </AnimatedPage>
  )
}
