import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useFilters } from '../../context/FilterContext'
import { useTheme } from '../../context/ThemeContext'
import ErrorBoundary from '../common/ErrorBoundary'
import ExportModal from '../common/ExportModal'
import SkeletonLoader from '../common/SkeletonLoader'
import { toast } from '../../utils/toast'
import apiClient from '../../api/client'

const StationMap = lazy(() => import('../Map/StationMap'))
const TimeSeriesChart = lazy(() => import('../Charts/TimeSeriesChart'))
const DistributionCharts = lazy(() => import('../Charts/DistributionCharts'))
const StatisticsPanel = lazy(() => import('../Statistics/StatisticsPanel'))
const InsightsPanel = lazy(() => import('../Insights/InsightsPanel'))

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const docsUrl = apiBase ? `${apiBase}/docs` : '/docs'

export function DashboardContent({ isSidebarCollapsed }) {
  const { filters } = useFilters()
  const { isDark, toggleTheme } = useTheme()
  const [chartView, setChartView] = useState('timeseries')
  const [isResizing, setIsResizing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState('')

  useEffect(() => {
    setIsResizing(true)
    const timer = setTimeout(() => {
      setIsResizing(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [isSidebarCollapsed])

  const handleExportCSV = () => {
    setIsExporting(true)
    setExportType('csv')
  }

  const handleExportConfirm = async (selectedMetrics) => {
    const params = new URLSearchParams()
    if (filters.state) params.append('state', filters.state)
    if (filters.startDate) params.append('start_date', filters.startDate)
    if (filters.endDate) params.append('end_date', filters.endDate)
    if (filters.selectedStation) params.append('station_ids', filters.selectedStation)
    if (selectedMetrics.length > 0) params.append('metrics', selectedMetrics.join(','))

    try {
      const response = await apiClient.get('weather/export', {
        params,
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'weather_data.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (error) {
      const message = error?.message || 'Failed to export data'
      toast.error(message)
    } finally {
      setIsExporting(false)
      setExportType('')
    }
  }

  const handleExportCancel = () => {
    setIsExporting(false)
    setExportType('')
  }

  const pageTitle = useMemo(() => 'Meteorological Data Dashboard', [])

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 pb-0 overflow-auto bg-background dark:bg-custom-bg">
      <div className="mb-2 flex justify-between items-center">
        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-12 md:ml-16' : 'ml-0'}`}>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Interactive visualization of Australian Bureau of Meteorology weather data
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-discord-light dark:bg-discord-darker text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-discord-dark transition font-medium text-sm"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
            type="button"
          >
            Export CSV
          </button>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
          >
            API Docs
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-4 min-h-[600px] auto-rows-auto">
        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-custom-card rounded-lg shadow-lg p-4 hover:shadow-2xl transition-all duration-300 h-full border border-gray-300 dark:border-gray-600 relative animate-fade-in">
          {isResizing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-custom-card/80 backdrop-blur-sm z-50 flex items-start justify-center pt-2 rounded-lg">
              <div className="w-full max-w-xs h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
          <ErrorBoundary>
            <Suspense fallback={<SkeletonLoader type="chart" />}>
              <StationMap />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="lg:col-span-1 min-w-0 bg-white dark:bg-custom-card rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-gray-300 dark:border-gray-600 relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {isResizing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-custom-card/80 backdrop-blur-sm z-50 flex items-start justify-center pt-2 rounded-lg">
              <div className="w-full max-w-xs h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
          <div className="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Chart views">
            <button
              onClick={() => setChartView('timeseries')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded transition ${
                chartView === 'timeseries'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              type="button"
              role="tab"
              aria-selected={chartView === 'timeseries'}
            >
              Time Series
            </button>
            <button
              onClick={() => setChartView('distribution')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded transition ${
                chartView === 'distribution'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              type="button"
              role="tab"
              aria-selected={chartView === 'distribution'}
            >
              Distribution
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ErrorBoundary>
              <Suspense fallback={<SkeletonLoader type="chart" />}>
                {chartView === 'timeseries' ? <TimeSeriesChart /> : <DistributionCharts />}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-0">
        <div className="h-[280px] overflow-y-auto bg-white dark:bg-custom-card rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <ErrorBoundary>
            <Suspense fallback={<SkeletonLoader type="stats" />}>
              <StatisticsPanel />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <ErrorBoundary>
            <Suspense fallback={<SkeletonLoader type="stats" />}>
              <InsightsPanel />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      <ExportModal
        isOpen={isExporting}
        exportType={exportType}
        onCancel={handleExportCancel}
        onConfirm={handleExportConfirm}
        startDate={filters.startDate}
        endDate={filters.endDate}
        currentMetric={filters.selectedMetric}
      />
    </div>
  )
}

export default DashboardContent


