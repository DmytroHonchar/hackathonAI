import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import FilterBar from '../components/FilterBar';
import ProviderCard from '../components/ProviderCard';
import ProviderMap from '../components/ProviderMap';
import BookingModal from '../components/BookingModal';
import type { Provider } from '../lib/types';

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
          <div className="h-3 bg-zinc-800 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-3 h-3 bg-zinc-800 rounded" />
      <div className="mt-1.5 h-3 bg-zinc-800 rounded w-5/6" />
    </div>
  );
}

export default function Browse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [maxPrice, setMaxPrice] = useState(0);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  const stored = JSON.parse(localStorage.getItem('user_location') || 'null');
  const userLocation = stored?.lat && stored?.lng
    ? { lat: stored.lat, lng: stored.lng }
    : { lat: 51.5074, lng: -0.1278 };

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('providers').select('*');
    if (category) query = query.eq('category', category);
    if (maxPrice) query = query.lte('price_from', maxPrice);
    if (emergencyOnly) query = query.eq('emergency', true);
    const { data, error } = await query.order('rating', { ascending: false });
    if (!error) {
      const userLat = userLocation.lat;
      const userLng = userLocation.lng;
      const withDistance = (data ?? []).map((p) => {
        const R = 6371;
        const dLat = (p.lat - userLat) * Math.PI / 180;
        const dLng = (p.lng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(userLat * Math.PI/180) * Math.cos(p.lat * Math.PI/180) * Math.sin(dLng/2)**2;
        const distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return { ...p, distance_km };
      });
      const filtered = maxDistance
        ? withDistance.filter((p) => p.distance_km <= maxDistance)
        : withDistance;
      setProviders(filtered);
    }
    setLoading(false);
  }, [category, maxPrice, emergencyOnly, maxDistance]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  function handleBook(provider: Provider) {
    if (!user) { navigate('/login'); return; }
    setBookingProvider(provider);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-white text-2xl font-bold mb-1">Browse providers</h1>
          <p className="text-zinc-500 text-sm">Filter and find the right pro for your job.</p>
        </div>

        <FilterBar
          category={category} setCategory={setCategory}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          emergencyOnly={emergencyOnly} setEmergencyOnly={setEmergencyOnly}
          maxDistance={maxDistance} setMaxDistance={setMaxDistance}
        />

        <div className="flex gap-5 mt-5">
          {/* List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : providers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-zinc-400 font-medium mb-1">No providers match your filters</p>
                <p className="text-zinc-600 text-sm">Try widening the price range or distance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    highlighted={highlighted === p.id}
                    onClick={() => setHighlighted(p.id === highlighted ? null : p.id)}
                    onBook={() => handleBook(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-[73px]">
              <ProviderMap
                providers={providers}
                userLocation={userLocation}
                highlightedId={highlighted}
                onMarkerClick={setHighlighted}
                height="calc(100vh - 160px)"
                radiusKm={maxDistance}
              />
            </div>
          </div>
        </div>
      </div>

      {bookingProvider && (
        <BookingModal
          provider={bookingProvider}
          onClose={() => setBookingProvider(null)}
          onBooked={(id) => { setBookingProvider(null); navigate(`/bookings/${id}`); }}
        />
      )}
    </div>
  );
}
