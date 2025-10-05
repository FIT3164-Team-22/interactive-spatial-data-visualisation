/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem('theme') === 'dark'
  } catch {
    return false
  }
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const { document: doc, localStorage: storage } = window

    if (isDark) {
      doc?.documentElement?.classList.add('dark')
      storage?.setItem('theme', 'dark')
    } else {
      doc?.documentElement?.classList.remove('dark')
      storage?.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
