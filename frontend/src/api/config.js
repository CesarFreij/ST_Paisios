const MY_PC_IP = 'http://192.168.1.107:5000';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim()

const baseUrl = configuredApiBaseUrl || (__DEV__ ? MY_PC_IP : '')

if (!baseUrl) {
  throw new Error('EXPO_PUBLIC_API_URL must be configured for production builds.')
}

export const API_BASE_URL = baseUrl.replace(/\/+$/, '').replace(/\/api$/i, '')