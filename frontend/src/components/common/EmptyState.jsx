export default function EmptyState({ title, message }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
      <div className="text-center max-w-xs">
        <p className="text-lg font-medium">{title}</p>
        {message && <p className="text-sm mt-2">{message}</p>}
      </div>
    </div>
  )
}
