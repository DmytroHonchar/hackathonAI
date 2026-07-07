import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProviderMap from '../components/ProviderMap';
import BookingModal from '../components/BookingModal';
import type { Provider } from '../lib/types';
import { Star, MapPin, Globe, Zap, BadgeCheck, ShieldCheck, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { categoryMeta } from '../lib/categories';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-clay/25 border-t-clay rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center gap-3 px-4">
        <p className="text-ink font-semibold">We couldn’t find that pro.</p>
        <button onClick={() => navigate('/browse')} className="btn-clay px-5 py-2.5 text-sm">Back to Explore</button>
      </div>
    );
  }

  const cat = categoryMeta(provider.category);
  const CatIcon = cat.icon;
  const extraLanguages = provider.languages.filter((l) => l !== 'English');
  const gallery = [provider.photo_url, ...(provider.gallery ?? [])].filter(Boolean) as string[];
  const services = provider.services ?? [];

  function book() {
    if (!user) { navigate('/login'); return; }
    setShowBooking(true);
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-12">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm font-medium mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Header card */}
            <div className="card p-6 rounded-4xl">
              <div className="flex gap-4 items-start">
                <div className="relative flex-shrink-0">
                  <img src={provider.photo_url ?? `https://i.pravatar.cc/200?u=${provider.id}`} alt={provider.name} className="w-24 h-24 rounded-3xl object-cover bg-sand" />
                  <span className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl grid place-items-center ring-2 ring-surface ${cat.tintBg}`}>
                    <CatIcon size={16} className={cat.tintText} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-3xl font-semibold text-ink leading-tight">{provider.name}</h1>
                    {provider.emergency && <span className="chip bg-coral-tint text-coral"><Zap size={12} /> 24h</span>}
                  </div>
                  <p className={`font-semibold text-sm mt-1 ${cat.tintText}`}>{cat.label}</p>
                  <div className="flex items-center gap-4 mt-2.5 text-sm flex-wrap">
                    <span className="flex items-center gap-1 text-ink font-semibold">
                      <Star size={15} className="text-marigold fill-marigold" />
                      {Number(provider.rating).toFixed(1)}
                      <span className="text-ink-faint font-normal">({provider.review_count} reviews)</span>
                    </span>
                    <span className="flex items-center gap-1 text-ink-soft"><MapPin size={14} className="text-ink-faint" />{provider.city}</span>
                    <span className="flex items-center gap-1 text-agave-dark font-medium"><BadgeCheck size={15} className="text-agave" />Verified</span>
                  </div>
                </div>
              </div>
              <p className="text-ink-soft leading-relaxed mt-4">{provider.description || 'This pro hasn’t added a description yet.'}</p>
            </div>

            {/* Gallery */}
            {gallery.length > 1 && (
              <div className="card p-5 rounded-4xl">
                <h2 className="font-display text-lg font-semibold text-ink mb-3">Recent work</h2>
                <div className="grid grid-cols-3 gap-2.5">
                  {gallery.slice(0, 6).map((src, i) => (
                    <img key={i} src={src} alt="" className="aspect-square rounded-2xl object-cover bg-sand" />
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="card p-5 rounded-4xl">
                <h2 className="font-display text-lg font-semibold text-ink mb-3">What they do</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 bg-sand text-ink-soft text-sm font-medium px-3 py-1.5 rounded-full">
                      <Check size={14} className="text-agave" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trust */}
            <div className="card p-5 rounded-4xl grid sm:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, t: 'ID verified', d: 'Identity confirmed' },
                { icon: BadgeCheck, t: 'Secure pay', d: 'Protected booking' },
                { icon: Star, t: `${provider.review_count} reviews`, d: 'From real customers' },
              ].map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.t} className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-agave-tint grid place-items-center flex-shrink-0"><Icon size={18} className="text-agave-dark" /></span>
                    <div><p className="text-ink font-semibold text-sm">{v.t}</p><p className="text-ink-faint text-xs">{v.d}</p></div>
                  </div>
                );
              })}
            </div>

            {/* Map */}
            <div className="card p-5 rounded-4xl">
              <h2 className="font-display text-lg font-semibold text-ink mb-3">Coverage area</h2>
              <ProviderMap providers={[provider]} height="240px" />
            </div>
          </div>

          {/* Right column — booking (sticky on desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 card p-6 rounded-4xl">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-ink-faint text-sm">from</span>
                <span className="font-display text-4xl font-semibold text-ink">£{provider.price_from}</span>
                <span className="text-ink-faint text-sm">/ call-out</span>
              </div>
              {provider.distance_km != null && (
                <p className="text-ink-soft text-sm mb-4 flex items-center gap-1"><MapPin size={14} className="text-clay" />{Number(provider.distance_km).toFixed(1)} km from you</p>
              )}
              {extraLanguages.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Globe size={14} className="text-ink-faint" />
                  {['English', ...extraLanguages].map((l) => (
                    <span key={l} className="text-xs font-medium bg-sand text-ink-soft px-2.5 py-1 rounded-full">{l}</span>
                  ))}
                </div>
              )}
              <button onClick={book} className="btn-clay w-full py-3.5 text-base mb-3">Book {provider.name.split(' ')[0]}</button>
              <button onClick={() => navigate('/app', { state: { initialMessage: `Tell me more about ${provider.name}` } })} className="btn-ghost w-full py-3 text-sm">
                <Sparkles size={15} className="text-clay" /> Ask the assistant
              </button>
              <p className="text-ink-faint text-xs text-center mt-3">Free to book · Pay after the job</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky book bar */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-canvas/95 backdrop-blur-lg border-t border-line px-4 py-3 flex items-center gap-3">
        <div>
          <p className="text-ink-faint text-[11px] leading-none">from</p>
          <p className="font-display text-xl font-semibold text-ink">£{provider.price_from}</p>
        </div>
        <button onClick={book} className="btn-clay flex-1 py-3 text-sm">Book {provider.name.split(' ')[0]}</button>
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
