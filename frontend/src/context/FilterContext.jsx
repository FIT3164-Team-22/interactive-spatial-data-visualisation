import { createContext, useContext, useState, useMemo } from 'react';

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
};

export const FilterProvider = ({ children }) => {
  const [selectedState, setSelectedState] = useState('');
  const [startDate, setStartDate] = useState('2019-01-01');
  const [endDate, setEndDate] = useState('2025-08-31');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [selectedStationId, setSelectedStationId] = useState(null);

  // Map settings
  const [mapStyle, setMapStyle] = useState('standard');
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [showStations, setShowStations] = useState(true);

  // Chart settings
  const [aggregation, setAggregation] = useState('daily');

  const filters = useMemo(() => ({
    state: selectedState,
    startDate,
    endDate,
    selectedMetric,
    selectedStation: selectedStationId
  }), [selectedState, startDate, endDate, selectedMetric, selectedStationId]);

  const value = useMemo(() => ({
    selectedState,
    setSelectedState,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedMetric,
    setSelectedMetric,
    selectedStationId,
    setSelectedStationId,
    mapStyle,
    setMapStyle,
    clusteringEnabled,
    setClusteringEnabled,
    showStations,
    setShowStations,
    aggregation,
    setAggregation,
    filters
  }), [selectedState, startDate, endDate, selectedMetric, selectedStationId, mapStyle, clusteringEnabled, showStations, aggregation, filters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};
