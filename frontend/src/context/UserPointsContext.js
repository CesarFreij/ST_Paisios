import { createContext, useContext, useMemo, useState } from 'react'

const UserPointsContext = createContext(null)

export function UserPointsProvider({ children }) {
  const [user, setUser] = useState(null)
  const value = useMemo(() => ({ user, setUser }), [user])

  return (
    <UserPointsContext.Provider value={value}>
      {children}
    </UserPointsContext.Provider>
  )
}

export function useUserPoints() {
  const context = useContext(UserPointsContext)
  if (!context) {
    throw new Error('useUserPoints must be used within a UserPointsProvider.')
  }
  return context
}
