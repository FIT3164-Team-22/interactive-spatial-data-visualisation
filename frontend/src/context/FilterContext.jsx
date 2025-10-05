/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
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

const DEFAULT_FILTERS = {
  state: '',
  startDate: DATE_BOUNDS.min,
  endDate: DATE_BOUNDS.max,
  metric: 'temperature',
  stationId: null,
  aggregation: 'daily',
  showHeatmap: true,
}

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (!context) throw new Error('useFilters must be used within FilterProvider')
  return context
}

const parseQueryParams = () => {
  if (typeof window === 'undefined' || typeof URLSearchParams === 'undefined') {
    return { ...DEFAULT_FILTERS }
  }

  const params = new URLSearchParams(window.location.search || '')
  return {
    state: params.get(QUERY_KEYS.state)?.toUpperCase() || DEFAULT_FILTERS.state,
    startDate: params.get(QUERY_KEYS.startDate) || DEFAULT_FILTERS.startDate,
    endDate: params.get(QUERY_KEYS.endDate) || DEFAULT_FILTERS.endDate,
    metric: params.get(QUERY_KEYS.metric) || DEFAULT_FILTERS.metric,
    stationId: (() => {
      const raw = params.get(QUERY_KEYS.station)
      if (!raw) return DEFAULT_FILTERS.stationId
      const parsed = Number.parseInt(raw, 10)
      return Number.isNaN(parsed) ? DEFAULT_FILTERS.stationId : parsed
    })(),
    aggregation: params.get(QUERY_KEYS.aggregation) || DEFAULT_FILTERS.aggregation,
    showHeatmap: params.get('heatmap') !== '0',
  }
}

const syncQueryParams = (filters) => {
  if (typeof window === 'undefined' || typeof URLSearchParams === 'undefined') {
    return
  }

  const params = new URLSearchParams()
  if (filters.state) params.set(QUERY_KEYS.state, filters.state)
  if (filters.startDate && filters.startDate !== DATE_BOUNDS.min) {
    params.set(QUERY_KEYS.startDate, filters.startDate)
  }
  if (filters.endDate && filters.endDate !== DATE_BOUNDS.max) {
    params.set(QUERY_KEYS.endDate, filters.endDate)
  }
  if (filters.selectedMetric !== 'temperature') {
    params.set(QUERY_KEYS.metric, filters.selectedMetric)
  }
  if (filters.selectedStation) params.set(QUERY_KEYS.station, String(filters.selectedStation))
  if (filters.aggregation !== 'daily') {
    params.set(QUERY_KEYS.aggregation, filters.aggregation)
  }
  if (!filters.showHeatmap) params.set('heatmap', '0')

  const query = params.toString()
  const { location, history } = window
  if (!location || !history?.replaceState) {
    return
  }

  const newUrl = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`
  history.replaceState({}, '', newUrl)
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
  const [showHeatmap, setShowHeatmap] = useState(initial.showHeatmap ?? true)

  const [aggregation, setAggregation] = useState(initial.aggregation)

  const replaceTimerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (replaceTimerRef.current) {
      clearTimeout(replaceTimerRef.current)
    }

    replaceTimerRef.current = setTimeout(() => {
      syncQueryParams({
        state: selectedState,
        startDate,
        endDate,
        selectedMetric,
        selectedStation: selectedStationId,
        aggregation,
        showHeatmap,
      })
    }, 200)

    return () => {
      if (replaceTimerRef.current) {
        clearTimeout(replaceTimerRef.current)
      }
    }
  }, [selectedState, startDate, endDate, selectedMetric, selectedStationId, aggregation, showHeatmap])

  const filters = useMemo(
    () => ({
      state: selectedState,
      startDate,
      endDate,
      selectedMetric,
      selectedStation: selectedStationId,
      aggregation,
      showHeatmap,
    }),
    [selectedState, startDate, endDate, selectedMetric, selectedStationId, aggregation, showHeatmap],
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
      showHeatmap,
      setShowHeatmap,
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
      showHeatmap,
      aggregation,
      filters,
    ],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}
