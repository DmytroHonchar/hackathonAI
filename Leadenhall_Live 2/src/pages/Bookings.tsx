import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Booking, Provider } from '../lib/types';
import { Calendar, MapPin } from 'lucide-react';

type FullBooking = Booking & { provider: Provider };

type BookingStatus = Booking['status'];

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:     'bg-zinc-800 text-zinc-300',
  accepted:    'bg-blue-900/40 text-blue-400',
  on_the_way:  'bg-yellow-900/40 text-yellow-400',
  in_progress: 'bg-amber-900/40 text-amber-400',
  completed:   'bg-emerald-900/40 text-emerald-400',
  cancelled:   'bg-red-900/40 text-red-400',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:     'Pending',
  accepted:    'Accepted',
  on_the_way:  'On the way',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

export default function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<FullBooking[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-white text-2xl font-bold mb-6">Your bookings</h1>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-400 font-medium mb-2">No bookings yet</p>
            <p className="text-zinc-600 text-sm mb-6">Head to the concierge to find and book a pro.</p>
            <Link to="/app" className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
              Open concierge
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <Link
                key={b.id}
                to={`/bookings/${b.id}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex gap-4 items-start transition-colors"
              >
                <img
                  src={b.provider?.photo_url ?? `https://i.pravatar.cc/150?u=${b.provider_id}`}
                  alt={b.provider?.name}
                  className="w-12 h-12 rounded-xl object-cover bg-zinc-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-semibold text-sm">{b.provider?.name}</h3>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs capitalize mt-0.5">{b.provider?.category}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(b.scheduled_for).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} />
                      <span className="truncate">{b.address}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
