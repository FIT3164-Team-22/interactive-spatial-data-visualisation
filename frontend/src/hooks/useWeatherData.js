import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export const useWeatherData = (stationIds, startDate, endDate, metrics) => {
  return useQuery({
    queryKey: ['weather', stationIds, startDate, endDate, metrics],
    queryFn: async () => {
      const params = {};
      if (stationIds?.length) params.station_ids = stationIds.join(',');
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (metrics?.length) params.metrics = metrics.join(',');

      const response = await apiClient.get('/api/weather', { params });
      return response.data;
    },
    enabled: !!stationIds?.length,
    staleTime: 60000 * 5,
  });
};

export const useAggregatedData = (stationIds, startDate, endDate, metric, aggregation = 'monthly') => {
  return useQuery({
    queryKey: ['aggregate', stationIds, startDate, endDate, metric, aggregation],
    queryFn: async () => {
      const params = { metric, aggregation };
      if (stationIds?.length) params.station_ids = stationIds.join(',');
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get('/api/weather/aggregate', { params });
      return response.data;
    },
    enabled: !!stationIds?.length,
    staleTime: 60000 * 5,
  });
};
