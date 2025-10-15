import { useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { useFilters } from '../../context/FilterContext'
import { useAggregatedData } from '../../hooks/useWeatherData'
import { useTheme } from '../../context/ThemeContext'
import { format, parseISO } from 'date-fns'
import { metricConfig } from '../../constants/metrics'
import EmptyState from '../common/EmptyState'
import { toast } from '../../utils/toast'

export default function TimeSeriesChart() {
  const { selectedStationId, startDate, endDate, selectedMetric, aggregation, setAggregation } = useFilters()
  const { isDark } = useTheme()
  const chartRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)

  const daysDifference = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  }, [startDate, endDate])

  const aggregationCount = useMemo(() => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (daysDifference <= 0) return { count: 0, unit: 'day' }

    switch (aggregation) {
      case 'weekly': {
        const count = Math.max(1, Math.ceil(daysDifference / 7))
        return { count, unit: 'week' }
      }
      case 'monthly': {
        const count = Math.max(
          1,
          (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
        )
        return { count, unit: 'month' }
      }
      case 'yearly': {
        const count = Math.max(1, end.getFullYear() - start.getFullYear() + 1)
        return { count, unit: 'year' }
      }
      case 'daily':
      default: {
        return { count: daysDifference, unit: 'day' }
      }
    }
  }, [startDate, endDate, aggregation, daysDifference])

  const availableAggregations = useMemo(() => {
    const options = [{ value: 'daily', label: 'Daily' }]
    if (daysDifference >= 7) {
      options.push({ value: 'weekly', label: 'Weekly' })
    }
    if (daysDifference >= 30) {
      options.push({ value: 'monthly', label: 'Monthly' })
    }
    if (daysDifference >= 365) {
      options.push({ value: 'yearly', label: 'Yearly' })
    }
    return options
  }, [daysDifference])

  useEffect(() => {
    const isAvailable = availableAggregations.some((option) => option.value === aggregation)
    if (!isAvailable && availableAggregations.length > 0) {
      setAggregation(availableAggregations[0].value)
    }
  }, [availableAggregations, aggregation, setAggregation])

  const { data: weatherData, isLoading, error } = useAggregatedData(
    selectedStationId ? [selectedStationId] : null,
    startDate,
    endDate,
    selectedMetric,
    aggregation,
  )

  const config = metricConfig[selectedMetric] || metricConfig.temperature
  const stationName = weatherData?.[0]?.station_name || 'Station'

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const chartData = useMemo(() => {
    if (!weatherData) return []
    return weatherData.map((entry) => {
      let formattedDate = entry.period
      if (aggregation === 'weekly') {
        const [year, week] = entry.period.split('-W')
        formattedDate = `Week ${week}, ${year}`
      } else if (aggregation === 'monthly') {
        const [year, month] = entry.period.split('-')
        const date = new Date(Number(year), Number(month) - 1)
        formattedDate = format(date, 'MMM yyyy')
      } else if (aggregation === 'yearly') {
        formattedDate = entry.period
      } else {
        formattedDate = format(parseISO(entry.period), 'MMM dd, yyyy')
      }
      return {
        date: formattedDate,
        value: entry.avg_value,
        station: entry.station_name,
        period: entry.period,
      }
    })
  }, [weatherData, aggregation])

  // Calculate linear regression with R²
  const calculateLinearRegression = (data) => {
    if (!data || data.length < 2) return null

    const n = data.length
    const sumX = data.reduce((sum, _, i) => sum + i, 0)
    const sumY = data.reduce((sum, point) => sum + (point.value || 0), 0)
    const sumXY = data.reduce((sum, point, i) => sum + i * (point.value || 0), 0)
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R² (coefficient of determination)
    const meanY = sumY / n
    const predictions = data.map((_, i) => slope * i + intercept)
    const ssTotal = data.reduce((sum, point) => sum + Math.pow((point.value || 0) - meanY, 2), 0)
    const ssResidual = data.reduce((sum, point, i) => sum + Math.pow((point.value || 0) - predictions[i], 2), 0)
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0

    // Calculate standard error
    const standardError = Math.sqrt(ssResidual / (n - 2))

    return { slope, intercept, rSquared, standardError, n }
  }

  // Overall trend
  const overallTrend = useMemo(() => {
    const regression = calculateLinearRegression(chartData)
    if (!regression) return null

    const { slope, rSquared, standardError, n } = regression
    const totalDays = daysDifference || 1
    const yearsSpan = totalDays / 365.25
    const changePerYear = slope * (chartData.length / yearsSpan)
    const totalChange = changePerYear * yearsSpan

    // Calculate values at start and end
    const startValue = chartData[0]?.value || 0
    const endValue = chartData[chartData.length - 1]?.value || 0
    const actualChange = endValue - startValue
    const percentChange = startValue !== 0 ? (actualChange / startValue) * 100 : 0

    // Check significance: either absolute slope > 0.001 OR changePerYear is meaningful (> 0.01)
    const isSignificant = Math.abs(slope) > 0.001 || Math.abs(changePerYear) > 0.01

    return {
      direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
      changePerYear: Math.abs(changePerYear),
      totalChange: Math.abs(totalChange),
      percentChange: Math.abs(percentChange),
      rSquared,
      standardError,
      dataPoints: n,
      isSignificant,
      startValue,
      endValue,
    }
  }, [chartData, daysDifference])

  // Note: Per-year trend calculation removed as it was unused
  // Can be re-added if additional trend analysis features are needed

  const handleExportPNG = async () => {
    if (!chartRef.current || isExporting) return

    setIsExporting(true)
    toast.info('Exporting chart...')

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: isDark ? '#242429' : '#ffffff',
        scale: 2,
      })

      const link = document.createElement('a')
      link.download = `${stationName}_${selectedMetric}_chart.png`
      link.href = canvas.toDataURL()
      link.click()
      toast.success('Chart exported successfully')
    } catch (exportError) {
      const message = exportError?.message || 'Failed to export chart'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  if (!selectedStationId) {
    return <EmptyState title="No station selected" message="Click on a station marker to view its data" />
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

  if (chartData.length === 0) {
    return <EmptyState title="No data available" message="Try adjusting your filters" />
  }

  return (
    <div className="h-full w-full p-2 sm:p-4 flex flex-col">
      <div className="flex flex-col gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 truncate">{stationName}</h3>
            {/* Trend Analysis - Inline with title */}
            {overallTrend && (
              overallTrend.isSignificant ? (
                <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs mt-1 ${overallTrend.direction === 'up' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'}`}>
                  {overallTrend.direction === 'up' ? (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className={`font-semibold ${overallTrend.direction === 'up' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {overallTrend.changePerYear.toFixed(3)} {config.unit}/yr
                    </span>
                    <span className="hidden sm:inline text-gray-600 dark:text-gray-400 ml-1">
                      ({overallTrend.totalChange.toFixed(2)} {config.unit} over {(daysDifference / 365.25).toFixed(1)} yrs)
                    </span>
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs mt-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">
                    No significant trend detected
                  </span>
                </div>
              )
            )}
          </div>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <label className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="aggregation-select">
              Period
            </label>
            <select
              id="aggregation-select"
              value={aggregation}
              onChange={(event) => setAggregation(event.target.value)}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
            >
              {availableAggregations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {aggregationCount && (
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                ({aggregationCount.count} {aggregationCount.unit}
                {aggregationCount.count !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          {startDate && endDate && (
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {formatDate(startDate)} – {formatDate(endDate)}
            </span>
          )}
        </div>
      </div>
      <div ref={chartRef} className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke={isDark ? '#6B7280' : '#D1D5DB'}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              label={{ value: config.label, angle: -90, position: 'insideLeft', fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              stroke={isDark ? '#6B7280' : '#D1D5DB'}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                borderRadius: '8px',
                color: isDark ? '#F3F4F6' : '#1F2937',
              }}
            />
            <Legend wrapperStyle={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
              name={config.label}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
