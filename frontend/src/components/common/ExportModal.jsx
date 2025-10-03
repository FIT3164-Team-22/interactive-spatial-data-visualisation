import { useEffect, useState } from 'react'

export default function ExportModal({
  isOpen,
  exportType = 'file',
  onCancel,
  onConfirm,
  startDate,
  endDate,
  currentMetric,
}) {
  const [selectedMetrics, setSelectedMetrics] = useState(currentMetric ? [currentMetric] : [])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (currentMetric && !selectedMetrics.length) {
      setSelectedMetrics([currentMetric])
    }
  }, [currentMetric, selectedMetrics.length])

  if (!isOpen) return null

  const metrics = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'rainfall', label: 'Rainfall' },
    { id: 'humidity', label: 'Humidity' },
    { id: 'wind', label: 'Wind Speed' },
    { id: 'evapotranspiration', label: 'Evapotranspiration' },
  ]

  const getMessage = () => {
    switch (exportType) {
      case 'png':
      case 'image':
        return 'plot image'
      case 'csv':
      case 'data':
        return 'data export'
      default:
        return 'file'
    }
  }

  const handleMetricToggle = (metricId) => {
    setSelectedMetrics((previous) =>
      previous.includes(metricId)
        ? previous.filter((metric) => metric !== metricId)
        : [...previous, metricId],
    )
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm(selectedMetrics)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setSelectedMetrics(currentMetric ? [currentMetric] : [])
    setIsProcessing(false)
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} aria-hidden="true" />
      <div className="relative bg-white dark:bg-custom-card rounded-lg shadow-2xl border border-gray-300 dark:border-gray-600 p-8 max-w-lg w-full mx-4 animate-scale-in">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          type="button"
          aria-label="Close export dialog"
        >
          X
        </button>

        {isProcessing ? (
          <div className="flex flex-col items-center gap-6" role="status" aria-live="polite">
            <div className="relative w-16 h-16" aria-hidden="true">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Preparing your export</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Preparing your <span className="font-medium text-primary">{getMessage()}</span>. This will only take a moment.
              </p>
            </div>
          </div>
        ) : exportType === 'csv' ? (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Export configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review and configure your export settings.</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Date range</h4>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                <div><span className="font-medium">From:</span> {startDate || 'Not set'}</div>
                <div><span className="font-medium">To:</span> {endDate || 'Not set'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Select metrics to export</h4>
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <label
                    key={metric.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => handleMetricToggle(metric.id)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{metric.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedMetrics.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Export
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6" role="status" aria-live="polite">
            <div className="relative w-16 h-16" aria-hidden="true">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Preparing your export</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Preparing your <span className="font-medium text-primary">{getMessage()}</span>. This will only take a moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
