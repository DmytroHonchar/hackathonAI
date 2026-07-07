import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProviderMap from '../components/ProviderMap';
import BookingModal from '../components/BookingModal';
import type { Provider } from '../lib/types';
import { Star, MapPin, Globe, Zap } from 'lucide-react';

export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('providers').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setProvider(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Provider not found.
      </div>
    );
  }

  const CATEGORY_LABELS: Record<string, string> = {
    plumber: 'Plumber',
    electrician: 'Electrician',
    cleaner: 'Cleaner',
  };

  const extraLanguages = provider.languages.filter((l) => l !== 'English');

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white text-sm mb-6 transition-colors">
          ← Back
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 flex gap-5 items-start">
            <img
              src={provider.photo_url ?? `https://i.pravatar.cc/150?u=${provider.id}`}
              alt={provider.name}
              className="w-20 h-20 rounded-2xl object-cover bg-zinc-800 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-white text-2xl font-bold">{provider.name}</h1>
                {provider.emergency && (
                  <span className="flex items-center gap-1 bg-red-900/60 text-red-400 text-xs px-2.5 py-1 rounded-full font-medium">
                    <Zap size={11} /> Emergency
                  </span>
                )}
              </div>
              <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full capitalize">
                {CATEGORY_LABELS[provider.category]}
              </span>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Star size={14} fill="currentColor" />
                  {Number(provider.rating).toFixed(1)}
                  <span className="text-zinc-500 font-normal">({provider.review_count} reviews)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-5">
            {/* Description */}
            <p className="text-zinc-300 leading-relaxed">{provider.description}</p>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">From price</p>
                <p className="text-white font-semibold text-lg">£{provider.price_from}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-1">City</p>
                <p className="text-white font-medium flex items-center gap-1">
                  <MapPin size={13} className="text-zinc-500" />{provider.city}
                </p>
              </div>
            </div>

            {extraLanguages.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-zinc-500" />
                <span className="text-zinc-400 text-sm">Also speaks:</span>
                {extraLanguages.map((l) => (
                  <span key={l} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{l}</span>
                ))}
              </div>
            )}

            {/* Map */}
            <ProviderMap
              providers={[provider]}
              height="220px"
            />

            {/* Book button */}
            <button
              onClick={() => { if (!user) { navigate('/login'); return; } setShowBooking(true); }}
              className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold py-3.5 rounded-xl transition-colors text-base"
            >
              Book {provider.name}
            </button>
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal
          provider={provider}
          onClose={() => setShowBooking(false)}
          onBooked={(id) => { setShowBooking(false); navigate(`/bookings/${id}`); }}
        />
      )}
    </div>
  );
}
