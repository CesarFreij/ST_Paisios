import './LoaderSkeleton.css'

export default function LoaderSkeleton({ lines = 4 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-line" />
      ))}
    </div>
  )
}
