import { formatRTLDate, formatRTLTime } from './dateFormatter.js'

export const formatDate = formatRTLDate

export function formatDateTime(value) {
  if (!value) return '-'
  return `${formatRTLDate(value)} ${formatRTLTime(value)}`
}
