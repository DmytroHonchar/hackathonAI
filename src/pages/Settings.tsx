import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProviderContext } from '../context/ProviderContext';
import { supabase } from '../lib/supabase';
import { Store, ArrowRight, Loader, User, MapPin, Search, LogOut, CheckCircle2, Locate } from 'lucide-react';
import Logo from '../components/Logo';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listing, isLoading, reload } = useProviderContext();
  const [becoming, setBecoming] = useState(false);
  const [error, setError] = useState('');

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
          { headers: { 'User-Agent': 'ManosApp/1.0' } }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-soft mb-4">Sign in to access your account.</p>
          <Link to="/login" className="btn-clay px-5 py-2.5 text-sm">Sign in</Link>
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
      setError('Please set your location above before listing your business.');
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
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-ink mb-6">Account</h1>

        {/* Account */}
        <div className="card rounded-4xl p-5 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-clay-tint rounded-2xl grid place-items-center flex-shrink-0"><User size={20} className="text-clay" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-ink font-semibold text-sm truncate">{user.email}</p>
            <p className="text-ink-faint text-xs">{listing ? 'Customer + Provider' : 'Customer account'}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="btn-ghost px-4 py-2 text-sm hover:text-coral hover:border-coral/30">
            <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        {/* Location */}
        <div className="card rounded-4xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 bg-agave-tint rounded-2xl grid place-items-center flex-shrink-0"><MapPin size={19} className="text-agave-dark" /></div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Your location</h2>
              <p className="text-ink-soft text-sm mt-0.5">So we can show pros who are truly nearby and get distances right.</p>
            </div>
          </div>

          <div className="relative mb-3">
            <div className="flex items-center gap-2 field !py-3">
              <Search size={15} className="text-ink-faint flex-shrink-0" />
              <input
                value={locationQuery}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search address, city or postcode…"
                className="bg-transparent text-ink text-sm placeholder:text-ink-faint focus:outline-none flex-1 min-w-0"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-line rounded-2xl overflow-hidden shadow-lift">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectLocation(s)}
                    className="w-full text-left px-3 py-2.5 text-sm text-ink-soft hover:bg-sand hover:text-ink transition-colors border-b border-line last:border-b-0 flex items-start gap-2"
                  >
                    <MapPin size={12} className="text-ink-faint mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={useCurrentLocation} className="flex items-center gap-1.5 text-sm font-semibold text-agave-dark hover:text-agave transition-colors">
              <Locate size={15} /> Use my current location
            </button>
            {locationSaved && <span className="text-agave text-xs font-semibold flex items-center gap-1"><CheckCircle2 size={13} /> Saved</span>}
          </div>

          {locationLabel && (
            <p className="text-ink-soft text-xs mt-3 bg-sand rounded-xl px-3 py-2">
              Current: <span className="text-ink font-semibold">{locationLabel}</span>
            </p>
          )}
        </div>

        {/* Provider */}
        <div className="card rounded-4xl p-5 overflow-hidden relative">
          {!listing && <div className="absolute inset-0 bg-gradient-to-br from-agave-tint/60 to-transparent pointer-events-none" />}
          <div className="relative flex items-start gap-3 mb-4">
            <div className="w-11 h-11 bg-agave rounded-2xl grid place-items-center flex-shrink-0 shadow-agave"><Store size={19} className="text-white" /></div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Offer your services</h2>
              <p className="text-ink-soft text-sm mt-0.5">List your trade on Manos, set your hours, and get booked by customers and the assistant.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="relative flex items-center gap-2 text-ink-faint text-sm"><Loader size={14} className="animate-spin" /> Checking…</div>
          ) : listing ? (
            <div className="relative flex items-center gap-3 flex-wrap">
              <span className="w-2 h-2 bg-agave rounded-full" />
              <span className="text-ink-soft text-sm">Active listing — <strong className="text-ink">{listing.name}</strong></span>
              <button onClick={() => navigate('/provider')} className="btn-agave ml-auto px-4 py-2 text-sm">
                Open dashboard <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              {error && <p className="relative text-coral text-sm mb-3 bg-coral-tint rounded-xl px-3 py-2">{error}</p>}
              <button onClick={becomeProvider} disabled={becoming} className="relative btn-agave px-5 py-3 text-sm">
                {becoming ? <><Loader size={15} className="animate-spin" /> Creating your listing…</> : <><Store size={16} /> List my business — free</>}
              </button>
            </>
          )}
        </div>

        <div className="flex justify-center mt-8 opacity-60"><Logo size={22} /></div>
      </div>
    </div>
  );
}
