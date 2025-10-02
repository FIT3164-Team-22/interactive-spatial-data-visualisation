import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.heat';
import { useFilters } from '../../context/FilterContext';
import { useHeatmapData } from '../../hooks/useStations';

const stationIcon = L.divIcon({
  className: 'custom-station-marker',
  html: '<div style="width: 8px; height: 8px; background: #5865F2; border-radius: 50%; cursor: pointer; transition: all 0.2s;"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const HeatmapLayer = ({ data, metric }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!data?.length) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatData = data
      .filter(d => d.value !== null && d.value !== undefined)
      .map(d => [d.latitude, d.longitude, d.value || 0]);

    if (heatData.length > 0) {
      const values = heatData.map(d => d[2]);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);

      // Calculate percentiles for better distribution
      const sortedValues = [...values].sort((a, b) => a - b);
      const p10 = sortedValues[Math.floor(sortedValues.length * 0.1)];
      const p90 = sortedValues[Math.floor(sortedValues.length * 0.9)];

      const normalizedData = heatData.map(d => {
        let value = d[2];
        // Clamp extreme outliers to 10th and 90th percentiles
        value = Math.max(p10, Math.min(p90, value));
        // Normalize to 0-1 range
        const normalized = (value - p10) / (p90 - p10);
        return [d[0], d[1], normalized];
      });

      heatLayerRef.current = L.heatLayer(normalizedData, {
        radius: 45,
        blur: 60,
        max: 0.8,
        minOpacity: 0.4,
        gradient: {
          0.0: '#0072B2',
          0.25: '#009E73',
          0.5: '#F0E442',
          0.75: '#E69F00',
          1.0: '#D55E00'
        }
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [data, metric, map]);

  // Trigger map resize when container changes
  useEffect(() => {
    const resizeHandler = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    };

    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [map]);

  return null;
};

const StationMarkers = ({ stations, onStationClick, clusteringEnabled, selectedMetric }) => {
  const getMetricLabel = (metric) => {
    const labels = {
      'temperature': 'Temperature',
      'rainfall': 'Rainfall',
      'humidity': 'Humidity',
      'wind': 'Wind Speed',
      'evapotranspiration': 'Evapotranspiration'
    };
    return labels[metric] || 'Value';
  };

  const getMetricUnit = (metric) => {
    const units = {
      'temperature': '°C',
      'rainfall': 'mm',
      'humidity': '%',
      'wind': 'km/h',
      'evapotranspiration': 'mm'
    };
    return units[metric] || '';
  };

  const markers = stations?.map((station) => (
    <Marker
      key={station.station_id}
      position={[station.latitude, station.longitude]}
      icon={stationIcon}
      eventHandlers={{
        click: () => onStationClick(station.station_id),
      }}
    >
    <Popup>
      <strong>{station.station_name}</strong><br />
      <small>📍 {station.state}</small><br />
      {station.value !== null && `${station.value.toFixed(1)} ${getMetricUnit(selectedMetric)}`}
    </Popup>
    </Marker>
  ));

  if (!clusteringEnabled) {
    return <>{markers}</>;
  }

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
      zoomToBoundsOnClick={true}
      iconCreateFunction={(cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 50) size = 'large';
        else if (count > 20) size = 'medium';

        return L.divIcon({
          html: `<div style="
            width: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '30px'};
            height: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '30px'};
            background: #5865F2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px'};
          ">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(size === 'large' ? 50 : size === 'medium' ? 40 : 30, size === 'large' ? 50 : size === 'medium' ? 40 : 30),
        });
      }}
    >
      {markers}
    </MarkerClusterGroup>
  );
};

const mapStyles = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenTopoMap contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB'
  }
};

export default function StationMap() {
  const { selectedMetric, setSelectedStationId, selectedStationId, mapStyle, clusteringEnabled, showStations, startDate, endDate } = useFilters();
  const { data: heatmapData, isLoading } = useHeatmapData(selectedMetric, startDate, endDate);

  const handleStationClick = (stationId) => {
    setSelectedStationId(stationId);
  };

  const handleClearSelection = () => {
    setSelectedStationId(null);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-custom-card rounded-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading map data...</p>
        </div>
      </div>
    );
  }

  const currentMapStyle = mapStyles[mapStyle] || mapStyles.standard;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg relative">
      {selectedStationId && (
        <button
          onClick={handleClearSelection}
          className="absolute top-2 right-2 z-[1000] bg-white dark:bg-custom-card text-gray-800 dark:text-gray-200 p-2 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200 border border-gray-300 dark:border-gray-600 animate-scale-in"
          title="Clear station selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <MapContainer
        center={[-25.2744, 133.7751]}
        zoom={5}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url={currentMapStyle.url}
          attribution={currentMapStyle.attribution}
        />
        <HeatmapLayer data={heatmapData} metric={selectedMetric} />
        {showStations && (
          <StationMarkers stations={heatmapData} onStationClick={handleStationClick} clusteringEnabled={clusteringEnabled} selectedMetric={selectedMetric} />
        )}
      </MapContainer>
    </div>
  );
}
