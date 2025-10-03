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
      }
    })
  }, [weatherData, aggregation])

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
    <div className="h-full w-full p-4 flex flex-col">
      <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{stationName}</h3>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="aggregation-select">
            Time period
          </label>
          <select
            id="aggregation-select"
            value={aggregation}
            onChange={(event) => setAggregation(event.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
          >
            {availableAggregations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500 dark:text-gray-400">({daysDifference} days selected)</span>
        </div>
      </div>
      <div ref={chartRef} className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke={isDark ? '#6B7280' : '#D1D5DB'}
            />
            <YAxis
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              label={{ value: config.label, angle: -90, position: 'insideLeft', fill: isDark ? '#9CA3AF' : '#6B7280' }}
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
