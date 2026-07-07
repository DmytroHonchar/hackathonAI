import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon path issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const amberIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#fbbf24;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const amberIconHighlighted = new L.DivIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#f59e0b;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(251,191,36,0.6)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const blueIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface ProviderPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price_from: number;
  rating: number;
}

interface ProviderMapProps {
  providers: ProviderPin[];
  userLocation?: { lat: number; lng: number };
  highlightedId?: string | null;
  onMarkerClick?: (id: string) => void;
  height?: string;
  radiusKm?: number;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export default function ProviderMap({ providers, userLocation, highlightedId, onMarkerClick, height = '300px', radiusKm }: ProviderMapProps) {
  const stored = JSON.parse(localStorage.getItem('user_location') || 'null');
  const resolvedLocation: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : stored?.lat && stored?.lng
    ? [stored.lat, stored.lng]
    : providers.length > 0
    ? [providers[0].lat, providers[0].lng]
    : [54.0, -2.0];

  const centre: [number, number] = resolvedLocation;

  const highlighted = providers.find((p) => p.id === highlightedId);
  const radiusCentre: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : stored?.lat && stored?.lng
    ? [stored.lat, stored.lng]
    : resolvedLocation;

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-zinc-800">
      <MapContainer
        center={centre}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#18181b' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {highlighted && <FlyTo lat={highlighted.lat} lng={highlighted.lng} />}
        {radiusKm && radiusKm > 0 && (
          <Circle
            center={radiusCentre}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }}
          />
        )}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={blueIcon}>
            <Popup>You</Popup>
          </Marker>
        )}
        {providers.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={p.id === highlightedId ? amberIconHighlighted : amberIcon}
            eventHandlers={{ click: () => onMarkerClick?.(p.id) }}
          >
            <Popup>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>£{p.price_from} · ★ {Number(p.rating).toFixed(1)}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
