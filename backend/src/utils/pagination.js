const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const positiveInteger = (value, fallback) => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value))) {
    return fallback
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const getPagination = (query = {}) => {
  const limit = Math.min(positiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const requestedPage = positiveInteger(query.page, DEFAULT_PAGE)
  const page = Number.isSafeInteger((requestedPage - 1) * limit) ? requestedPage : DEFAULT_PAGE

  return { page, limit, skip: (page - 1) * limit }
}

const paginationMetadata = (totalItems, page, limit) => ({
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
  currentPage: page,
  itemsPerPage: limit,
})

module.exports = { getPagination, paginationMetadata }
