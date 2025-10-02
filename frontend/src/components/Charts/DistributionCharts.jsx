import { useRef, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFilters } from '../../context/FilterContext';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useTheme } from '../../context/ThemeContext';
import { metricConfig } from '../../constants/metrics';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import { toast } from '../../utils/toast';

export default function DistributionCharts() {
  const { selectedStationId, startDate, endDate, selectedMetric } = useFilters();
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: weatherData, isLoading, error } = useWeatherData(
    selectedStationId ? [selectedStationId] : null,
    startDate,
    endDate,
    [selectedMetric]
  );

  const handleExportPNG = async () => {
    if (!chartRef.current || isExporting) return;

    setIsExporting(true);
    toast.info('Exporting distribution chart...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: isDark ? '#242429' : '#ffffff',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `${stationName}_${selectedMetric}_distribution.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Distribution chart exported successfully!');
    } catch (error) {
      console.error('Failed to export chart:', error);
      toast.error('Failed to export chart. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedStationId) {
    return <EmptyState title="No Station Selected" message="Click on a station marker to view distribution" icon="📍" />;
  }

  if (isLoading) {
    return <SkeletonLoader type="chart" />;
  }

  if (error) {
    return <EmptyState title="Error loading data" message={error.message} icon="⚠️" />;
  }

  const config = metricConfig[selectedMetric] || metricConfig.temperature;
  const values = useMemo(() =>
    weatherData
      ?.filter(d => d[config.key] !== null)
      .map(d => d[config.key]) || []
  , [weatherData, config.key]);

  if (values.length === 0) {
    return <EmptyState title="No data available" message="Try adjusting your filters" icon="📊" />;
  }

  const stationName = weatherData?.[0]?.station_name || 'Station';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
  const binSize = (max - min) / binCount;

  const histogram = Array.from({ length: binCount }, (_, i) => {
    const binStart = min + i * binSize;
    const binEnd = binStart + binSize;
    const count = values.filter(v => v >= binStart && v < binEnd).length;
    return {
      range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count,
      binStart
    };
  });

  const sortedValues = [...values].sort((a, b) => a - b);
  const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
  const median = sortedValues[Math.floor(sortedValues.length * 0.5)];
  const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
  const iqr = q3 - q1;
  const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
  const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
  const outliers = values.filter(v => v < lowerWhisker || v > upperWhisker);

  const boxPlotData = [
    { name: 'Min', value: min },
    { name: 'Q1', value: q1 },
    { name: 'Median', value: median },
    { name: 'Q3', value: q3 },
    { name: 'Max', value: max },
  ];

  return (
    <div className="h-full w-full p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{stationName} - Distribution</h3>
        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>

      <div ref={chartRef} className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Histogram</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke={isDark ? '#6B7280' : '#D1D5DB'}
              />
              <YAxis
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: isDark ? '#9CA3AF' : '#6B7280' }}
                stroke={isDark ? '#6B7280' : '#D1D5DB'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#1F2937',
                }}
              />
              <Bar dataKey="count" fill={config.color} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-2">Box Plot Statistics</h4>
          <div className="grid grid-cols-5 gap-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            {boxPlotData.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{stat.name}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stat.value.toFixed(2)}</div>
              </div>
            ))}
          </div>
          {outliers.length > 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium text-orange-600 dark:text-orange-400">⚠️ {outliers.length} outlier{outliers.length > 1 ? 's' : ''} detected</span>
              <span className="ml-2">
                (values beyond 1.5 × IQR from quartiles)
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 bg-primary/10 dark:bg-primary/20 p-3 rounded">
          <strong>Interpretation:</strong> The histogram shows the frequency distribution of {config.label.toLowerCase()} values.
          The box plot statistics reveal the data spread: 50% of values fall between Q1 ({q1.toFixed(2)}) and Q3 ({q3.toFixed(2)}),
          with a median of {median.toFixed(2)}.
        </div>
      </div>
    </div>
  );
}
