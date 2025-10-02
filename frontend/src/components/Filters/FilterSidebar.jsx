import { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { useStates } from '../../hooks/useStations';
import Tooltip from '../common/Tooltip';

export default function FilterSidebar({ onCollapseChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Trigger window resize event when sidebar collapses to update map
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350); // Slightly after transition completes to avoid choppy animation

    return () => clearTimeout(timer);
  }, [isCollapsed]);

  // Notify parent component of collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const {
    selectedState,
    setSelectedState,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedMetric,
    setSelectedMetric,
    mapStyle,
    setMapStyle,
    clusteringEnabled,
    setClusteringEnabled,
    showStations,
    setShowStations,
  } = useFilters();

  const { data: states } = useStates();

  const metrics = [
    { id: 'temperature', label: 'Temperature', tooltip: 'Daily maximum temperature in °C' },
    { id: 'rainfall', label: 'Rainfall', tooltip: 'Daily rainfall accumulation in mm' },
    { id: 'humidity', label: 'Humidity', tooltip: 'Daily maximum relative humidity in %' },
    { id: 'wind', label: 'Wind Speed', tooltip: 'Average 10m wind speed in m/s' },
    { id: 'evapotranspiration', label: 'Evapotranspiration', tooltip: 'Daily evapotranspiration in mm' },
  ];

  return (
    <>
      {/* Hamburger button - always visible when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-7 md:top-9 left-4 md:left-6 z-50 px-2 py-3 bg-discord-light dark:bg-discord-darker text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-discord-dark transition font-medium text-sm aspect-square flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className="block h-0.5 bg-gray-800 dark:bg-gray-200 rounded"></span>
            <span className="block h-0.5 bg-gray-800 dark:bg-gray-200 rounded"></span>
            <span className="block h-0.5 bg-gray-800 dark:bg-gray-200 rounded"></span>
          </div>
        </button>
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative h-screen bg-white dark:bg-custom-sidebar shadow-2xl overflow-y-auto border-r border-gray-300 dark:border-gray-600 z-40 ${
        isCollapsed ? '-translate-x-full lg:w-0 lg:p-0 lg:border-0' : 'translate-x-0 w-full lg:w-80 xl:w-96'
      }`} style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, width'
      }}>
        {/* Header with hamburger and title */}
        <div className="px-4 md:px-6 pt-7 md:pt-9 pb-4 md:pb-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <div className="w-4 h-4 relative">
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200 rounded rotate-45"></span>
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200 rounded -rotate-45"></span>
            </div>
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex-1 text-center">
            BOM Data Explorer
          </h2>
          <div className="w-8"></div>
        </div>

        <div className="p-6">

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
              Time Period
            </h3>
            <Tooltip content="Filter data by date range (2019-2025)" position="right">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ℹ️</span>
            </Tooltip>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min="2019-01-01"
                max="2025-08-31"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min="2019-01-01"
                max="2025-08-31"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
              Meteorological Variable
            </h3>
            <Tooltip content="Select weather metric to visualize" position="right">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ℹ️</span>
            </Tooltip>
          </div>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-700 dark:text-gray-200 font-medium"
            title={metrics.find(m => m.id === selectedMetric)?.tooltip}
          >
            {metrics.map((metric) => (
              <option key={metric.id} value={metric.id} title={metric.tooltip}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
              Geographic Region
            </h3>
            <Tooltip content="Filter by Australian state/territory" position="right">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ℹ️</span>
            </Tooltip>
          </div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
          >
            <option value="">All Australia</option>
            {states?.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
              Map Settings
            </h3>
            <Tooltip content="Customize map appearance and behavior" position="right">
              <span className="text-gray-400 dark:text-gray-500 cursor-help">ℹ️</span>
            </Tooltip>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Map Style
              </label>
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
              >
                <option value="standard">Standard (OpenStreetMap)</option>
                <option value="satellite">Satellite (Esri WorldImagery)</option>
                <option value="terrain">Terrain (OpenTopoMap)</option>
                <option value="dark">Dark (CartoDB Dark Matter)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <label htmlFor="stations-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Show Stations
                </label>
                <Tooltip content="Display station markers on the map" position="right">
                  <span className="text-gray-400 dark:text-gray-500 cursor-help">ℹ️</span>
                </Tooltip>
              </div>
              <button
                id="stations-toggle"
                onClick={() => setShowStations(!showStations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  showStations ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={showStations}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showStations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-opacity ${
              !showStations ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2">
                <label htmlFor="clustering-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Cluster Stations
                </label>
                <Tooltip content="Group nearby stations into clusters for better performance" position="right">
                  <span className="text-gray-400 dark:text-gray-500 cursor-help">ℹ️</span>
                </Tooltip>
              </div>
              <button
                id="clustering-toggle"
                onClick={() => setClusteringEnabled(!clusteringEnabled)}
                disabled={!showStations}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  clusteringEnabled && showStations ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={clusteringEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    clusteringEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
