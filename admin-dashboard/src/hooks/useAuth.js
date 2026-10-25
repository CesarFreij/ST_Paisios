import { useSyncExternalStore } from 'react'

const AUTH_CHANGE_EVENT = 'st-paisios-auth-change'
const TOKEN_KEY = 'st_paisios_token'
const USER_KEY = 'st_paisios_user'

const subscribe = (onChange) => {
  window.addEventListener(AUTH_CHANGE_EVENT, onChange)
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, onChange)
}

const getSnapshot = () => Boolean(localStorage.getItem(TOKEN_KEY))

export default function useAuth() {
  const isAuthenticated = useSyncExternalStore(subscribe, getSnapshot)

  return {
    isAuthenticated,
    login: (token, user) => {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
    },
  }
}
