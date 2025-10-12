import { useTrendAnalysis } from '../../hooks/useTrendAnalysis'
import { useFilters } from '../../context/FilterContext'

export default function TrendAnalysis() {
  const { filters } = useFilters()
  const stationIds = filters.selectedStation ? [filters.selectedStation] : null

  const { data: trendData, isLoading, error } = useTrendAnalysis(
    stationIds,
    filters.selectedMetric,
    filters.startDate,
    filters.endDate,
    { enabled: !!stationIds }
  )

  if (!stationIds) {
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-[#5865F2]/5 dark:bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing trend...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return null
  }

  if (!trendData || trendData.error) {
    return (
      <div className="bg-[#5865F2]/5 dark:bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {trendData?.error || 'Unable to calculate trend'}
        </p>
      </div>
    )
  }

  const getTrendIcon = () => {
    if (trendData.trend === 'increasing') {
      return (
        <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )
  }

  const getTrendColor = () => {
    return 'text-[#5865F2]'
  }

  const getBgColor = () => {
    return 'bg-[#5865F2]/5 dark:bg-[#5865F2]/10 border-[#5865F2]/20'
  }

  return (
    <div className={`border rounded-lg p-4 ${getBgColor()} animate-fade-in`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          {getTrendIcon()}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#5865F2] mb-0.5">
            Trend Analysis
          </h4>
          <p className={`text-xs ${getTrendColor()}`}>
            {trendData.interpretation}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Direction</div>
          <div className="text-sm font-bold text-[#5865F2] capitalize">{trendData.trend}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">R² Fit</div>
          <div className="text-sm font-bold text-[#5865F2]">{trendData.r_squared}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">P-value</div>
          <div className="text-sm font-bold text-[#5865F2]">{trendData.p_value}</div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 pt-2 border-t border-[#5865F2]/20">
        <span>Slope: <span className="font-semibold text-gray-700 dark:text-gray-300">{trendData.slope}</span></span>
        <span>Error: <span className="font-semibold text-gray-700 dark:text-gray-300">{trendData.standard_error}</span></span>
        <span>Points: <span className="font-semibold text-gray-700 dark:text-gray-300">{trendData.data_points}</span></span>
      </div>
    </div>
  )
}
