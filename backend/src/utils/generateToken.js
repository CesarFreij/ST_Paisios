const jwt = require('jsonwebtoken')

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables')
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1y',
  })
}

module.exports = generateToken
