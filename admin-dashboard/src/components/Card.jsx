import './Card.css'

export default function Card({ title, value, accent, children }) {
  return (
    <article className={`glass-card ${accent ? 'glass-card--accent' : ''}`}>
      <div className="glass-card-header">
        <p>{title}</p>
        <span>{value}</span>
      </div>
      <div className="glass-card-body">{children}</div>
    </article>
  )
}
