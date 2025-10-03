import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export const useWeatherSummary = ({ stationIds, state, startDate, endDate, metrics }) => {
  return useQuery({
    queryKey: ['summary', stationIds, state, startDate, endDate, metrics],
    queryFn: async () => {
      const params = {}
      if (stationIds?.length) params.station_ids = stationIds.join(',')
      if (state) params.state = state
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (metrics?.length) params.metrics = metrics.join(',')

      const response = await apiClient.get('weather/summary', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
