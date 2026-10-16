/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { settingsService } from '../services/mockService.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(settingsService.getSettings())

  const refreshSettings = () => {
    setSettings(settingsService.getSettings())
  }

  const updateAppName = (appName) => {
    settingsService.updateSettings({ appName })
    refreshSettings()
  }

  const updateAppLogo = (appLogo) => {
    settingsService.updateSettings({ appLogo })
    refreshSettings()
  }

  const updateTheme = (theme) => {
    settingsService.updateTheme(theme)
    refreshSettings()
  }

  const updateLanguage = (language) => {
    settingsService.updateLanguage(language)
    refreshSettings()
  }

  const toggleAnimations = (enabled) => {
    settingsService.toggleAnimations(enabled)
    refreshSettings()
  }

  const toggleRanking = (visible) => {
    settingsService.toggleRanking(visible)
    refreshSettings()
  }

  return (
    <AppContext.Provider
      value={{
        settings,
        updateAppName,
        updateAppLogo,
        updateTheme,
        updateLanguage,
        toggleAnimations,
        toggleRanking,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
