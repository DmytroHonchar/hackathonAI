import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BookingStatusStepper from '../components/BookingStatusStepper';
import ProviderMap from '../components/ProviderMap';
import type { Booking, Provider } from '../lib/types';
import { Calendar, MapPin, FileText, ArrowLeft, BadgeCheck, Star, MessageSquare, Sparkles } from 'lucide-react';
import { categoryMeta } from '../lib/categories';

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
  }, [user, authLoading, id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function simulateStatus(newStatus: BookingStatus) {
    if (!id) return;
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    loadBooking();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-clay/25 border-t-clay rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-ink font-semibold">Booking not found.</p>
        <button onClick={() => navigate('/bookings')} className="btn-clay px-5 py-2.5 text-sm">All bookings</button>
      </div>
    );
  }

  const p = booking.provider;
  const cat = categoryMeta(p?.category ?? '');

  const NOTE: Partial<Record<BookingStatus, string>> = {
    accepted: 'Your booking is accepted. Your pro will be on their way at the scheduled time.',
    on_the_way: 'Your pro is on their way to you now.',
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/bookings')} className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm font-medium mb-5 transition-colors">
          <ArrowLeft size={16} /> All bookings
        </button>

        {/* Provider summary */}
        <div className="card rounded-4xl p-6 mb-4">
          <div className="flex gap-4 items-center mb-5">
            <img src={p?.photo_url ?? `https://i.pravatar.cc/160?u=${booking.provider_id}`} alt={p?.name} className="w-16 h-16 rounded-3xl object-cover bg-sand flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-semibold text-ink flex items-center gap-1.5">{p?.name} <BadgeCheck size={16} className="text-agave" /></h1>
              <p className="text-sm flex items-center gap-2">
                <span className={`font-semibold ${cat.tintText}`}>{cat.label}</span>
                <span className="flex items-center gap-0.5 text-ink-soft"><Star size={12} className="text-marigold fill-marigold" />{Number(p?.rating).toFixed(1)}</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/app', { state: { initialMessage: `Message ${p?.name} about my booking` } })}
              className="w-11 h-11 rounded-2xl bg-agave-tint grid place-items-center text-agave-dark hover:bg-agave hover:text-white transition-all flex-shrink-0"
              aria-label="Message pro"
            >
              <MessageSquare size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-sand rounded-2xl p-3.5">
              <p className="text-ink-faint text-xs flex items-center gap-1 mb-1"><Calendar size={12} /> When</p>
              <p className="text-ink font-semibold text-sm">{new Date(booking.scheduled_for).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <div className="bg-sand rounded-2xl p-3.5">
              <p className="text-ink-faint text-xs mb-1">Price</p>
              <p className="text-ink font-semibold text-sm">£{booking.price ?? p?.price_from}</p>
            </div>
            <div className="bg-sand rounded-2xl p-3.5 col-span-2">
              <p className="text-ink-faint text-xs flex items-center gap-1 mb-1"><MapPin size={12} /> Address</p>
              <p className="text-ink font-semibold text-sm">{booking.address}</p>
            </div>
            {booking.notes && (
              <div className="bg-sand rounded-2xl p-3.5 col-span-2">
                <p className="text-ink-faint text-xs flex items-center gap-1 mb-1"><FileText size={12} /> Notes</p>
                <p className="text-ink text-sm">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="card rounded-4xl p-6 mb-4">
          <h2 className="font-display text-lg font-semibold text-ink mb-5">Job status</h2>
          <BookingStatusStepper status={booking.status} />
          {NOTE[booking.status] && <p className="text-ink-soft text-sm mt-5 bg-agave-tint rounded-2xl px-4 py-3">{NOTE[booking.status]}</p>}
        </div>

        {/* Map */}
        {p && (
          <div className="card rounded-4xl p-5 mb-4">
            <ProviderMap providers={[p]} height="200px" />
          </div>
        )}

        {/* Actions */}
        {booking.status === 'pending' && (
          <div className="card rounded-4xl p-6">
            <p className="text-ink-soft text-sm mb-4">Waiting for {p?.name} to accept your booking. You’ll be notified as soon as they do.</p>
            <button onClick={() => simulateStatus('cancelled')} className="btn-ghost px-4 py-2.5 text-sm hover:text-coral hover:border-coral/30">
              Cancel booking
            </button>
          </div>
        )}
        {booking.status === 'in_progress' && (
          <div className="card rounded-4xl p-6">
            <p className="text-ink-soft text-sm mb-4">Is the job finished?</p>
            <button onClick={() => simulateStatus('completed')} className="btn-agave px-5 py-2.5 text-sm">Mark as complete</button>
          </div>
        )}
        {booking.status === 'completed' && (
          <div className="card rounded-4xl p-6 text-center">
            <p className="text-ink font-semibold mb-1">Job complete 🎉</p>
            <p className="text-ink-soft text-sm mb-4">How was {p?.name}? Your review helps neighbours choose with confidence.</p>
            <button onClick={() => navigate('/app', { state: { initialMessage: `I'd like to leave a review for ${p?.name}` } })} className="btn-clay px-5 py-2.5 text-sm">
              <Sparkles size={15} /> Leave a review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
