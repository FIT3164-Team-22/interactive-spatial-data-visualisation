import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet.heat'
import { useFilters } from '../../context/FilterContext'
import { useHeatmapData } from '../../hooks/useStations'
import { metricConfig } from '../../constants/metrics'

const stationIcon = L.divIcon({
  className: 'custom-station-marker',
  html: '<div style="width: 8px; height: 8px; background: #5865F2; border-radius: 50%; cursor: pointer; transition: all 0.2s;"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
})

const selectedStationIcon = L.divIcon({
  className: 'custom-selected-station-marker',
  html: '<div style="width: 20px; height: 20px; background: #DC2626; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #F9FAFB; box-shadow: 0 0 14px rgba(220, 38, 38, 0.7);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
})

const HeatmapLayer = ({ data, metric }) => {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!data?.length) {
      return undefined
    }

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    const heatData = data
      .filter((entry) => entry.value !== null && entry.value !== undefined)
      .map((entry) => [entry.latitude, entry.longitude, entry.value || 0])

    if (heatData.length > 0) {
      const values = heatData.map((entry) => entry[2])
      const sortedValues = [...values].sort((a, b) => a - b)
      const p10 = sortedValues[Math.floor(sortedValues.length * 0.1)]
      const p90 = sortedValues[Math.floor(sortedValues.length * 0.9)]

      const normalisedData = heatData.map((entry) => {
        let value = entry[2]
        value = Math.max(p10, Math.min(p90, value))
        const normalised = p90 === p10 ? 0.5 : (value - p10) / (p90 - p10)
        return [entry[0], entry[1], normalised]
      })

      heatLayerRef.current = L.heatLayer(normalisedData, {
        radius: 45,
        blur: 60,
        max: 0.8,
        minOpacity: 0.4,
        gradient: {
          0.0: '#0072B2',
          0.25: '#009E73',
          0.5: '#F0E442',
          0.75: '#E69F00',
          1.0: '#D55E00',
        },
      }).addTo(map)
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }
    }
  }, [data, metric, map])

  useEffect(() => {
    const resizeHandler = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 300)
    }

    resizeHandler()
    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [map])

  return null
}

const getMetricUnit = (metric) => {
  switch (metric) {
    case 'temperature':
      return 'degC'
    case 'rainfall':
    case 'evapotranspiration':
      return 'mm'
    case 'humidity':
      return '%'
    case 'wind':
      return 'm/s'
    default:
      return ''
  }
}

const StationMarkers = ({ stations, onStationClick, clusteringEnabled, selectedMetric }) => {
  const unit = getMetricUnit(selectedMetric)

  const markers = stations?.map((station) => (
    <Marker
      key={station.station_id}
      position={[station.latitude, station.longitude]}
      icon={stationIcon}
      eventHandlers={{
        click: () => onStationClick(station.station_id),
      }}
    />
  ))

  if (!clusteringEnabled) {
    return <>{markers}</>
  }

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      zoomToBoundsOnClick
      iconCreateFunction={(cluster) => {
        const count = cluster.getChildCount()
        let size = 'small'
        if (count > 50) size = 'large'
        else if (count > 20) size = 'medium'

        const dimension = size === 'large' ? 50 : size === 'medium' ? 40 : 30
        const fontSize = size === 'large' ? 16 : size === 'medium' ? 14 : 12

        return L.divIcon({
          html: `<div style="
            width: ${dimension}px;
            height: ${dimension}px;
            background: #5865F2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${fontSize}px;
          ">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(dimension, dimension),
        })
      }}
    >
      {markers}
    </MarkerClusterGroup>
  )
}

const mapStyles = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenTopoMap contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
}

const MapInteractionLayer = ({ onMapClick }) => {
  useMapEvents({
    click(event) {
      const target = event.originalEvent?.target
      if (target && target.closest && target.closest('.leaflet-marker-icon')) {
        return
      }
      onMapClick()
    },
  })
  return null
}

export default function StationMap() {
  const { selectedMetric, setSelectedStationId, selectedStationId, mapStyle, clusteringEnabled, showStations, showHeatmap, startDate, endDate } = useFilters()
  const { data: heatmapData, isLoading } = useHeatmapData(selectedMetric, startDate, endDate)

  const handleStationClick = (stationId) => {
    setSelectedStationId(stationId)
  }

  const handleClearSelection = () => {
    setSelectedStationId(null)
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-custom-card rounded-lg" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16" aria-hidden="true">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading map data...</p>
        </div>
      </div>
    )
  }

  const currentMapStyle = mapStyles[mapStyle] || mapStyles.standard
  const selectedStationData = selectedStationId && heatmapData ? heatmapData.find((item) => item.station_id === selectedStationId) : null
  const selectedMetricLabel = metricConfig[selectedMetric]?.label || selectedMetric
  const selectedMetricUnit = (() => {
    if (selectedMetric === 'temperature') return '°C'
    if (selectedMetric === 'rainfall' || selectedMetric === 'evapotranspiration') return 'mm'
    if (selectedMetric === 'humidity') return '%'
    if (selectedMetric === 'wind') return 'm/s'
    return ''
  })()

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg relative">
      {selectedStationId && (
        <button
          onClick={handleClearSelection}
          className="absolute top-2 right-2 z-[1000] bg-white dark:bg-custom-card text-gray-800 dark:text-gray-200 p-2 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200 border border-gray-300 dark:border-gray-600 animate-scale-in"
          title="Clear station selection"
          type="button"
        >
          <span aria-hidden="true">X</span>
          <span className="sr-only">Clear selected station</span>
        </button>
      )}
      <MapContainer
        center={[-25.2744, 133.7751]}
        zoom={5}
        className="h-full w-full"
        zoomControl
        attributionControl={false}
      >
        <MapInteractionLayer onMapClick={handleClearSelection} />
        <TileLayer url={currentMapStyle.url} attribution={currentMapStyle.attribution} />
        {showHeatmap && <HeatmapLayer data={heatmapData} metric={selectedMetric} />}
        {showStations && (
        <StationMarkers
          stations={heatmapData}
          onStationClick={handleStationClick}
          clusteringEnabled={clusteringEnabled}
          selectedMetric={selectedMetric}
        />
        )}
        {selectedStationData && (
          <Marker
            key={`selected-${selectedStationData.station_id}`}
            position={[selectedStationData.latitude, selectedStationData.longitude]}
            icon={selectedStationIcon}
            zIndexOffset={1000}
          />
        )}
      </MapContainer>
      {selectedStationData && (
        <div className="absolute left-3 bottom-3 md:left-4 md:bottom-4 z-[1001] bg-white/95 dark:bg-custom-card/95 backdrop-blur-md border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl px-4 py-3 max-w-xs animate-fade-in">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Selected station</p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {selectedStationData.station_name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {selectedStationData.state}
            </p>
            {typeof selectedStationData.value === 'number' && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                {selectedMetricLabel}: {' '}
                <span className="text-lg font-semibold text-primary">
                  {selectedStationData.value.toFixed(2)}
                  {selectedMetricUnit ? ` ${selectedMetricUnit}` : ''}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
