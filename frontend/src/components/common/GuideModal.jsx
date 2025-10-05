import { useEffect, useRef } from 'react'

export default function GuideModal({ isOpen, onClose, pdfUrl, downloadFileName = 'guide.pdf' }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Guide"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onClose?.()}
      />
      <div className="relative bg-white dark:bg-custom-card rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600 w-full max-w-5xl mx-4 md:mx-6 lg:mx-12 h-[85vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Platform Guide</h2>
          <button
            ref={closeButtonRef}
            onClick={() => onClose?.()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition"
            type="button"
            aria-label="Close guide dialog"
          >
            X
          </button>
        </div>

        <div className="flex flex-wrap gap-3 px-6 pt-4" aria-label="Guide actions">
          <a
            href={pdfUrl}
            download={downloadFileName}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
          >
            Download PDF
          </a>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
          >
            Open in New Tab
          </a>
        </div>

        <div className="flex-1 mt-4 px-6 pb-10">
          <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <iframe
              title="Guide PDF preview"
              src={pdfUrl}
              className="w-full h-full"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            If the preview does not load, use the buttons above to open the guide in a new tab or download it locally.
          </p>
        </div>
      </div>
    </div>
  )
}

