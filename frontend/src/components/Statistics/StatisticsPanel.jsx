import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client'
import { useFilters } from '../../context/FilterContext'
import EmptyState from '../common/EmptyState'

const fetchStatistics = async (filters) => {
  const params = {}
  if (filters.state) params.state = filters.state
  if (filters.startDate) params.start_date = filters.startDate
  if (filters.endDate) params.end_date = filters.endDate
  if (filters.selectedStation) params.station_ids = filters.selectedStation

  const response = await apiClient.get('statistics', { params })
  return response.data
}

const correlationDescription = (correlation) => {
  if (correlation > 0.7) return 'Strong positive relationship'
  if (correlation > 0.4) return 'Moderate positive relationship'
  if (correlation > 0.0) return 'Weak positive relationship'
  if (correlation > -0.4) return 'Weak negative relationship'
  if (correlation > -0.7) return 'Moderate negative relationship'
  return 'Strong negative relationship'
}

export default function StatisticsPanel() {
  const { filters } = useFilters()

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['statistics', filters],
    queryFn: () => fetchStatistics(filters),
    enabled: Boolean(filters.state || filters.selectedStation),
  })

  if (!filters.state && !filters.selectedStation) {
    return (
      <EmptyState
        title="No region or station selected"
        message="Select a station marker or choose a state to view statistical analysis."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12" aria-hidden="true">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error || stats?.error) {
    const message = error?.message || stats?.error || 'Failed to load statistics'
    return <EmptyState title="Unable to load statistics" message={message} />
  }

  const dominantFactor = stats?.dominant_factor || 'Not available'

  const explanations = {
    'Maximum Temperature': 'Temperature variability is highest across the selected filters.',
    'Minimum Temperature': 'Minimum temperature fluctuates the most across the selected filters.',
    'Rainfall': 'Rainfall shows the greatest variation, indicating irregular precipitation.',
    'Maximum Humidity': 'Humidity levels vary significantly within the selected timeframe.',
    'Minimum Humidity': 'Minimum humidity values fluctuate strongly in the dataset.',
    'Wind Speed': 'Wind speed presents the highest variance across the selection.',
    'Evapotranspiration': 'Evapotranspiration variability dominates the selected dataset.',
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">Statistical Analysis</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Overview of statistical trends for the selected filters.
        </p>
      </header>

      <section
        className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border-l-4 border-primary"
        aria-label="Summary statistics"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample size</span>
          <span className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{stats.sample_size?.toLocaleString()} records</span>
        </div>
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dominant weather factor</span>
          <div className="text-lg font-bold text-primary mt-1">{dominantFactor}</div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2">
          {explanations[dominantFactor] || 'This metric exhibits the largest variation within the selected dataset.'}
        </p>
      </section>

      <section aria-label="Metric statistics">
        <h3 className="text-md font-semibold mb-3 dark:text-gray-200">Metric statistics</h3>
        <div className="space-y-3">
          {stats.statistics &&
            Object.entries(stats.statistics).map(([metric, values]) => (
              <article key={metric} className="border-l-4 border-primary pl-3 py-1">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize mb-1">
                  {metric.replace(/_/g, ' ')}
                </h4>
                <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    Mean: <span className="font-semibold">{values.mean}</span>
                  </div>
                  <div>
                    Median: <span className="font-semibold">{values.median}</span>
                  </div>
                  <div>
                    Min: <span className="font-semibold">{values.min}</span>
                  </div>
                  <div>
                    Max: <span className="font-semibold">{values.max}</span>
                  </div>
                  <div className="col-span-2">
                    Std dev: <span className="font-semibold">{values.std}</span>
                  </div>
                </dl>
              </article>
            ))}
        </div>
      </section>

      {stats.correlations && stats.correlations.length > 0 && (
        <section aria-label="Correlation analysis">
          <h3 className="text-md font-semibold mb-2 dark:text-gray-200">Weather metric correlations</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Correlation measures the linear relationship between two variables. Values range from -1 (perfect negative) to +1 (perfect positive).
          </p>
          <div className="space-y-2">
            {stats.correlations.map((correlation) => (
              <article key={correlation.pair} className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{correlation.pair}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      correlation.strength === 'Strong'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                        : correlation.strength === 'Moderate'
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                          : correlation.strength === 'Weak'
                            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {correlation.strength}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>
                    Correlation: <strong>{correlation.correlation}</strong>
                  </span>
                  <span>
                    p-value: <strong>{correlation.p_value}</strong>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                  {correlationDescription(correlation.correlation)}{correlation.p_value < 0.05 ? ' (statistically significant)' : ' (not significant)'}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
