import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../lib/types';
import { Calendar, MapPin, FileText, RefreshCw, User, CalendarDays } from 'lucide-react';

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

interface ActionDef { label: string; next: BookingStatus; style: string; }

const ACTIONS: Partial<Record<BookingStatus, ActionDef[]>> = {
  pending: [
    { label: 'Accept',  next: 'accepted',   style: 'btn-agave px-4 py-2 text-sm' },
    { label: 'Decline', next: 'cancelled',  style: 'btn-ghost px-4 py-2 text-sm hover:text-coral hover:border-coral/30' },
  ],
  accepted:    [{ label: 'On the way',    next: 'on_the_way',  style: 'btn-clay px-4 py-2 text-sm' }],
  on_the_way:  [{ label: 'Start job',     next: 'in_progress', style: 'btn-clay px-4 py-2 text-sm' }],
  in_progress: [{ label: 'Mark complete', next: 'completed',   style: 'btn-agave px-4 py-2 text-sm' }],
};

interface Props { listingId: string; }

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

  useEffect(() => { load(); }, [listingId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(bookingId: string, status: BookingStatus) {
    setUpdating(bookingId);
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
    setUpdating(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-[3px] border-agave/25 border-t-agave rounded-full animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="card rounded-4xl flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-agave-tint grid place-items-center mb-4"><CalendarDays size={28} className="text-agave-dark" /></div>
        <p className="font-display text-xl font-semibold text-ink mb-1">No bookings yet</p>
        <p className="text-ink-soft text-sm max-w-xs">Requests from customers and the AI assistant will land here. Keep your listing live to get found.</p>
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-ink-soft text-sm">
          <span className="font-semibold text-ink">{bookings.length}</span> total
          {pending > 0 && <span className="ml-2 chip bg-clay-tint text-clay-dark">{pending} new</span>}
        </p>
        <button onClick={load} className="flex items-center gap-1.5 text-ink-faint hover:text-ink text-xs font-semibold transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {bookings.map((b) => {
        const actions = ACTIONS[b.status] ?? [];
        const customerLabel = b.user_id ? `Customer ${b.user_id.slice(0, 6)}` : 'Customer';
        return (
          <div key={b.id} className="card rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 bg-sand rounded-2xl grid place-items-center flex-shrink-0"><User size={16} className="text-ink-soft" /></div>
                <div className="min-w-0">
                  <p className="text-ink text-sm font-semibold truncate">{customerLabel}</p>
                  {b.price != null && <p className="text-ink-faint text-xs">£{b.price}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`chip ${STATUS_STYLES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                <p className="text-ink-faint text-xs">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-3 text-sm text-ink-soft">
              <div className="flex items-start gap-2"><Calendar size={14} className="mt-0.5 flex-shrink-0 text-ink-faint" /><span>{new Date(b.scheduled_for).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</span></div>
              <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-ink-faint" /><span>{b.address}</span></div>
              {b.notes && <div className="flex items-start gap-2"><FileText size={14} className="mt-0.5 flex-shrink-0 text-ink-faint" /><span className="text-ink-faint">{b.notes}</span></div>}
            </div>

            {actions.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {actions.map((action) => (
                  <button key={action.next} onClick={() => updateStatus(b.id, action.next)} disabled={updating === b.id} className={`${action.style} disabled:opacity-50`}>
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
