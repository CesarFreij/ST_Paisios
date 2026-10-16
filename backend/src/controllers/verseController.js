const Verse = require('../models/Verse')
const { getPagination, paginationMetadata } = require('../utils/pagination')

const millisecondsPerDay = 24 * 60 * 60 * 1000
const legacyFields = '+isSpecificDate +specificDate +orderIndex'

const getSyriaDateString = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Damascus',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)

const getDateOrdinal = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

const isValidDateString = (dateString) => {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

const toLegacyDateString = (value) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value))
  return match?.[1] || null
}

const normalizeVerse = (verse) => {
  if (!verse) return verse
  const data = typeof verse.toObject === 'function' ? verse.toObject() : verse
  const type = data.isSpecificDate === true ? 'scheduled' : data.type || 'cyclic'
  return {
    ...data,
    type,
    scheduledDate: data.scheduledDate || (type === 'scheduled' ? toLegacyDateString(data.specificDate) : null),
    order: data.order ?? data.orderIndex,
  }
}

const cyclicFilter = {
  type: { $ne: 'scheduled' },
  isSpecificDate: { $ne: true },
}
const scheduledFilter = {
  $or: [
    { type: 'scheduled' },
    { isSpecificDate: true },
  ],
}

const getNextOrder = async (excludeId) => {
  const verses = await Verse.find(cyclicFilter)
    .select(`order orderIndex ${excludeId ? '_id' : ''}`)
    .select(legacyFields)
    .lean()
  return verses.reduce((maximum, verse) => {
    if (excludeId && String(verse._id) === String(excludeId)) return maximum
    const order = verse.order ?? verse.orderIndex
    return Number.isFinite(order) ? Math.max(maximum, order) : maximum
  }, -1) + 1
}

const getVerses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const requestedType = req.query.type
    const type = requestedType === 'specific' ? 'scheduled'
      : requestedType === 'sequential' ? 'cyclic'
        : ['scheduled', 'cyclic'].includes(requestedType) ? requestedType : 'all'
    const filter = type === 'scheduled' ? scheduledFilter : type === 'cyclic' ? cyclicFilter : {}
    const [verses, totalItems, totalCyclic, totalScheduled] = await Promise.all([
      Verse.find(filter)
        .select(legacyFields)
        .sort({ scheduledDate: 1, specificDate: 1, order: 1, orderIndex: 1, createdAt: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Verse.countDocuments(filter),
      Verse.countDocuments(cyclicFilter),
      Verse.countDocuments(scheduledFilter),
    ])

    return res.status(200).json({
      success: true,
      data: verses.map(normalizeVerse),
      pagination: paginationMetadata(totalItems, page, limit),
      counts: {
        all: totalCyclic + totalScheduled,
        cyclic: totalCyclic,
        scheduled: totalScheduled,
        sequential: totalCyclic,
        specific: totalScheduled,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch verses.' })
  }
}

const getVerseOfTheDay = async (req, res) => {
  try {
    const syriaDateString = getSyriaDateString()
    const legacyStart = new Date(`${syriaDateString}T00:00:00.000Z`)
    const legacyEnd = new Date(legacyStart.getTime() + millisecondsPerDay)
    const scheduledVerse = await Verse.findOne({
      $or: [
        { type: 'scheduled', scheduledDate: syriaDateString },
        {
          isSpecificDate: true,
          specificDate: { $gte: legacyStart, $lt: legacyEnd },
        },
      ],
    })
      .select(legacyFields)
      .sort({ createdAt: -1, _id: 1 })
      .lean()

    if (scheduledVerse) {
      return res.status(200).json({
        success: true,
        data: normalizeVerse(scheduledVerse),
        source: 'scheduled',
        date: syriaDateString,
      })
    }

    const [totalCyclic, cyclicVerses] = await Promise.all([
      Verse.countDocuments(cyclicFilter),
      Verse.find(cyclicFilter)
        .select(legacyFields)
        .sort({ order: 1, orderIndex: 1, createdAt: 1, _id: 1 })
        .lean(),
    ])

    if (totalCyclic === 0) {
      return res.status(200).json({
        success: true,
        data: {
          text: 'احمل صليبك كل يوم واتبعني ماذا ينتفع العالم لو ربح العالم كله وخسر نفسه؟',
          reference: 'مرقس 8:34، 36',
          type: 'fallback',
        },
        source: 'fallback',
        date: syriaDateString,
      })
    }

    const dayNumber = Math.floor(
      (getDateOrdinal(syriaDateString) - getDateOrdinal('1970-01-01')) / millisecondsPerDay
    )
    const currentIndex = ((dayNumber % totalCyclic) + totalCyclic) % totalCyclic
    const orderedVerses = cyclicVerses
      .map(normalizeVerse)
      .sort((first, second) => {
        const firstOrder = first.order
        const secondOrder = second.order
        if (Number.isFinite(firstOrder) && Number.isFinite(secondOrder) && firstOrder !== secondOrder) {
          return firstOrder - secondOrder
        }
        if (Number.isFinite(firstOrder) !== Number.isFinite(secondOrder)) {
          return Number.isFinite(firstOrder) ? -1 : 1
        }
        return new Date(first.createdAt) - new Date(second.createdAt)
          || String(first._id).localeCompare(String(second._id))
      })

    return res.status(200).json({
      success: true,
      data: orderedVerses[currentIndex],
      source: 'cyclic',
      index: currentIndex,
      date: syriaDateString,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Failed to fetch today’s verse.' })
  }
}

const getVerseInput = (body) => {
  const type = body.type
    ?? (body.isSpecificDate === true || body.specificDate || body.date ? 'scheduled' : 'cyclic')
  const scheduledDate = body.scheduledDate ?? body.specificDate ?? body.date
  return { type, scheduledDate }
}

const hasScheduledDate = async (scheduledDate, excludeId) => {
  const legacyStart = new Date(`${scheduledDate}T00:00:00.000Z`)
  const legacyEnd = new Date(legacyStart.getTime() + millisecondsPerDay)
  const filter = {
    ...scheduledFilter,
    $and: [
      { _id: { $ne: excludeId || null } },
      {
        $or: [
          { type: 'scheduled', scheduledDate },
          { isSpecificDate: true, specificDate: { $gte: legacyStart, $lt: legacyEnd } },
        ],
      },
    ],
  }
  return Verse.exists(filter)
}

const addVerse = async (req, res) => {
  try {
    const body = req.body || {}
    const { type, scheduledDate } = getVerseInput(body)
    if (!['cyclic', 'scheduled'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be cyclic or scheduled.' })
    }
    if (type === 'scheduled' && !isValidDateString(scheduledDate)) {
      return res.status(400).json({ success: false, message: 'A valid scheduledDate in YYYY-MM-DD format is required.' })
    }
    if (type === 'scheduled' && await hasScheduledDate(scheduledDate)) {
      return res.status(409).json({
        success: false,
        message: 'يوجد آية مخصصة لهذا التاريخ بالفعل. يرجى اختيار تاريخ آخر.',
      })
    }

    const order = type === 'cyclic' ? await getNextOrder() : undefined
    const verse = await Verse.create({
      text: body.text,
      reference: body.reference,
      type,
      scheduledDate: type === 'scheduled' ? scheduledDate : undefined,
      order,
      isSpecificDate: type === 'scheduled',
      specificDate: type === 'scheduled' ? new Date(`${scheduledDate}T00:00:00.000Z`) : undefined,
      orderIndex: order,
    })
    return res.status(201).json({ success: true, data: normalizeVerse(verse) })
  } catch (error) {
    console.error(error)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'يوجد آية مخصصة لهذا التاريخ بالفعل.' })
    }
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to create verse.' })
  }
}

const updateVerse = async (req, res) => {
  try {
    const verse = await Verse.findById(req.params.verseId).select(legacyFields)
    if (!verse) {
      return res.status(404).json({ success: false, message: 'Verse not found.' })
    }

    const body = req.body || {}
    const current = normalizeVerse(verse)
    const type = body.type
      ?? (body.isSpecificDate !== undefined
        ? (body.isSpecificDate ? 'scheduled' : 'cyclic')
        : current.type)
    const scheduledDate = body.scheduledDate ?? body.specificDate ?? body.date ?? current.scheduledDate
    if (!['cyclic', 'scheduled'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be cyclic or scheduled.' })
    }
    if (type === 'scheduled' && !isValidDateString(scheduledDate)) {
      return res.status(400).json({ success: false, message: 'A valid scheduledDate in YYYY-MM-DD format is required.' })
    }
    if (type === 'scheduled' && await hasScheduledDate(scheduledDate, verse._id)) {
      return res.status(409).json({
        success: false,
        message: 'يوجد آية مخصصة لهذا التاريخ بالفعل. يرجى اختيار تاريخ آخر.',
      })
    }

    if (body.text !== undefined) verse.text = body.text
    if (body.reference !== undefined) verse.reference = body.reference
    verse.type = type
    verse.scheduledDate = type === 'scheduled' ? scheduledDate : undefined
    verse.order = type === 'cyclic'
      ? (body.order ?? current.order ?? await getNextOrder(verse._id))
      : undefined
    verse.isSpecificDate = type === 'scheduled'
    verse.specificDate = type === 'scheduled' ? new Date(`${scheduledDate}T00:00:00.000Z`) : undefined
    verse.orderIndex = verse.order

    await verse.save()
    return res.status(200).json({ success: true, data: normalizeVerse(verse) })
  } catch (error) {
    console.error(error)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'يوجد آية مخصصة لهذا التاريخ بالفعل.' })
    }
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500
    return res.status(status).json({ success: false, message: 'Failed to update verse.' })
  }
}

const deleteVerse = async (req, res) => {
  try {
    const verse = await Verse.findByIdAndDelete(req.params.verseId)
    if (!verse) {
      return res.status(404).json({ success: false, message: 'Verse not found.' })
    }
    return res.status(200).json({ success: true, message: 'Verse deleted.' })
  } catch (error) {
    console.error(error)
    return res.status(400).json({ success: false, message: 'Invalid verse ID.' })
  }
}

module.exports = {
  getVerses,
  getVerseOfTheDay,
  addVerse,
  createVerse: addVerse,
  updateVerse,
  deleteVerse,
}
