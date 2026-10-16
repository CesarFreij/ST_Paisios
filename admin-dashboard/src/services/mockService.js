const STORAGE_KEY = 'st-seraphim-admin'

const initialData = {
  admin: {
    password: '123456',
    appName: 'القديس سيرافيم',
    appLogo: null,
    animationsEnabled: true,
    theme: 'light',
    language: 'ar',
  },
  auth: {
    isLoggedIn: false,
  },
  ranking: {
    visible: true,
  },
  verses: [
    { id: 1, text: 'الرب راعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.', reference: 'مزمور 23:1', createdAt: '2026-07-10' },
    { id: 2, text: 'فَإِنَّنَا عَلَى صِرَاطٍ مُنْحَدِرٍ إِلَى الْفَوَاكِهُ.', reference: 'رومية 8:32', createdAt: '2026-07-11' },
    { id: 3, text: 'اِرْجِعُوا إِلَى أَنَا، وَأَنَا أَرْجِعُ إِلَيْكُمْ.', reference: 'ملاخي 3:7', createdAt: '2026-07-12' },
  ],
  questions: [
    {
      id: 1,
      question: 'ما هو اسم الكتاب المقدس باللغة العربية؟',
      options: ['الإنجيل', 'التوراة', 'الزبور', 'القرآن'],
      answer: 'الإنجيل',
      points: 10,
      createdAt: '2026-07-10',
    },
    {
      id: 2,
      question: 'كم عدد الأناجيل في العهد الجديد؟',
      options: ['2', '3', '4', '5'],
      answer: '4',
      points: 15,
      createdAt: '2026-07-11',
    },
  ],
  exams: [
    {
      id: 1,
      title: 'اختبار الأسبوع الذهبي',
      description: 'اختبار شامل لمواضيع الإيمان والتاريخ الكتابي.',
      startDate: '2026-07-15',
      endDate: '2026-07-22',
      points: 100,
      active: true,
      questions: [
        {
          id: 1,
          question: 'من هو الأب الروحي للرعية؟',
          options: ['مريم', 'بطرس', 'بولس', 'يوحنا'],
          answer: 'بطرس',
          points: 10,
        },
        {
          id: 2,
          question: 'ما عدد الوصايا؟',
          options: ['7', '10', '12', '5'],
          answer: '10',
          points: 10,
        },
      ],
      createdAt: '2026-07-11',
    },
  ],
  users: [
    {
      id: 1,
      name: 'ماريا يوسف',
      email: 'maria@example.com',
      avatar: null,
      points: 1240,
      title: 'راعية نقية',
      registeredAt: '2026-06-12',
      lastLogin: '2026-07-29 22:34',
      status: 'Online',
      prayerCount: 34,
      bibleReads: 12,
      churchVisits: 6,
      invites: 18,
      achievements: 8,
      commitment: '92%',
      lastSync: '2026-07-29 23:05',
    },
    {
      id: 2,
      name: 'يوسف سالم',
      email: 'yousef@example.com',
      avatar: null,
      points: 980,
      title: 'خادم أمين',
      registeredAt: '2026-05-18',
      lastLogin: '2026-07-28 14:12',
      status: 'Offline',
      prayerCount: 22,
      bibleReads: 8,
      churchVisits: 4,
      invites: 9,
      achievements: 6,
      commitment: '83%',
      lastSync: '2026-07-28 14:15',
    },
  ],
}

const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('فشل تحميل البيانات من LocalStorage', error)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
  return initialData
}

const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const data = loadData()

export const authService = {
  login(password) {
    const valid = data.admin.password
    if (password === valid) {
      data.auth.isLoggedIn = true
      saveData(data)
      return true
    }
    return false
  },
  logout() {
    data.auth.isLoggedIn = false
    saveData(data)
  },
  isAuthenticated() {
    return data.auth.isLoggedIn
  },
}

export const settingsService = {
  getSettings() {
    return {
      appName: data.admin.appName,
      appLogo: data.admin.appLogo,
      animationsEnabled: data.admin.animationsEnabled,
      theme: data.admin.theme,
      language: data.admin.language,
      rankingVisible: data.ranking.visible,
    }
  },
  updateSettings(payload) {
    Object.assign(data.admin, payload)
    saveData(data)
  },
  toggleAnimations(enabled) {
    data.admin.animationsEnabled = enabled
    saveData(data)
  },
  toggleRanking(visible) {
    data.ranking.visible = visible
    saveData(data)
  },
  updateTheme(theme) {
    data.admin.theme = theme
    saveData(data)
  },
  updateLanguage(language) {
    data.admin.language = language
    saveData(data)
  },
  updatePassword(newPassword) {
    data.admin.password = newPassword
    saveData(data)
  },
}

export const verseService = {
  getAll() {
    return [...data.verses]
  },
  create(verse) {
    const nextId = Math.max(...data.verses.map((item) => item.id), 0) + 1
    data.verses.push({ ...verse, id: nextId, createdAt: new Date().toISOString().slice(0, 10) })
    saveData(data)
  },
  update(id, updates) {
    const item = data.verses.find((item) => item.id === id)
    Object.assign(item, updates)
    saveData(data)
  },
  remove(id) {
    data.verses = data.verses.filter((item) => item.id !== id)
    saveData(data)
  },
}

export const questionService = {
  getAll() {
    return [...data.questions]
  },
  create(question) {
    const nextId = Math.max(...data.questions.map((item) => item.id), 0) + 1
    data.questions.push({ ...question, id: nextId, createdAt: new Date().toISOString().slice(0, 10) })
    saveData(data)
  },
  update(id, updates) {
    const item = data.questions.find((item) => item.id === id)
    Object.assign(item, updates)
    saveData(data)
  },
  remove(id) {
    data.questions = data.questions.filter((item) => item.id !== id)
    saveData(data)
  },
}

export const examService = {
  getAll() {
    return [...data.exams]
  },
  create(exam) {
    const nextId = Math.max(...data.exams.map((item) => item.id), 0) + 1
    data.exams.push({ ...exam, id: nextId, createdAt: new Date().toISOString().slice(0, 10) })
    saveData(data)
  },
  update(id, updates) {
    const item = data.exams.find((item) => item.id === id)
    Object.assign(item, updates)
    saveData(data)
  },
  remove(id) {
    data.exams = data.exams.filter((item) => item.id !== id)
    saveData(data)
  },
}

export const userService = {
  getAll() {
    return [...data.users]
  },
  getById(id) {
    return data.users.find((item) => item.id === id)
  },
}

export const appService = {
  getStats() {
    return {
      usersCount: data.users.length,
      versesCount: data.verses.length,
      questionsCount: data.questions.length,
      examsCount: data.exams.length,
      latestExam: data.exams[data.exams.length - 1],
      latestVerse: data.verses[data.verses.length - 1],
      latestQuestion: data.questions[data.questions.length - 1],
    }
  },
}
