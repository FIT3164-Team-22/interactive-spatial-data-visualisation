import { useMemo, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useFilters } from '../../context/FilterContext'
import { useWeatherData } from '../../hooks/useWeatherData'
import { useTheme } from '../../context/ThemeContext'
import { metricConfig } from '../../constants/metrics'
import EmptyState from '../common/EmptyState'
import { toast } from '../../utils/toast'

export default function DistributionCharts() {
  const { selectedStationId, startDate, endDate, selectedMetric } = useFilters()
  const { isDark } = useTheme()
  const chartRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data: weatherData, isLoading, error } = useWeatherData(
    selectedStationId ? [selectedStationId] : null,
    startDate,
    endDate,
    [selectedMetric],
  )

  const config = metricConfig[selectedMetric] || metricConfig.temperature
  const stationName = weatherData?.[0]?.station_name || 'Station'

  const values = useMemo(
    () =>
      weatherData
        ?.map((entry) => entry[config.key])
        .filter((value) => value !== null && value !== undefined) || [],
    [weatherData, config.key],
  )

  const handleExportPNG = async () => {
    if (!chartRef.current || isExporting) return

    setIsExporting(true)
    toast.info('Exporting distribution chart...')

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: isDark ? '#242429' : '#ffffff',
        scale: 2,
      })

      const link = document.createElement('a')
      link.download = `${stationName}_${selectedMetric}_distribution.png`
      link.href = canvas.toDataURL()
      link.click()
      toast.success('Distribution chart exported successfully')
    } catch (exportError) {
      const message = exportError?.message || 'Failed to export chart'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  if (!selectedStationId) {
    return <EmptyState title="No station selected" message="Click on a station marker to view distribution" />
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-custom-card" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12" aria-hidden="true">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const message = error?.message || 'Unable to load data'
    return <EmptyState title="Error loading data" message={message} />
  }

  if (values.length === 0) {
    return <EmptyState title="No data available" message="Try adjusting your filters" />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)))
  const binSize = binCount === 0 ? 0 : (max - min) / binCount || 1

  const histogram = Array.from({ length: binCount }, (_, index) => {
    const binStart = min + index * binSize
    const binEnd = index === binCount - 1 ? max : binStart + binSize
    const count = values.filter((value) => value >= binStart && value <= binEnd).length
    return {
      range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count,
    }
  })

  const sortedValues = [...values].sort((a, b) => a - b)
  const quartileIndex = (fraction) => Math.floor(sortedValues.length * fraction)
  const q1 = sortedValues[quartileIndex(0.25)]
  const median = sortedValues[quartileIndex(0.5)]
  const q3 = sortedValues[quartileIndex(0.75)]
  const iqr = q3 - q1
  const lowerWhisker = Math.max(min, q1 - 1.5 * iqr)
  const upperWhisker = Math.min(max, q3 + 1.5 * iqr)
  const outliers = values.filter((value) => value < lowerWhisker || value > upperWhisker)

  const boxPlotData = [
    { name: 'Min', value: min },
    { name: 'Q1', value: q1 },
    { name: 'Median', value: median },
    { name: 'Q3', value: q3 },
    { name: 'Max', value: max },
  ]

  return (
    <div className="h-full w-full p-4 flex flex-col overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{stationName} - Distribution</h3>
        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          type="button"
        >
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>

      <div ref={chartRef} className="flex-1 min-h-0 overflow-y-auto space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Histogram</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke={isDark ? '#6B7280' : '#D1D5DB'}
              />
              <YAxis
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: isDark ? '#9CA3AF' : '#6B7280' }}
                stroke={isDark ? '#6B7280' : '#D1D5DB'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#1F2937',
                }}
              />
              <Legend wrapperStyle={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
              <Bar dataKey="count" fill={config.color} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Box Plot Statistics</h4>
          <div className="grid grid-cols-5 gap-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            {boxPlotData.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{stat.name}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stat.value.toFixed(2)}</div>
              </div>
            ))}
          </div>
          {outliers.length > 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-orange-600 dark:text-orange-400">{outliers.length} outlier{outliers.length > 1 ? 's' : ''} detected</span>
              <span className="ml-2">(values beyond 1.5 x IQR from quartiles)</span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 bg-primary/10 dark:bg-primary/20 p-3 rounded">
          <strong>Interpretation:</strong> The histogram shows the frequency distribution of {config.label.toLowerCase()} values.
          The box plot statistics summarise the spread: 50% of values fall between Q1 ({q1.toFixed(2)}) and Q3 ({q3.toFixed(2)})
          with a median of {median.toFixed(2)}.
        </div>
      </div>
    </div>
  )
}
