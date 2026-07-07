import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BookingStatusStepper from '../components/BookingStatusStepper';
import ProviderMap from '../components/ProviderMap';
import type { Booking, Provider } from '../lib/types';
import { Calendar, MapPin, FileText, DollarSign } from 'lucide-react';

type BookingStatus = Booking['status'];
type FullBooking = Booking & { provider: Provider };


export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<FullBooking | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadBooking() {
    if (!id) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, provider:providers(id, name, category, photo_url, price_from, rating, review_count, emergency, available, lat, lng, city, languages, description, created_at)')
      .eq('id', id)
      .maybeSingle();
    setBooking(data as FullBooking);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    loadBooking();
  }, [user, authLoading, id]);

  async function simulateStatus(newStatus: BookingStatus) {
    if (!id) return;
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    loadBooking();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Booking not found.
      </div>
    );
  }

  const p = booking.provider;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/bookings')} className="text-zinc-500 hover:text-white text-sm mb-6 transition-colors">
          ← All bookings
        </button>

        {/* Provider summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex gap-4 items-start mb-4">
            <img
              src={p?.photo_url ?? `https://i.pravatar.cc/150?u=${booking.provider_id}`}
              alt={p?.name}
              className="w-14 h-14 rounded-xl object-cover bg-zinc-800 flex-shrink-0"
            />
            <div>
              <h1 className="text-white text-lg font-bold">{p?.name}</h1>
              <p className="text-zinc-500 text-sm capitalize">{p?.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-zinc-500 text-xs">When</p>
                <p className="text-white">{new Date(booking.scheduled_for).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-zinc-500 text-xs">Price</p>
                <p className="text-white">£{booking.price ?? p?.price_from}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 col-span-2">
              <MapPin size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-zinc-500 text-xs">Address</p>
                <p className="text-white">{booking.address}</p>
              </div>
            </div>
            {booking.notes && (
              <div className="flex items-start gap-2 col-span-2">
                <FileText size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-500 text-xs">Notes</p>
                  <p className="text-white">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status stepper */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <h2 className="text-white font-semibold mb-5">Booking status</h2>
          <BookingStatusStepper status={booking.status} />
        </div>

        {/* Map */}
        {p && (
          <div className="mb-4">
            <ProviderMap providers={[p]} height="200px" />
          </div>
        )}

        {/* Customer actions */}
        {booking.status === 'pending' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm mb-3">Waiting for the provider to accept your booking.</p>
            <button
              onClick={() => simulateStatus('cancelled')}
              className="text-xs px-4 py-2 rounded-xl font-medium transition-all border bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-900/40"
            >
              Cancel booking
            </button>
          </div>
        )}
        {booking.status === 'in_progress' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm mb-3">Is the job finished?</p>
            <button
              onClick={() => simulateStatus('completed')}
              className="text-xs px-4 py-2 rounded-xl font-medium transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Mark as complete
            </button>
          </div>
        )}
        {booking.status === 'accepted' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm">Your booking has been accepted. The provider will be on their way soon.</p>
          </div>
        )}
        {booking.status === 'on_the_way' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm">The provider is on their way to you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
