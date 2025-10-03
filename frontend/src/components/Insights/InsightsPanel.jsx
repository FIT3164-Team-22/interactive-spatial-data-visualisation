import SkeletonLoader from '../common/SkeletonLoader'
import EmptyState from '../common/EmptyState'
import { useFilters } from '../../context/FilterContext'
import { useWeatherSummary } from '../../hooks/useWeatherSummary'

const metricOrder = [
  'temperature_max',
  'temperature_min',
  'rainfall',
  'humidity_max',
  'humidity_min',
  'wind',
  'evapotranspiration',
]

export default function InsightsPanel() {
  const { filters } = useFilters()
  const stationIds = filters.selectedStation ? [filters.selectedStation] : []
  const metrics = filters.selectedMetric ? [filters.selectedMetric] : undefined

  const { data, isLoading, error } = useWeatherSummary({
    stationIds,
    state: filters.state,
    startDate: filters.startDate,
    endDate: filters.endDate,
    metrics,
  })

  if (isLoading) {
    return <SkeletonLoader type="stats" />
  }

  if (error) {
    return <EmptyState title="Unable to load insights" message={error.message} />
  }

  if (!data) {
    return <EmptyState title="No summary available" message="Adjust filters and try again." />
  }

  const coverageText = data.coverage?.start && data.coverage?.end
    ? `${data.coverage.start} – ${data.coverage.end}`
    : 'No date range'

  return (
    <div className="bg-white dark:bg-custom-card rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 p-6">
      <div className="flex flex-col gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Insights</h3>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
          <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Records analysed: <strong>{data.records_analyzed}</strong>
          </span>
          <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Stations: <strong>{data.stations_covered}</strong>
          </span>
          <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Coverage: <strong>{coverageText}</strong>
          </span>
        </div>
      </div>

      {data.insights?.length ? (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Highlights</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {data.insights.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.anomalies?.length ? (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">Potential anomalies</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {data.anomalies.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Metrics at a glance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metricOrder
            .filter((key) => data.metrics[key])
            .map((key) => {
              const metric = data.metrics[key]
              return (
                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">{metric.label}</div>
                  {(metric.max_anomaly?.is_anomaly || metric.min_anomaly?.is_anomaly) && (
                    <div className="flex flex-wrap gap-2 mb-2 text-xs">
                      {metric.max_anomaly?.is_anomaly && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">High outlier</span>
                      )}
                      {metric.min_anomaly?.is_anomaly && (
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Low outlier</span>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Average: <strong>{formatValue(metric.average)}</strong></span>
                    <span>Maximum: <strong>{formatValue(metric.maximum)}</strong></span>
                    <span>Minimum: <strong>{formatValue(metric.minimum)}</strong></span>
                    <span>Samples: <strong>{metric.count}</strong></span>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  return Number.parseFloat(value).toFixed(2)
}
