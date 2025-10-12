import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useFilters } from '../../context/FilterContext'
import { useTheme } from '../../context/ThemeContext'
import ErrorBoundary from '../common/ErrorBoundary'
import ExportModal from '../common/ExportModal'
import GuideModal from '../common/GuideModal'
import SkeletonLoader from '../common/SkeletonLoader'
import { toast } from '../../utils/toast'
import apiClient from '../../api/client'

const StationMap = lazy(() => import('../Map/StationMap'))
const TimeSeriesChart = lazy(() => import('../Charts/TimeSeriesChart'))
const DistributionCharts = lazy(() => import('../Charts/DistributionCharts'))
const StatisticsPanel = lazy(() => import('../Statistics/StatisticsPanel'))
const InsightsPanel = lazy(() => import('../Insights/InsightsPanel'))

const guidePdfUrl = import.meta.env.VITE_GUIDE_PDF_URL || '/guide.pdf'

export function DashboardContent({ isSidebarCollapsed, onOpenWelcome }) {
  const { filters } = useFilters()
  const { isDark, toggleTheme } = useTheme()
  const [chartView, setChartView] = useState('timeseries')
  const [isResizing, setIsResizing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState('')
  const [isGuideOpen, setIsGuideOpen] = useState(false)

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

  const handleGuideOpen = () => {
    setIsGuideOpen(true)
  }

  const handleGuideClose = () => {
    setIsGuideOpen(false)
  }

  const pageTitle = useMemo(() => 'Meteorological Data Dashboard', [])
  const dateRange = useMemo(() => '2019 - Aug 2025', [])

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 pb-0 overflow-auto bg-background dark:bg-custom-bg">
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className={`transition-all duration-300 text-center sm:text-left ${isSidebarCollapsed ? 'sm:ml-12 md:ml-16' : 'ml-0'}`}>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
            Interactive visualization of Australian Bureau of Meteorology weather data
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs">
            {/* Station count badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 rounded-full animate-fade-in">
              <svg
                className="w-3 h-3 text-primary animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05A7 7 0 0119.91 10a7 7 0 01-14.86-5.95zM10 11a1 1 0 110-2 1 1 0 010 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-primary">
                377 stations
              </span>
            </span>

            {/* Date range badge */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 rounded-full animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <svg
                className="w-3 h-3 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-.1V3a1 1 0 00-2 0v1H7V3a1 1 0 00-1-1zm1 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-primary">
                {dateRange}
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={toggleTheme}
            className="px-3 py-2 bg-discord-light dark:bg-discord-darker text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-discord-dark transition font-medium text-xs sm:text-sm"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            <span className="hidden sm:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            <span className="sm:hidden">{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-xs sm:text-sm"
            type="button"
          >
            Export
          </button>
          <button
            onClick={handleGuideOpen}
            className="px-3 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:opacity-90 transition font-medium text-xs sm:text-sm"
            type="button"
          >
            Guide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-3 md:mb-4 lg:min-h-[600px] auto-rows-auto">
        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-custom-card rounded-lg shadow-lg p-3 md:p-4 hover:shadow-2xl transition-all duration-300 h-[400px] md:h-[500px] lg:h-full border border-gray-300 dark:border-gray-600 relative animate-fade-in">
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

        <div className="lg:col-span-1 min-w-0 bg-white dark:bg-custom-card rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 h-[400px] md:h-[500px] lg:h-full flex flex-col border border-gray-300 dark:border-gray-600 relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm rounded transition ${
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
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm rounded transition ${
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

      <div className="flex flex-col gap-3 md:gap-4 mt-0 pb-3 md:pb-4">
        <div className="h-auto lg:h-[280px] overflow-y-auto bg-white dark:bg-custom-card rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 p-3 md:p-4 lg:p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
      <GuideModal
        isOpen={isGuideOpen}
        onClose={handleGuideClose}
        pdfUrl={guidePdfUrl}
        downloadFileName='interactive-spatial-data-visualisation-guide.pdf'
        onOpenTutorial={onOpenWelcome}
      />
    </div>
  )
}

export default DashboardContent

