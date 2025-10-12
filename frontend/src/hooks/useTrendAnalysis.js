import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export const useTrendAnalysis = (stationIds, metric, startDate, endDate, options = {}) => {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['trend', stationIds, metric, startDate, endDate],
    queryFn: async () => {
      const params = { metric }
      if (stationIds?.length) params.station_ids = stationIds.join(',')
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await apiClient.get('weather/trend', { params })
      return response.data
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  })
}
