import { useState } from 'react';

export default function ExportModal({
  isOpen,
  exportType = 'file',
  onCancel,
  onConfirm,
  startDate,
  endDate,
  currentMetric
}) {
  const [selectedMetrics, setSelectedMetrics] = useState([currentMetric]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const metrics = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'rainfall', label: 'Rainfall' },
    { id: 'humidity', label: 'Humidity' },
    { id: 'wind', label: 'Wind Speed' },
    { id: 'evapotranspiration', label: 'Evapotranspiration' },
  ];

  const getMessage = () => {
    switch (exportType) {
      case 'png':
      case 'image':
        return 'plot image';
      case 'csv':
      case 'data':
        return 'data';
      default:
        return 'file';
    }
  };

  const handleMetricToggle = (metricId) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm(selectedMetrics);
    setIsProcessing(false);
  };

  const handleCancel = () => {
    setSelectedMetrics([currentMetric]);
    setIsProcessing(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-custom-card rounded-lg shadow-2xl border border-gray-300 dark:border-gray-600 p-8 max-w-lg w-full mx-4 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isProcessing ? (
          // Loading state
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Preparing Your Export
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We are preparing your <span className="font-medium text-primary">{getMessage()}</span> to be exported. Sit back and relax, this won't take long.
              </p>
            </div>
          </div>
        ) : (
          // Confirmation state (for CSV only)
          exportType === 'csv' ? (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Export Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please review and configure your export settings
                </p>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-medium">From:</span> {startDate || 'Not set'} <br />
                    <span className="font-medium">To:</span> {endDate || 'Not set'}
                  </p>
                </div>
              </div>

              {/* Metrics Selection */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Select Metrics to Export</h4>
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

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedMetrics.length === 0}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  OK
                </button>
              </div>
            </div>
          ) : (
            // Direct processing for PNG exports
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Preparing Your Export
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We are preparing your <span className="font-medium text-primary">{getMessage()}</span> to be exported. Sit back and relax, this won't take long.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
