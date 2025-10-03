/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { DATE_BOUNDS } from '../config'

const FilterContext = createContext()

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) throw new Error('useFilters must be used within FilterProvider')
  return context
}

export const FilterProvider = ({ children }) => {
  const [selectedState, setSelectedState] = useState('')
  const [startDate, setStartDate] = useState(DATE_BOUNDS.min)
  const [endDate, setEndDate] = useState(DATE_BOUNDS.max)
  const [selectedMetric, setSelectedMetric] = useState('temperature')
  const [selectedStationId, setSelectedStationId] = useState(null)

  const [mapStyle, setMapStyle] = useState('standard')
  const [clusteringEnabled, setClusteringEnabled] = useState(true)
  const [showStations, setShowStations] = useState(true)

  const [aggregation, setAggregation] = useState('daily')

  const filters = useMemo(
    () => ({
      state: selectedState,
      startDate,
      endDate,
      selectedMetric,
      selectedStation: selectedStationId,
    }),
    [selectedState, startDate, endDate, selectedMetric, selectedStationId],
  )

  const value = useMemo(
    () => ({
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
      filters,
    }),
    [
      selectedState,
      startDate,
      endDate,
      selectedMetric,
      selectedStationId,
      mapStyle,
      clusteringEnabled,
      showStations,
      aggregation,
      filters,
    ],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

