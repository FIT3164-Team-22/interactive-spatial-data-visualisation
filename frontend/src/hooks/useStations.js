import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export const useStations = (state = '') => {
  return useQuery({
    queryKey: ['stations', state],
    queryFn: async () => {
      const params = state ? { state } : {};
      const response = await apiClient.get('/api/stations', { params });
      return response.data;
    },
    staleTime: 60000 * 10,
  });
};

export const useStates = () => {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const response = await apiClient.get('/api/states');
      return response.data;
    },
    staleTime: Infinity,
  });
};

export const useHeatmapData = (metric = 'temperature') => {
  return useQuery({
    queryKey: ['heatmap', metric],
    queryFn: async () => {
      const response = await apiClient.get('/api/weather/heatmap', {
        params: { metric },
      });
      return response.data;
    },
    staleTime: 60000 * 5,
  });
};
