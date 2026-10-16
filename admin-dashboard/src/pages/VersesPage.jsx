import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import AnimatedPage from '../components/AnimatedPage.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { verseService } from '../services/mockService.js'
import { formatRTLDate } from '../utils/dateFormatter.js'
import './VersesPage.css'

export default function VersesPage() {
  const [search, setSearch] = useState('')
  const [selectedVerse, setSelectedVerse] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const verses = useMemo(() => verseService.getAll(), [])
  const filtered = verses.filter((item) => item.text.includes(search) || item.reference.includes(search))

  const handleDelete = (verse) => {
    setSelectedVerse(verse)
    setDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!selectedVerse) return
    verseService.remove(selectedVerse.id)
    setDialogOpen(false)
    toast.success('تم حذف الآية')
    window.location.reload()
  }

  return (
    <AnimatedPage>
      <section className="page-grid">
        <div className="page-header-block">
          <div>
            <p className="page-tag">إدارة الآيات اليومية</p>
            <h2>تحكم كامل في الآيات دون الحاجة لقاعدة بيانات</h2>
          </div>
          <button className="page-action">إضافة آية جديدة</button>
        </div>

        <div className="table-actions">
          <input
            type="search"
            placeholder="ابحث عن آية أو مرجع"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
              <thead>
                <tr>
                  <th>النص</th>
                  <th>المرجع</th>
                  <th>تاريخ الإضافة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.text}</td>
                    <td>{item.reference}</td>
                    <td>{formatRTLDate(item.createdAt)}</td>
                    <td>
                      <button className="table-button">تعديل</button>
                      <button className="table-button table-button--danger" onClick={() => handleDelete(item)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>

      <ConfirmDialog
        open={dialogOpen}
        title="تأكيد حذف الآية"
        description="هل أنت متأكد من أنك تريد حذف هذه الآية؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onClose={() => setDialogOpen(false)}
      />
    </AnimatedPage>
  )
}
