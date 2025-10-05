import { useState, useEffect } from 'react'

const evaluateViewport = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const ratio = height ? width / height : 1
  const zoomLevel = Math.round((window.devicePixelRatio || 1) * 100)

  if (width < 960) {
    return {
      title: 'Limited screen width detected',
      message: 'For the best dashboard experience use a device or window wider than 960px.',
      detail: 'You can still continue, but some layouts may require additional scrolling.',
    }
  }

  if (zoomLevel < 75 || zoomLevel > 175) {
    return {
      title: 'Unusual browser zoom level',
      message: `Your browser zoom is currently set to ${zoomLevel}%.`,
      detail: 'Reset to 100% for crisp rendering, or keep this zoom if it works for you.',
    }
  }

  if (ratio > 3.5) {
    return {
      title: 'Ultra-wide aspect ratio detected',
      message: 'Content might appear stretched on ultra-wide displays.',
      detail: 'Try reducing the window width or enable snapping for a centered layout.',
    }
  }

  return null
}

export default function ScreenSizeWarning({ children }) {
  const [warningMessage, setWarningMessage] = useState(() => evaluateViewport())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      setWarningMessage(evaluateViewport())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return (
    <>
      {warningMessage && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[1100] w-full max-w-xl -translate-x-1/2 px-4">
          <div className="pointer-events-auto rounded-xl border border-yellow-300 bg-yellow-50/95 p-4 shadow-lg dark:border-yellow-700 dark:bg-yellow-900/90">
            <h2 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">{warningMessage.title}</h2>
            <p className="mt-1 text-xs text-yellow-800 dark:text-yellow-100">{warningMessage.message}</p>
            <p className="mt-1 text-[11px] text-yellow-700 dark:text-yellow-200/80">{warningMessage.detail}</p>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
