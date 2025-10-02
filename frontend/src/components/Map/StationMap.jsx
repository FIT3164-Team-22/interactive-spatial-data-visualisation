import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.heat';
import { useFilters } from '../../context/FilterContext';
import { useHeatmapData } from '../../hooks/useStations';
import SkeletonLoader from '../common/SkeletonLoader';

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
      const maxValue = Math.max(...heatData.map(d => d[2]));
      const minValue = Math.min(...heatData.map(d => d[2]));

      const normalizedData = heatData.map(d => [
        d[0],
        d[1],
        maxValue > minValue ? (d[2] - minValue) / (maxValue - minValue) : 0.5
      ]);

      heatLayerRef.current = L.heatLayer(normalizedData, {
        radius: 50,
        blur: 60,
        max: 1.0,
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

const StationMarkers = ({ stations, onStationClick, clusteringEnabled }) => {
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
        <div className="text-sm">
          <p className="font-semibold">{station.station_name}</p>
          <p className="text-gray-600 dark:text-gray-400">{station.state}</p>
          {station.value !== null && station.value !== undefined && (
            <p className="text-primary font-medium mt-1">
              Value: {station.value?.toFixed(2)}
            </p>
          )}
        </div>
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
  const { selectedMetric, setSelectedStationId, mapStyle, clusteringEnabled, showStations } = useFilters();
  const { data: heatmapData, isLoading } = useHeatmapData(selectedMetric);

  const handleStationClick = (stationId) => {
    setSelectedStationId(stationId);
  };

  if (isLoading) {
    return <SkeletonLoader type="chart" />;
  }

  const currentMapStyle = mapStyles[mapStyle] || mapStyles.standard;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg">
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
          <StationMarkers stations={heatmapData} onStationClick={handleStationClick} clusteringEnabled={clusteringEnabled} />
        )}
      </MapContainer>
    </div>
  );
}
