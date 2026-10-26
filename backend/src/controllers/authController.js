const User = require('../models/User')
const generateToken = require('../utils/generateToken')

const authController = {
  register: async (req, res) => {
    try {
      const { username, password, confirmPassword } = req.body

      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        typeof confirmPassword !== 'string' ||
        !username.trim() ||
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message: 'جميع الحقول مطلوبة.',
        })
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'كلمة المرور وتأكيدها غير متطابقين.',
        })
      }

      const existingUser = await User.findOne({ username: username.trim() })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم موجود بالفعل.',
        })
      }

      const user = await User.create({
        username: username.trim(),
        password,
        totalPoints: 0,
        title: '',
        role: 'user',
      })

      const token = generateToken(user._id)

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح.',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            role: user.role,
            totalPoints: user.totalPoints,
            maxPoints: user.maxPoints,
            title: user.title,
          },
        },
      })
    } catch (error) {
      if (
        error.code === 11000 &&
        (error.keyPattern?.username || error.keyValue?.username !== undefined)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken.',
        })
      }
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي. حاول مرة أخرى.',
      })
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'جميع الحقول مطلوبة.',
        })
      }

      const user = await User.findOne({ username: username.trim() })
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
        })
      }

      if (password !== user.password) {
        return res.status(401).json({
          success: false,
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
        })
      }

      const token = generateToken(user._id)

      return res.status(200).json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح.',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            role: user.role,
            totalPoints: user.totalPoints,
            maxPoints: user.maxPoints,
            title: user.title,
          },
        },
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي. حاول مرة أخرى.',
      })
    }
  },

  me: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      let user = req.user

      if (req.query.consumePointUpdate === 'true') {
        user = await User.findByIdAndUpdate(
          req.user._id,
          { $set: { hasUnseenPointsUpdate: false, unseenPointsDifference: 0 } },
          { returnDocument: 'before' }
        ).select('username totalPoints maxPoints title role createdAt hasUnseenPointsUpdate unseenPointsDifference')

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized',
          })
        }
      }

      const {
        _id,
        username,
        totalPoints,
        totalEarnedPoints,
        maxPoints,
        title,
        role,
        createdAt,
      } = user
      const hasUnseenPointsUpdate = Boolean(user.hasUnseenPointsUpdate)
      const unseenPointsDifference = Number(user.unseenPointsDifference) || 0

      return res.status(200).json({
        success: true,
        message: 'تم جلب بيانات المستخدم بنجاح.',
        data: {
          id: _id,
          username,
          totalPoints,
          maxPoints: maxPoints ?? Math.max(totalEarnedPoints ?? 0, totalPoints ?? 0, 0),
          title,
          role,
          createdAt,
          hasUnseenPointsUpdate,
          unseenPointsDifference,
        },
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي. حاول مرة أخرى.',
      })
    }
  },
}

module.exports = authController
