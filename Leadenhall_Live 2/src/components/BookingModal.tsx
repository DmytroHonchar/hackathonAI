import { useState, useMemo, useRef } from 'react';
import { X, MapPin, Search, Star, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Provider } from '../lib/types';
import { categoryMeta } from '../lib/categories';

interface BookingModalProps {
  provider: Provider;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}

function generateDateOptions() {
  const options: { value: string; day: string; date: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const day = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-GB', { weekday: 'short' });
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    options.push({ value, day, date });
  }
  return options;
}

const TIME_SLOTS = [
  { value: '08:00', label: '8 AM' }, { value: '09:00', label: '9 AM' },
  { value: '10:00', label: '10 AM' }, { value: '11:00', label: '11 AM' },
  { value: '12:00', label: '12 PM' }, { value: '13:00', label: '1 PM' },
  { value: '14:00', label: '2 PM' }, { value: '15:00', label: '3 PM' },
  { value: '16:00', label: '4 PM' }, { value: '17:00', label: '5 PM' },
  { value: '18:00', label: '6 PM' },
];

export default function BookingModal({ provider, onClose, onBooked }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateOptions = useMemo(generateDateOptions, []);
  const cat = categoryMeta(provider.category);

  function handleAddressInput(value: string) {
    setAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setAddressSuggestions([]);
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
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  function selectAddress(suggestion: { display_name: string }) {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedDate || !selectedTime || !address) {
      setError('Please pick a date, a time and enter your address.');
      return;
    }
    setLoading(true);
    try {
      const scheduledFor = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      const { data, error: dbErr } = await supabase
        .from('bookings')
        .insert({
          provider_id: provider.id,
          scheduled_for: scheduledFor,
          address,
          notes: notes || null,
          price: provider.price_from,
          status: 'pending',
        })
        .select('id')
        .single();
      if (dbErr) throw new Error(dbErr.message);
      onBooked(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="bg-canvas w-full sm:max-w-md rounded-t-4xl sm:rounded-4xl shadow-lift max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-canvas/95 backdrop-blur border-b border-line px-5 py-4 flex items-center gap-3 z-10">
          <img src={provider.photo_url ?? `https://i.pravatar.cc/120?u=${provider.id}`} alt="" className="w-11 h-11 rounded-2xl object-cover bg-sand" />
          <div className="flex-1 min-w-0">
            <h2 className="text-ink font-semibold flex items-center gap-1 truncate">
              {provider.name} <BadgeCheck size={14} className="text-agave flex-shrink-0" />
            </h2>
            <p className="text-ink-soft text-xs flex items-center gap-2">
              <span className={cat.tintText + ' font-semibold'}>{cat.label}</span>
              <span className="flex items-center gap-0.5"><Star size={11} className="text-marigold fill-marigold" />{Number(provider.rating).toFixed(1)}</span>
              · from £{provider.price_from}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-sand grid place-items-center text-ink-soft hover:text-ink transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {/* Date */}
          <div>
            <label className="text-ink font-semibold text-sm mb-2.5 block">Pick a day</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDate(d.value)}
                  className={`flex-shrink-0 w-16 py-2.5 rounded-2xl border text-center transition-all ${
                    selectedDate === d.value ? 'bg-clay text-white border-clay shadow-clay' : 'bg-surface border-line hover:border-line-strong'
                  }`}
                >
                  <span className={`block text-[11px] font-semibold ${selectedDate === d.value ? 'text-white/80' : 'text-ink-faint'}`}>{d.day}</span>
                  <span className={`block text-sm font-bold ${selectedDate === d.value ? 'text-white' : 'text-ink'}`}>{d.date}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="text-ink font-semibold text-sm mb-2.5 block">Choose a time</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedTime(t.value)}
                  className={`py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                    selectedTime === t.value ? 'bg-clay text-white border-clay shadow-clay' : 'bg-surface border-line text-ink-soft hover:border-line-strong'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-ink font-semibold text-sm mb-2.5 block">Where’s the job?</label>
            <div className="relative">
              <div className="flex items-center gap-2 field !py-3">
                <Search size={15} className="text-ink-faint flex-shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search your address…"
                  className="bg-transparent text-ink text-sm placeholder:text-ink-faint focus:outline-none flex-1 min-w-0"
                  required
                />
              </div>
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-line rounded-2xl overflow-hidden shadow-lift max-h-48 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectAddress(s)}
                      className="w-full text-left px-3 py-2.5 text-sm text-ink-soft hover:bg-sand hover:text-ink transition-colors border-b border-line last:border-b-0 flex items-start gap-2"
                    >
                      <MapPin size={12} className="text-ink-faint mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-ink font-semibold text-sm mb-2.5 block">Anything they should know? <span className="text-ink-faint font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. leak under the kitchen sink, access via back door…"
              rows={3}
              className="field resize-none"
            />
          </div>

          {error && <p className="text-coral text-sm bg-coral-tint border border-coral/20 rounded-2xl px-3 py-2.5">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-ink-faint text-xs">Estimated from</p>
              <p className="text-ink font-display text-2xl font-semibold">£{provider.price_from}</p>
            </div>
            <button type="submit" disabled={loading} className="btn-clay flex-1 py-3.5 text-base">
              {loading ? 'Booking…' : <>Confirm booking <CheckCircle2 size={18} /></>}
            </button>
          </div>
          <p className="text-ink-faint text-xs text-center -mt-1">You won’t be charged until the job is done.</p>
        </form>
      </div>
    </div>
  );
}
