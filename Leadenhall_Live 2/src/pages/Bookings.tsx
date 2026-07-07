import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Booking, Provider } from '../lib/types';
import { Calendar, MapPin, ChevronRight, CalendarCheck, Sparkles } from 'lucide-react';
import { categoryMeta } from '../lib/categories';

type FullBooking = Booking & { provider: Provider };
type BookingStatus = Booking['status'];

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:     'bg-sand text-ink-soft',
  accepted:    'bg-agave-tint text-agave-dark',
  on_the_way:  'bg-marigold-tint text-[#9a6d12]',
  in_progress: 'bg-clay-tint text-clay-dark',
  completed:   'bg-agave text-white',
  cancelled:   'bg-coral-tint text-coral',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending', accepted: 'Accepted', on_the_way: 'On the way',
  in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
};

const ACTIVE: BookingStatus[] = ['pending', 'accepted', 'on_the_way', 'in_progress'];

export default function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<FullBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    supabase
      .from('bookings')
      .select('*, provider:providers(id, name, category, photo_url, price_from, rating, review_count, emergency, available, lat, lng, city, languages, description, created_at)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings((data as FullBooking[]) ?? []);
        setLoading(false);
      });
  }, [user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-clay/25 border-t-clay rounded-full animate-spin" />
      </div>
    );
  }

  const active = bookings.filter((b) => ACTIVE.includes(b.status));
  const past = bookings.filter((b) => !ACTIVE.includes(b.status));
  const list = tab === 'active' ? active : past;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-ink mb-1">Your bookings</h1>
        <p className="text-ink-soft text-sm mb-6">Track jobs and chat with your pros.</p>

        {bookings.length === 0 ? (
          <div className="card rounded-4xl flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-clay-tint grid place-items-center mb-4"><CalendarCheck size={28} className="text-clay" /></div>
            <p className="font-display text-xl font-semibold text-ink mb-1">No bookings yet</p>
            <p className="text-ink-soft text-sm mb-6 max-w-xs">When you book a pro it’ll show up here. Ready to find someone?</p>
            <div className="flex gap-2">
              <Link to="/browse" className="btn-ghost px-5 py-2.5 text-sm">Explore pros</Link>
              <Link to="/app" className="btn-clay px-5 py-2.5 text-sm"><Sparkles size={15} /> Ask assistant</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="inline-flex bg-sand rounded-full p-1 mb-5">
              {(['active', 'past'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                    tab === t ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {t} {t === 'active' ? `(${active.length})` : `(${past.length})`}
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <div className="text-center py-14 text-ink-soft text-sm">Nothing {tab} right now.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {list.map((b) => {
                  const cat = categoryMeta(b.provider?.category ?? '');
                  return (
                    <Link
                      key={b.id}
                      to={`/bookings/${b.id}`}
                      className="group card rounded-3xl p-4 flex gap-4 items-center hover:shadow-card hover:-translate-y-0.5 transition-all"
                    >
                      <img
                        src={b.provider?.photo_url ?? `https://i.pravatar.cc/120?u=${b.provider_id}`}
                        alt={b.provider?.name}
                        className="w-14 h-14 rounded-2xl object-cover bg-sand flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-ink font-semibold text-[15px] truncate">{b.provider?.name}</h3>
                          <span className={`chip flex-shrink-0 ${STATUS_STYLES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                        </div>
                        <p className={`text-xs font-semibold mt-0.5 ${cat.tintText}`}>{cat.label}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-soft">
                          <span className="flex items-center gap-1"><Calendar size={12} className="text-ink-faint" />{new Date(b.scheduled_for).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          <span className="flex items-center gap-1 truncate"><MapPin size={12} className="text-ink-faint" /><span className="truncate">{b.address}</span></span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-ink-faint group-hover:text-clay group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
