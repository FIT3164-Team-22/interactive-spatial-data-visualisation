import { useRef, useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFilters } from '../../context/FilterContext';
import { useAggregatedData } from '../../hooks/useWeatherData';
import { useTheme } from '../../context/ThemeContext';
import { format, parseISO } from 'date-fns';
import { metricConfig } from '../../constants/metrics';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import { toast } from '../../utils/toast';

export default function TimeSeriesChart() {
  const { selectedStationId, startDate, endDate, selectedMetric } = useFilters();
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [aggregation, setAggregation] = useState('daily');

  // Calculate date range in days
  const daysDifference = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  // Determine available aggregation options based on date range
  const availableAggregations = useMemo(() => {
    const options = [];
    options.push({ value: 'daily', label: 'Daily' });

    if (daysDifference >= 7) {
      options.push({ value: 'weekly', label: 'Weekly' });
    }

    if (daysDifference >= 30) {
      options.push({ value: 'monthly', label: 'Monthly' });
    }

    return options;
  }, [daysDifference]);

  // Reset aggregation if it's no longer available
  useEffect(() => {
    const isAvailable = availableAggregations.some(opt => opt.value === aggregation);
    if (!isAvailable && availableAggregations.length > 0) {
      setAggregation(availableAggregations[0].value);
    }
  }, [availableAggregations, aggregation]);

  const { data: weatherData, isLoading, error } = useAggregatedData(
    selectedStationId ? [selectedStationId] : null,
    startDate,
    endDate,
    selectedMetric,
    aggregation
  );

  // Calculate these values early, before any conditional returns
  const config = metricConfig[selectedMetric] || metricConfig.temperature;
  const stationName = weatherData?.[0]?.station_name || 'Station';

  const chartData = useMemo(() => {
    if (!weatherData) return [];

    return weatherData.map(d => {
      let formattedDate;

      // Format date based on aggregation type
      if (aggregation === 'weekly') {
        // Format weekly data (e.g., "2024-W05" -> "Week 5, 2024")
        const [year, week] = d.period.split('-W');
        formattedDate = `Week ${week}, ${year}`;
      } else if (aggregation === 'monthly') {
        // Format monthly data (e.g., "2024-01" -> "Jan 2024")
        const [year, month] = d.period.split('-');
        const date = new Date(year, month - 1);
        formattedDate = format(date, 'MMM yyyy');
      } else {
        // Daily format
        formattedDate = format(parseISO(d.period), 'MMM dd, yyyy');
      }

      return {
        date: formattedDate,
        value: d.avg_value,
        station: d.station_name,
      };
    });
  }, [weatherData, aggregation]);

  const handleExportPNG = async () => {
    if (!chartRef.current || isExporting) return;

    setIsExporting(true);
    toast.info('Exporting chart...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: isDark ? '#242429' : '#ffffff',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `${stationName}_${selectedMetric}_chart.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Chart exported successfully!');
    } catch (error) {
      console.error('Failed to export chart:', error);
      toast.error('Failed to export chart. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedStationId) {
    return <EmptyState title="No Station Selected" message="Click on a station marker to view its data" icon="📍" />;
  }

  if (isLoading) {
    return <SkeletonLoader type="chart" />;
  }

  if (error) {
    return <EmptyState title="Error loading data" message={error.message} icon="⚠️" />;
  }

  if (chartData.length === 0) {
    return <EmptyState title="No data available" message="Try adjusting your filters" icon="📊" />;
  }

  return (
    <div className="h-full w-full p-4">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{stationName}</h3>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </button>
        </div>

        {/* Aggregation selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Period:
          </label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
          >
            {availableAggregations.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({daysDifference} days selected)
          </span>
        </div>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#E5E7EB'} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke={isDark ? '#6B7280' : '#D1D5DB'}
          />
          <YAxis
            tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            label={{ value: config.label, angle: -90, position: 'insideLeft', fill: isDark ? '#9CA3AF' : '#6B7280' }}
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
          <Legend wrapperStyle={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            name={config.label}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
