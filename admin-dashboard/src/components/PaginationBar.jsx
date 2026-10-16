export default function PaginationBar({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  const pageCount = Math.max(1, totalPages)
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <nav aria-label="التنقل بين صفحات النتائج" className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-4 sm:flex-row sm:px-6">
      <p className="text-sm text-muted">
        عرض <span className="font-sans tabular-nums">{firstItem.toLocaleString('en-US')}-{lastItem.toLocaleString('en-US')}</span>
        {' '}من <span className="font-sans tabular-nums">{totalItems.toLocaleString('en-US')}</span>
        {' '}· الصفحة <span className="font-sans tabular-nums">{currentPage.toLocaleString('en-US')}</span>
        {' '}من <span className="font-sans tabular-nums">{pageCount.toLocaleString('en-US')}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          الصفحة السابقة
        </button>
        <span className="min-w-20 text-center font-sans text-sm font-bold tabular-nums text-ink">
          {currentPage.toLocaleString('en-US')} / {pageCount.toLocaleString('en-US')}
        </span>
        <button
          type="button"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          الصفحة التالية
        </button>
      </div>
    </nav>
  )
}
