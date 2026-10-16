const syrianMonths = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
]

export function formatRTLDate(dateString) {
  if (!dateString) return '-'

  const match = typeof dateString === 'string' && dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let year
  let month
  let day

  if (match) {
    year = Number(match[1])
    month = Number(match[2]) - 1
    day = Number(match[3])
  } else {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '-'
    year = date.getFullYear()
    month = date.getMonth()
    day = date.getDate()
  }

  if (month < 0 || month > 11 || day < 1 || day > 31) return '-'
  return `${day} ${syrianMonths[month]} ${year}`
}

export const formatCustomDate = (dateInput) => {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatRTLTime(timeString) {
  if (!timeString) return '-'
  const timeOnly = String(timeString).match(/^(\d{1,2}):(\d{2})$/)
  if (timeOnly) return `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}`

  const date = new Date(timeString)
  if (Number.isNaN(date.getTime())) return '-'
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export const formatDate = formatRTLDate