const WELCOME_STORAGE_KEY = 'dashboard:welcomeShown'

export function shouldShowWelcome() {
  if (typeof window === 'undefined') return false
  try {
    const welcomeShown = localStorage.getItem(WELCOME_STORAGE_KEY)
    return welcomeShown !== 'true'
  } catch {
    return false
  }
}
