import api from '../api/apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'st_paisios_token'

const saveAuth = async (token) => {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

const clearAuth = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY)
}

const login = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password })
  return res.data
}

const register = async (username, password, confirmPassword) => {
  const res = await api.post('/api/auth/register', { username, password, confirmPassword })
  return res.data
}

const getCurrentUser = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY)
  if (!token) return null

  try {
    const res = await api.get('/api/auth/me')
    if (res.data && res.data.success) {
      return res.data.data
    }
    return null
  } catch (err) {
    return null
  }
}

const logout = async () => {
  await clearAuth()
}

export default {
  login,
  register,
  getCurrentUser,
  logout,
  saveAuth,
  clearAuth,
}
