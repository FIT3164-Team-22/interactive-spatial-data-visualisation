/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DATE_BOUNDS } from '../config'

const QUERY_KEYS = {
  state: 'state',
  startDate: 'start_date',
  endDate: 'end_date',
  metric: 'metric',
  station: 'station',
  aggregation: 'aggregation',
}

const FilterContext = createContext()

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) throw new Error('useFilters must be used within FilterProvider')
  return context
}

const parseQueryParams = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    state: params.get(QUERY_KEYS.state)?.toUpperCase() || '',
    startDate: params.get(QUERY_KEYS.startDate) || DATE_BOUNDS.min,
    endDate: params.get(QUERY_KEYS.endDate) || DATE_BOUNDS.max,
    metric: params.get(QUERY_KEYS.metric) || 'temperature',
    stationId: (() => {
      const raw = params.get(QUERY_KEYS.station)
      if (!raw) return null
      const parsed = Number.parseInt(raw, 10)
      return Number.isNaN(parsed) ? null : parsed
    })(),
    aggregation: params.get(QUERY_KEYS.aggregation) || 'daily',
  }
}

const syncQueryParams = (filters) => {
  const params = new URLSearchParams()
  if (filters.state) params.set(QUERY_KEYS.state, filters.state)
  if (filters.startDate && filters.startDate !== DATE_BOUNDS.min)
    params.set(QUERY_KEYS.startDate, filters.startDate)
  if (filters.endDate && filters.endDate !== DATE_BOUNDS.max)
    params.set(QUERY_KEYS.endDate, filters.endDate)
  if (filters.selectedMetric !== 'temperature')
    params.set(QUERY_KEYS.metric, filters.selectedMetric)
  if (filters.selectedStation) params.set(QUERY_KEYS.station, String(filters.selectedStation))
  if (filters.aggregation !== 'daily')
    params.set(QUERY_KEYS.aggregation, filters.aggregation)

  const query = params.toString()
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', newUrl)
}

export const FilterProvider = ({ children }) => {
  const initial = parseQueryParams()
  const [selectedState, setSelectedState] = useState(initial.state)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [selectedMetric, setSelectedMetric] = useState(initial.metric)
  const [selectedStationId, setSelectedStationId] = useState(initial.stationId)

  const [mapStyle, setMapStyle] = useState('standard')
  const [clusteringEnabled, setClusteringEnabled] = useState(true)
  const [showStations, setShowStations] = useState(true)

  const [aggregation, setAggregation] = useState(initial.aggregation)

  useEffect(() => {
    syncQueryParams({
      state: selectedState,
      startDate,
      endDate,
      selectedMetric,
      selectedStation: selectedStationId,
      aggregation,
    })
  }, [selectedState, startDate, endDate, selectedMetric, selectedStationId, aggregation])

  const filters = useMemo(
    () => ({
      state: selectedState,
      startDate,
      endDate,
      selectedMetric,
      selectedStation: selectedStationId,
      aggregation,
    }),
    [selectedState, startDate, endDate, selectedMetric, selectedStationId, aggregation],
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
