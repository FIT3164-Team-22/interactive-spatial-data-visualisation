export default function EmptyState({ title, message, icon }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
      <div className="text-center">
        {icon && <div className="text-4xl mb-2">{icon}</div>}
        <p className="text-lg font-medium">{title}</p>
        {message && <p className="text-sm mt-2">{message}</p>}
      </div>
    </div>
  );
}
