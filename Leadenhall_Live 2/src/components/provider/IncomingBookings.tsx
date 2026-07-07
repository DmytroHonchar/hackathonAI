import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../lib/types';
import { Calendar, MapPin, FileText, RefreshCw, User } from 'lucide-react';

type BookingStatus = Booking['status'];

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:     'bg-zinc-800 text-zinc-300 border-zinc-700',
  accepted:    'bg-blue-900/40 text-blue-400 border-blue-900/40',
  on_the_way:  'bg-yellow-900/40 text-yellow-400 border-yellow-900/40',
  in_progress: 'bg-amber-900/40 text-amber-400 border-amber-900/40',
  completed:   'bg-emerald-900/40 text-emerald-400 border-emerald-900/40',
  cancelled:   'bg-red-900/40 text-red-400 border-red-900/40',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:     'Pending',
  accepted:    'Accepted',
  on_the_way:  'On the way',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

interface ActionDef {
  label: string;
  next: BookingStatus;
  style: string;
}

const ACTIONS: Partial<Record<BookingStatus, ActionDef[]>> = {
  pending: [
    { label: 'Accept',  next: 'accepted',   style: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
    { label: 'Decline', next: 'cancelled',  style: 'bg-zinc-700 hover:bg-red-900/60 text-zinc-300 hover:text-red-300' },
  ],
  accepted:    [{ label: 'On the way',  next: 'on_the_way',  style: 'bg-blue-600 hover:bg-blue-500 text-white' }],
  on_the_way:  [{ label: 'Start job',   next: 'in_progress', style: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold' }],
  in_progress: [{ label: 'Mark complete', next: 'completed', style: 'bg-emerald-600 hover:bg-emerald-500 text-white' }],
};

interface Props {
  listingId: string;
}

export default function IncomingBookings({ listingId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', listingId)
      .order('created_at', { ascending: false });
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [listingId]);

  async function updateStatus(bookingId: string, status: BookingStatus) {
    setUpdating(bookingId);
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
    setUpdating(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-zinc-400 font-medium mb-1">No bookings yet</p>
        <p className="text-zinc-600 text-sm">Bookings from customers and the AI dispatcher will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-zinc-500 text-sm">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
        <button onClick={load} className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs transition-colors">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {bookings.map((b) => {
        const actions = ACTIONS[b.status] ?? [];
        const customerLabel = b.user_id ? `Customer ${b.user_id.slice(0, 6)}` : 'Customer';
        return (
          <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{customerLabel}</p>
                  {b.price != null && (
                    <p className="text-zinc-500 text-xs">£{b.price}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[b.status]}`}>
                  {STATUS_LABELS[b.status]}
                </span>
                <p className="text-zinc-600 text-xs">
                  {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mb-3 text-sm text-zinc-400">
              <div className="flex items-start gap-2">
                <Calendar size={13} className="mt-0.5 flex-shrink-0 text-zinc-600" />
                <span>{new Date(b.scheduled_for).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 flex-shrink-0 text-zinc-600" />
                <span>{b.address}</span>
              </div>
              {b.notes && (
                <div className="flex items-start gap-2">
                  <FileText size={13} className="mt-0.5 flex-shrink-0 text-zinc-600" />
                  <span className="text-zinc-500">{b.notes}</span>
                </div>
              )}
            </div>

            {actions.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {actions.map((action) => (
                  <button
                    key={action.next}
                    onClick={() => updateStatus(b.id, action.next)}
                    disabled={updating === b.id}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 ${action.style}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
