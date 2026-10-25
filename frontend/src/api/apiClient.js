import axios from 'axios'
import { API_BASE_URL } from './config'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// attach token from AsyncStorage for each request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('st_paisios_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (err) {
    // ignore
  }
  return config
})

export default api
