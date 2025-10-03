import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { DEFAULT_PAGE_SIZE } from '../config'

export const useWeatherData = (stationIds, startDate, endDate, metrics, pageSize = DEFAULT_PAGE_SIZE) => {
  return useQuery({
    queryKey: ['weather', stationIds, startDate, endDate, metrics, pageSize],
    queryFn: async () => {
      const params = { page_size: pageSize }
      if (stationIds?.length) params.station_ids = stationIds.join(',')
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (metrics?.length) params.metrics = metrics.join(',')

      const response = await apiClient.get('weather', { params })
      return response.data.items
    },
    enabled: !!stationIds?.length,
    staleTime: 5 * 60 * 1000,
  })
}

export const useAggregatedData = (stationIds, startDate, endDate, metric, aggregation = 'monthly') => {
  return useQuery({
    queryKey: ['aggregate', stationIds, startDate, endDate, metric, aggregation],
    queryFn: async () => {
      const params = { metric, aggregation }
      if (stationIds?.length) params.station_ids = stationIds.join(',')
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await apiClient.get('weather/aggregate', { params })
      return response.data.items
    },
    enabled: !!stationIds?.length,
    staleTime: 5 * 60 * 1000,
  })
}
