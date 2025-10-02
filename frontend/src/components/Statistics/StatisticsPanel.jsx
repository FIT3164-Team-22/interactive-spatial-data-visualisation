import { useQuery } from '@tanstack/react-query';
import { useFilters } from '../../context/FilterContext';

const fetchStatistics = async (filters) => {
  const params = new URLSearchParams();

  if (filters.state) params.append('state', filters.state);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.selectedStation) params.append('station_ids', filters.selectedStation);

  const response = await fetch(`/api/statistics?${params}`);
  if (!response.ok) throw new Error('Failed to fetch statistics');
  return response.json();
};

export default function StatisticsPanel() {
  const { filters } = useFilters();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['statistics', filters],
    queryFn: () => fetchStatistics(filters),
    enabled: !!(filters.state || filters.selectedStation)
  });

  if (!filters.state && !filters.selectedStation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📍</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No station or state selected
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Click on a station marker or choose a state from the dropdown menu to view its stats
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Statistical Analysis</h2>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || stats?.error) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Statistical Analysis</h2>
        <p className="text-red-500 dark:text-red-400">{error?.message || stats?.error || 'Failed to load statistics'}</p>
      </div>
    );
  }

  const getDominantFactorExplanation = () => {
    const factor = stats.dominant_factor;
    const explanations = {
      'Maximum Temperature': 'Temperature shows the highest variability, indicating significant daily fluctuations in heat conditions across the selected period.',
      'Minimum Temperature': 'Minimum temperature varies most, suggesting substantial differences in nighttime cooling patterns.',
      'Rainfall': 'Rainfall displays the greatest variation, reflecting irregular precipitation patterns and potential drought or flood periods.',
      'Maximum Humidity': 'Humidity levels fluctuate most significantly, indicating changing moisture conditions in the atmosphere.',
      'Wind Speed': 'Wind speed shows the highest variance, suggesting variable atmospheric circulation patterns.',
      'Evapotranspiration': 'Evapotranspiration varies most, indicating changing water loss rates from vegetation and soil.'
    };
    return explanations[factor] || 'This metric shows the most variation in the dataset.';
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Statistical Analysis</h2>

      <div className="mb-6 bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border-l-4 border-primary">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample Size:</span>
          <span className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{stats.sample_size?.toLocaleString()} records</span>
        </div>
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dominant Weather Factor:</span>
          <div className="text-lg font-bold text-primary mt-1">{stats.dominant_factor}</div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2">
          {getDominantFactorExplanation()}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3 dark:text-gray-200">Metric Statistics</h3>
        <div className="space-y-3">
          {stats.statistics && Object.entries(stats.statistics).map(([metric, values]) => (
            <div key={metric} className="border-l-4 border-primary pl-3 py-1">
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize mb-1">
                {metric.replace(/_/g, ' ')}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div>Mean: <span className="font-semibold">{values.mean}</span></div>
                <div>Median: <span className="font-semibold">{values.median}</span></div>
                <div>Min: <span className="font-semibold">{values.min}</span></div>
                <div>Max: <span className="font-semibold">{values.max}</span></div>
                <div className="col-span-2">Std Dev: <span className="font-semibold">{values.std}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats.correlations && stats.correlations.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2 dark:text-gray-200">Weather Metric Correlations</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Correlation measures the linear relationship between two variables. Values range from -1 (perfect negative) to +1 (perfect positive).
          </p>
          <div className="space-y-2">
            {stats.correlations.map((corr, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{corr.pair}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    corr.strength === 'Strong' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                    corr.strength === 'Moderate' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' :
                    corr.strength === 'Weak' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' :
                    'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                  }`}>
                    {corr.strength}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Correlation: <strong>{corr.correlation}</strong></span>
                  <span>p-value: <strong>{corr.p_value}</strong></span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                  {corr.correlation > 0.7 ? '↗️ Strong positive relationship' :
                   corr.correlation > 0.4 ? '↗️ Moderate positive relationship' :
                   corr.correlation > 0 ? '↗️ Weak positive relationship' :
                   corr.correlation > -0.4 ? '↘️ Weak negative relationship' :
                   corr.correlation > -0.7 ? '↘️ Moderate negative relationship' :
                   '↘️ Strong negative relationship'}
                  {corr.p_value < 0.05 ? ' (statistically significant)' : ' (not significant)'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
