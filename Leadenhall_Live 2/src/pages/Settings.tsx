import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProviderContext } from '../context/ProviderContext';
import { supabase } from '../lib/supabase';
import { Briefcase, ArrowRight, Loader, User, MapPin, Search } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listing, isLoading, reload } = useProviderContext();
  const [becoming, setBecoming] = useState(false);
  const [error, setError] = useState('');

  // Location state
  const stored = JSON.parse(localStorage.getItem('user_location') || 'null');
  const [locationLabel, setLocationLabel] = useState(stored?.label || '');
  const [locationQuery, setLocationQuery] = useState(stored?.label || '');
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleLocationInput(value: string) {
    setLocationQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'DispatchApp/1.0' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  function selectLocation(s: { display_name: string; lat: string; lon: string }) {
    const loc = { lat: parseFloat(s.lat), lng: parseFloat(s.lon), label: s.display_name };
    localStorage.setItem('user_location', JSON.stringify(loc));
    setLocationLabel(s.display_name);
    setLocationQuery(s.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setLocationSaved(true);
    setTimeout(() => setLocationSaved(false), 2000);
  }

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` };
        localStorage.setItem('user_location', JSON.stringify(loc));
        setLocationLabel(loc.label);
        setLocationQuery(loc.label);
        setLocationSaved(true);
        setTimeout(() => setLocationSaved(false), 2000);
      },
      () => {}
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Sign in to access settings.</p>
          <Link to="/login" className="bg-amber-400 text-zinc-950 font-semibold px-5 py-2.5 rounded-xl text-sm">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  async function becomeProvider() {
    if (!user) return;
    setBecoming(true);
    setError('');

    const emailPrefix = user.email?.split('@')[0] ?? 'mybusiness';
    const name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace(/[._-]/g, ' ');

    const stored = JSON.parse(localStorage.getItem('user_location') || 'null');
    if (!stored?.lat || !stored?.lng) {
      setError('Please set your location in settings before becoming a provider.');
      setBecoming(false);
      return;
    }
    const { error: insertError } = await supabase.from('providers').insert({
      owner_id: user.id,
      name,
      category: 'plumber',
      description: '',
      price_from: 0,
      city: stored.label?.split(',')[0]?.trim() || 'Unknown',
      lat: stored.lat,
      lng: stored.lng,
      available: true,
      rating: 0,
      review_count: 0,
    });

    if (insertError) {
      setError(insertError.message);
      setBecoming(false);
      return;
    }

    await reload();
    navigate('/provider');
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-white text-2xl font-bold mb-8">Settings</h1>

        {/* Account */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center">
              <User size={16} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.email}</p>
              <p className="text-zinc-600 text-xs">Customer account</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-400/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Your Location</h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                Set your location so we can show you nearby providers and calculate distances.
              </p>
            </div>
          </div>

          <div className="relative mb-3">
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 focus-within:border-amber-400/60 rounded-xl px-3 py-2.5 transition-colors">
              <Search size={13} className="text-zinc-500 flex-shrink-0" />
              <input
                value={locationQuery}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search your address, city or postcode…"
                className="bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none flex-1 min-w-0"
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectLocation(s)}
                    className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border-b border-zinc-700/50 last:border-b-0 flex items-start gap-2"
                  >
                    <MapPin size={12} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={useCurrentLocation}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <MapPin size={13} />
              Use my current location
            </button>
            {locationSaved && <span className="text-emerald-400 text-xs font-medium">✓ Saved</span>}
          </div>

          {locationLabel && (
            <p className="text-zinc-400 text-xs mt-3">
              Current: <span className="text-white font-medium">{locationLabel}</span>
            </p>
          )}
        </div>

        {/* Provider toggle */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-400/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Briefcase size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Service Provider</h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                List your business on Dispatch, set your availability, and receive bookings directly from customers and the AI dispatcher.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Loader size={14} className="animate-spin" />
              Checking status…
            </div>
          ) : listing ? (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-zinc-300 text-sm">You have an active listing — <strong className="text-white">{listing.name}</strong></span>
              <button
                onClick={() => navigate('/provider')}
                className="ml-auto flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Dashboard <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <button
                onClick={becomeProvider}
                disabled={becoming}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {becoming ? <><Loader size={14} className="animate-spin" /> Creating listing…</> : <><Briefcase size={14} /> Become a provider</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
