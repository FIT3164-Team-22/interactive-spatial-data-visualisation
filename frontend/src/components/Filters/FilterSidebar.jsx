import { useCallback, useEffect, useMemo, useState } from 'react'
import { DATE_BOUNDS } from '../../config'
import { useFilters } from '../../context/FilterContext'
import { useStates } from '../../hooks/useStations'
import Tooltip from '../common/Tooltip'
import { toast } from '../../utils/toast'

const METRIC_OPTIONS = [
  { id: 'temperature', label: 'Temperature', tooltip: 'Daily maximum temperature in degrees Celsius' },
  { id: 'rainfall', label: 'Rainfall', tooltip: 'Daily rainfall accumulation in millimetres' },
  { id: 'humidity', label: 'Humidity', tooltip: 'Daily maximum relative humidity in percent' },
  { id: 'wind', label: 'Wind Speed', tooltip: 'Average 10m wind speed in metres per second' },
  { id: 'evapotranspiration', label: 'Evapotranspiration', tooltip: 'Daily evapotranspiration in millimetres' },
]

const SAVED_VIEWS_KEY = 'dashboard:savedViews'

export default function FilterSidebar({ onCollapseChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [dateError, setDateError] = useState('')
  const [savedViews, setSavedViews] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }
    try {
      const raw = window.localStorage.getItem(SAVED_VIEWS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      console.error('Failed to parse saved views', error)
      return []
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 350)
    return () => clearTimeout(timer)
  }, [isCollapsed])

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed)
    }
  }, [isCollapsed, onCollapseChange])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews))
    } catch (error) {
      console.error('Failed to persist saved views', error)
    }
  }, [savedViews])

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
    showHeatmap,
    setShowHeatmap,
    aggregation,
    setAggregation,
    selectedStationId,
    setSelectedStationId,
  } = useFilters()

  const { data: states } = useStates()

  const validateDates = useCallback(
    (nextStart, nextEnd) => {
      if (nextStart && nextEnd && nextStart > nextEnd) {
        setDateError('Start date must be on or before the end date')
        return false
      }
      setDateError('')
      return true
    },
    [],
  )

  const handleStartDateChange = useCallback(
    (value) => {
      if (validateDates(value, endDate)) {
        setStartDate(value)
      }
    },
    [endDate, setStartDate, validateDates],
  )

  const handleEndDateChange = useCallback(
    (value) => {
      if (validateDates(startDate, value)) {
        setEndDate(value)
      }
    },
    [startDate, setEndDate, validateDates],
  )

  const handleSaveView = () => {
    const name = window.prompt('Name this view')
    if (!name) return

    const trimmed = name.trim()
    if (!trimmed) return

    const view = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: trimmed,
      state: selectedState,
      startDate,
      endDate,
      selectedMetric,
      selectedStationId,
      mapStyle,
      clusteringEnabled,
      showStations,
      showHeatmap,
      aggregation,
    }

    setSavedViews((prev) => {
      const filtered = prev.filter((item) => item.name.toLowerCase() !== trimmed.toLowerCase())
      return [...filtered, view]
    })
    toast.success('View saved')
  }

  const handleApplyView = (view) => {
    if (!view) return
    setSelectedState(view.state || '')
    setStartDate(view.startDate || DATE_BOUNDS.min)
    setEndDate(view.endDate || DATE_BOUNDS.max)
    setSelectedMetric(view.selectedMetric || 'temperature')
    setAggregation(view.aggregation || 'daily')
    setSelectedStationId(view.selectedStationId ?? null)
    setMapStyle(view.mapStyle || 'standard')
    setClusteringEnabled(view.clusteringEnabled ?? true)
    setShowStations(view.showStations ?? true)
    setShowHeatmap(view.showHeatmap ?? true)
    toast.success('Loaded view "' + view.name + '"')
  }

  const handleDeleteView = (id) => {
    setSavedViews((prev) => prev.filter((view) => view.id !== id))
    toast.info('View removed')
  }

  const metrics = useMemo(() => METRIC_OPTIONS, [])

  return (
    <>
      {isCollapsed && (
        <div className="fixed top-7 md:top-9 left-4 md:left-6 z-[9999] pointer-events-none">
          <button
            onClick={() => setIsCollapsed(false)}
            className="px-2 py-3 bg-discord-light dark:bg-discord-darker text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-discord-dark transition font-medium text-sm aspect-square flex items-center justify-center pointer-events-auto"
            aria-label="Open sidebar"
            type="button"
          >
            <div className="w-5 h-4 flex flex-col justify-between" aria-hidden="true">
              <span className="block h-0.5 bg-gray-800 dark:bg-gray-200 rounded"></span>
              <span className="block h-0.5 bg-gray-800 dark:bg-gray-200 rounded"></span>
              <span className="block h-0.5 bg-gray-800 dark:bg-gray-200 rounded"></span>
            </div>
          </button>
        </div>
      )}

      <div
        className={`fixed lg:relative h-screen bg-white dark:bg-custom-sidebar shadow-2xl overflow-y-auto border-r border-gray-300 dark:border-gray-600 z-40 ${
          isCollapsed ? '-translate-x-full lg:w-0 lg:p-0 lg:border-0' : 'translate-x-0 w-full lg:w-80 xl:w-96'
        }`}
        style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform, width' }}
      >
        <div className="px-4 md:px-6 pt-7 md:pt-9 pb-4 md:pb-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Close sidebar"
            type="button"
          >
            <div className="w-4 h-4 relative" aria-hidden="true">
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200 rounded rotate-45"></span>
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 dark:bg-gray-200 rounded -rotate-45"></span>
            </div>
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex-1 text-center">
            BOM Data Explorer
          </h2>
          <div className="w-8" aria-hidden="true"></div>
        </div>

        <div className="p-6 space-y-6">
          <section aria-labelledby="time-period-heading">
            <div className="flex items-center gap-2 mb-3">
              <h3 id="time-period-heading" className="text-primary font-semibold text-sm uppercase tracking-wide">
                Time Period
              </h3>
              <Tooltip content="Filter data by date range between 2019 and 2025" position="right">
                <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
              </Tooltip>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="start-date">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                  min={DATE_BOUNDS.min}
                  max={DATE_BOUNDS.max}
                  aria-invalid={dateError ? 'true' : 'false'}
                  aria-describedby={dateError ? 'date-error' : undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="end-date">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => handleEndDateChange(event.target.value)}
                  min={DATE_BOUNDS.min}
                  max={DATE_BOUNDS.max}
                  aria-invalid={dateError ? 'true' : 'false'}
                  aria-describedby={dateError ? 'date-error' : undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
                />
              </div>
              {dateError && (
                <p id="date-error" className="text-sm text-red-600 dark:text-red-400">
                  {dateError}
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="metric-heading">
            <div className="flex items-center gap-2 mb-3">
              <h3 id="metric-heading" className="text-primary font-semibold text-sm uppercase tracking-wide">
                Metric
              </h3>
              <Tooltip content="Choose the meteorological metric to visualise" position="right">
                <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {metrics.map((metric) => (
                <label key={metric.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary transition">
                  <input
                    type="radio"
                    name="metric"
                    value={metric.id}
                    checked={selectedMetric === metric.id}
                    onChange={() => setSelectedMetric(metric.id)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{metric.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{metric.tooltip}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section aria-labelledby="state-heading">
            <div className="flex items-center gap-2 mb-3">
              <h3 id="state-heading" className="text-primary font-semibold text-sm uppercase tracking-wide">
                Region
              </h3>
              <Tooltip content="Filter stations by Australian state or territory" position="right">
                <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
              </Tooltip>
            </div>
            <select
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white dark:bg-custom-card text-gray-900 dark:text-gray-100"
            >
              <option value="">All Australia</option>
              {states?.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </section>

          <section aria-labelledby="saved-views-heading">
            <div className="flex items-center gap-2 mb-3">
              <h3 id="saved-views-heading" className="text-primary font-semibold text-sm uppercase tracking-wide">
                Saved Views
              </h3>
              <Tooltip content="Store and reuse frequently accessed filter combinations" position="right">
                <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSaveView}
                className="w-full px-3 py-2 border border-dashed border-primary text-primary rounded-lg hover:bg-primary/10 transition text-sm font-medium"
              >
                Save current view
              </button>
              {savedViews.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No saved views yet.</p>
              ) : (
                savedViews.map((view) => (
                  <div key={view.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleApplyView(view)}
                      className="text-sm text-left text-gray-800 dark:text-gray-200 hover:underline"
                    >
                      {view.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteView(view.id)}
                      className="text-xs text-red-500 dark:text-red-400 hover:underline"
                      aria-label={`Delete saved view ${view.name}`}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <hr className="border-gray-200 dark:border-gray-700" />

          <section aria-labelledby="map-settings-heading">
            <div className="flex items-center gap-2 mb-3">
              <h3 id="map-settings-heading" className="text-primary font-semibold text-sm uppercase tracking-wide">
                Map Settings
              </h3>
              <Tooltip content="Customise map appearance and behaviour" position="right">
                <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
              </Tooltip>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="map-style" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Map Style
                </label>
                <select
                  id="map-style"
                  value={mapStyle}
                  onChange={(event) => setMapStyle(event.target.value)}
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
                  <Tooltip content="Display individual station markers on the map" position="right">
                    <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
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
                  type="button"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showStations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label htmlFor="heatmap-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Show Heatmap
                  </label>
                  <Tooltip content="Toggle the heatmap overlay on the map" position="right">
                    <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
                  </Tooltip>
                </div>
                <button
                  id="heatmap-toggle"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    showHeatmap ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={showHeatmap}
                  type="button"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showHeatmap ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div
                className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-opacity ${
                  !showStations ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <label htmlFor="clustering-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Cluster Stations
                  </label>
                  <Tooltip content="Group nearby stations for improved performance" position="right">
                    <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 font-semibold">?</span>
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
                  type="button"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      clusteringEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
          <section aria-labelledby="about-heading">
            <div className="flex items-center gap-2 mb-3">
              <h3 id="about-heading" className="text-primary font-semibold text-sm uppercase tracking-wide">
                About
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Interactive Spatial Data Visualization &mdash; Project 8, FIT3164 Team 22.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Contributors: Rahul Pejathaya, Alice (Xinyi) Zhou, Abdullah Sabaa
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Data sourced from the Australian Bureau of Meteorology FTP server.
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>Coverage: 377 stations</li>
              <li>Metrics: 5 core meteorological measures</li>
              <li>Temporal span: 2019 &ndash; Aug 2025</li>
            </ul>
          </section>

        </div>
      </div>

      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
          role="presentation"
        />
      )}
    </>
  )
}
