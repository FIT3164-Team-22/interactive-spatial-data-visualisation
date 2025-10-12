export default function EmptyState({ title, message, icon }) {
  const defaultIcon = (
    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  return (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4" role="status" aria-live="polite">
      <div className="text-center max-w-md">
        <div className="mb-3" aria-hidden="true">
          {icon || defaultIcon}
        </div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</p>
        {message && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>}
      </div>
    </div>
  )
}
