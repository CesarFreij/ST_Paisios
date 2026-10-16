const adminMiddleware = (req, res, next) => {
  if (!['admin', 'owner'].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: administrator access required.',
    })
  }

  return next()
}

module.exports = adminMiddleware