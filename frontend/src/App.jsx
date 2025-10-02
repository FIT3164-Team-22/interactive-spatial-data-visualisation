import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterProvider, useFilters } from './context/FilterContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import FilterSidebar from './components/Filters/FilterSidebar';
import StationMap from './components/Map/StationMap';
import TimeSeriesChart from './components/Charts/TimeSeriesChart';
import DistributionCharts from './components/Charts/DistributionCharts';
import StatisticsPanel from './components/Statistics/StatisticsPanel';
import ErrorBoundary from './components/common/ErrorBoundary';
import { toast } from './utils/toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error) => {
        toast.error(`Failed to fetch data: ${error.message}`);
      },
    },
  },
});

function DashboardContent({ isSidebarCollapsed }) {
  const { filters } = useFilters();
  const { isDark, toggleTheme } = useTheme();
  const [chartView, setChartView] = useState('timeseries');
  const [isResizing, setIsResizing] = useState(false);

  // Handle sidebar collapse animation
  useEffect(() => {
    setIsResizing(true);
    const timer = setTimeout(() => {
      setIsResizing(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  const handleExportCSV = async () => {
    const params = new URLSearchParams();
    if (filters.state) params.append('state', filters.state);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.selectedStation) params.append('station_ids', filters.selectedStation);
    if (filters.selectedMetric) params.append('metrics', filters.selectedMetric);

    try {
      toast.info('Exporting data...');
      const response = await fetch(`/api/weather/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'weather_data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-auto bg-background dark:bg-custom-bg">
      <div className="mb-4 flex justify-between items-center">
        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-12 md:ml-16' : 'ml-0'}`}>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Meteorological Data Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Interactive visualization of Australian Bureau of Meteorology weather data
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-discord-light dark:bg-discord-darker text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-discord-dark transition font-medium text-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
          >
            Export CSV
          </button>
          <a
            href="/user-manual.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
          >
            User Manual
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-custom-card rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow h-full border border-gray-300 dark:border-gray-600 relative">
          {isResizing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-custom-card/80 backdrop-blur-sm z-50 flex items-start justify-center pt-2 rounded-lg">
              <div className="w-full max-w-xs h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
          <ErrorBoundary>
            <StationMap />
          </ErrorBoundary>
        </div>

        <div className="lg:col-span-1 min-w-0 bg-white dark:bg-custom-card rounded-lg shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col border border-gray-300 dark:border-gray-600 relative">
          {isResizing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-custom-card/80 backdrop-blur-sm z-50 flex items-start justify-center pt-2 rounded-lg">
              <div className="w-full max-w-xs h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
          <div className="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setChartView('timeseries')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded transition ${
                chartView === 'timeseries'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Time Series
            </button>
            <button
              onClick={() => setChartView('distribution')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded transition ${
                chartView === 'distribution'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Distribution
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              {chartView === 'timeseries' ? <TimeSeriesChart /> : <DistributionCharts />}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6 mb-6">
        <div className="lg:col-span-2 max-h-96 overflow-y-auto">
          <ErrorBoundary>
            <StatisticsPanel />
          </ErrorBoundary>
        </div>

        <div className="bg-white dark:bg-custom-card rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow border border-gray-300 dark:border-gray-600">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">About</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            FIT3164 Team 22 - Interactive Spatial Data Visualization
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>377 weather stations</p>
            <p>2019-2025 data range</p>
            <p>5 meteorological metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FilterProvider>
            <div className="flex h-screen bg-background dark:bg-discord-darkest overflow-hidden">
              <FilterSidebar onCollapseChange={setIsSidebarCollapsed} />
              <DashboardContent isSidebarCollapsed={isSidebarCollapsed} />
            </div>
          </FilterProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div style={{padding: '20px', color: 'red'}}>Error: {error.message}</div>;
  }
}

export default App;