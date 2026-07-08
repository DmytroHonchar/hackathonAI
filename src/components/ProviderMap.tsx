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

function pin(color: string, size: number, glow = false) {
  return new L.DivIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:${
      glow ? `0 0 0 6px ${color}33, 0 2px 8px rgba(60,42,26,0.35)` : '0 2px 6px rgba(60,42,26,0.35)'
    }"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const clayIcon = pin('#C0532B', 16);
const clayIconHighlighted = pin('#C0532B', 22, true);
const agaveIcon = pin('#2E6A52', 16, true);

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
    : [53.4084, -2.9916];

  const centre: [number, number] = resolvedLocation;

  const highlighted = providers.find((p) => p.id === highlightedId);
  const radiusCentre: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : stored?.lat && stored?.lng
    ? [stored.lat, stored.lng]
    : resolvedLocation;

  return (
    <div style={{ height }} className="rounded-3xl overflow-hidden border border-line shadow-soft">
      <MapContainer
        center={centre}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#F5EEE2' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {highlighted && <FlyTo lat={highlighted.lat} lng={highlighted.lng} />}
        {radiusKm && radiusKm > 0 && (
          <Circle
            center={radiusCentre}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#C0532B', fillColor: '#C0532B', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }}
          />
        )}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={agaveIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {providers.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={p.id === highlightedId ? clayIconHighlighted : clayIcon}
            eventHandlers={{ click: () => onMarkerClick?.(p.id) }}
          >
            <Popup>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B5D4F' }}>from £{p.price_from} · ★ {Number(p.rating).toFixed(1)}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
