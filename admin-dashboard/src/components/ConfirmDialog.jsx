import './ConfirmDialog.css'

export default function ConfirmDialog({ open, title, description, onConfirm, onClose }) {
  return (
    <div className={`confirm-dialog ${open ? 'confirm-dialog--visible' : ''}`}>
      <div className="confirm-card">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="confirm-actions">
          <button className="confirm-button confirm-button--cancel" type="button" onClick={onClose}>
            إلغاء
          </button>
          <button className="confirm-button confirm-button--confirm" type="button" onClick={onConfirm}>
            تأكيد
          </button>
        </div>
      </div>
    </div>
  )
}
