import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Map as MapIcon, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import FilterBar from '../components/FilterBar';
import ProviderCard from '../components/ProviderCard';
import ProviderMap from '../components/ProviderMap';
import BookingModal from '../components/BookingModal';
import type { Provider } from '../lib/types';

function SkeletonCard() {
  return (
    <div className="bg-surface border border-line rounded-3xl p-3.5">
      <div className="flex gap-3.5">
        <div className="w-16 h-16 skeleton rounded-2xl" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-4 skeleton rounded w-3/4" />
          <div className="h-3 skeleton rounded w-1/3" />
          <div className="h-3 skeleton rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 h-3 skeleton rounded" />
      <div className="mt-1.5 h-3 skeleton rounded w-5/6" />
    </div>
  );
}

type Sort = 'recommended' | 'nearest' | 'rating' | 'price';

export default function Browse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [maxPrice, setMaxPrice] = useState(0);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<Sort>('recommended');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const stored = JSON.parse(localStorage.getItem('user_location') || 'null');
  const hasLocation = Boolean(stored?.lat && stored?.lng);
  const userLocation = hasLocation ? { lat: stored.lat, lng: stored.lng } : { lat: 53.4084, lng: -2.9916 };
  const locationLabel = stored?.label?.split(',')[0] ?? 'Liverpool';

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('providers').select('*').eq('available', true);
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
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...p, distance_km };
      });
      const filtered = maxDistance ? withDistance.filter((p) => p.distance_km <= maxDistance) : withDistance;
      setProviders(filtered);
    }
    setLoading(false);
  }, [category, maxPrice, emergencyOnly, maxDistance]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let list = providers;
    if (kw) list = list.filter((p) => (p.name + ' ' + p.description).toLowerCase().includes(kw));
    const sorted = [...list];
    if (sort === 'nearest') sorted.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === 'price') sorted.sort((a, b) => a.price_from - b.price_from);
    // 'recommended' keeps DB order (rating desc)
    return sorted;
  }, [providers, keyword, sort]);

  function handleBook(provider: Provider) {
    if (!user) { navigate('/login'); return; }
    setBookingProvider(provider);
  }

  return (
    <div className="min-h-screen">
      {/* Sticky search + filters header */}
      <div className="sticky top-16 z-30 bg-canvas/90 backdrop-blur-lg border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 bg-surface border border-line rounded-full px-4 py-2.5 focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/10 transition-all">
              <Search size={18} className="text-ink-faint flex-shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search plumbers, boiler repair, deep clean…"
                className="flex-1 bg-transparent text-ink text-sm placeholder:text-ink-faint focus:outline-none min-w-0"
              />
              {keyword && <button onClick={() => setKeyword('')}><X size={15} className="text-ink-faint hover:text-ink" /></button>}
            </div>
            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-1.5 bg-surface border border-line rounded-full px-4 py-2.5 text-sm text-ink-soft hover:text-ink hover:border-line-strong transition-all"
            >
              <MapPin size={15} className="text-clay" /> {locationLabel}
            </Link>
          </div>
          <FilterBar
            category={category} setCategory={setCategory}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            emergencyOnly={emergencyOnly} setEmergencyOnly={setEmergencyOnly}
            maxDistance={maxDistance} setMaxDistance={setMaxDistance}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Location nudge */}
        {!hasLocation && (
          <Link to="/settings" className="flex items-center gap-2 bg-marigold-tint border border-marigold/30 rounded-2xl px-4 py-3 mb-4 text-sm">
            <MapPin size={16} className="text-[#9a6d12] flex-shrink-0" />
            <span className="text-ink-soft">Set your location to see who’s really nearby and get accurate distances.</span>
            <span className="ml-auto font-semibold text-[#9a6d12] whitespace-nowrap">Set now →</span>
          </Link>
        )}

        {/* Result count + sort */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-ink-soft text-sm">
            {loading ? 'Finding pros…' : (
              <><span className="font-semibold text-ink">{visible.length}</span> {visible.length === 1 ? 'pro' : 'pros'} near {locationLabel}</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-ink-faint hidden sm:block" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-surface border border-line rounded-full px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:border-clay cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="nearest">Nearest first</option>
              <option value="rating">Top rated</option>
              <option value="price">Lowest price</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-3xl bg-sand grid place-items-center mb-4">
                  <Search size={26} className="text-ink-faint" />
                </div>
                <p className="text-ink font-semibold mb-1">No pros match your filters</p>
                <p className="text-ink-soft text-sm mb-5 max-w-xs">Try widening the price range or distance — or let the assistant search for you.</p>
                <div className="flex gap-2">
                  <button onClick={() => { setCategory(''); setMaxPrice(0); setMaxDistance(0); setEmergencyOnly(false); setKeyword(''); }} className="btn-ghost px-4 py-2 text-sm">
                    Clear filters
                  </button>
                  <Link to="/app" className="btn-clay px-4 py-2 text-sm"><Sparkles size={15} /> Ask the assistant</Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {visible.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    highlighted={highlighted === p.id}
                    onClick={() => navigate(`/provider/${p.id}`)}
                    onBook={() => handleBook(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sticky map (desktop) */}
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-[220px]">
              <ProviderMap
                providers={visible}
                userLocation={hasLocation ? userLocation : undefined}
                highlightedId={highlighted}
                onMarkerClick={setHighlighted}
                height="calc(100vh - 250px)"
                radiusKm={maxDistance}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile map toggle */}
      {!loading && visible.length > 0 && (
        <button
          onClick={() => setShowMobileMap(true)}
          className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30 btn-clay px-5 py-3 text-sm shadow-lift"
        >
          <MapIcon size={16} /> Map
        </button>
      )}
      {showMobileMap && (
        <div className="lg:hidden fixed inset-0 z-50 bg-canvas flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-line">
            <h2 className="font-display text-lg font-semibold text-ink">{visible.length} pros nearby</h2>
            <button onClick={() => setShowMobileMap(false)} className="w-9 h-9 rounded-full bg-sand grid place-items-center"><X size={18} className="text-ink" /></button>
          </div>
          <div className="flex-1 p-4">
            <ProviderMap
              providers={visible}
              userLocation={hasLocation ? userLocation : undefined}
              highlightedId={highlighted}
              onMarkerClick={setHighlighted}
              height="100%"
              radiusKm={maxDistance}
            />
          </div>
        </div>
      )}

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
