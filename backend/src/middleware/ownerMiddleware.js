const ownerMiddleware = (req, res, next) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: owner access required.',
    })
  }

  return next()
}

module.exports = ownerMiddleware