import { useState, useMemo, useRef } from 'react';
import { X, Calendar, MapPin, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Provider } from '../lib/types';

interface BookingModalProps {
  provider: Provider;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}

function generateDateOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    options.push({ value, label });
  }
  return options;
}

const TIME_SLOTS = [
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
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
          { headers: { 'User-Agent': 'DispatchApp/1.0' } }
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
      setError('Please select a date, time and enter your address.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold">Book {provider.name}</h2>
            <p className="text-zinc-500 text-sm">£{provider.price_from}/call</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <Calendar size={12} />Date & Time
            </label>
            <div className="flex gap-2">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 appearance-none"
                required
              >
                <option value="" disabled>Select date</option>
                {dateOptions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 appearance-none"
                required
              >
                <option value="" disabled>Select time</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <MapPin size={12} />Address
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 focus-within:border-amber-400 rounded-xl px-3 py-2.5 transition-colors">
                <Search size={12} className="text-zinc-500 flex-shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search your address…"
                  className="bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none flex-1 min-w-0"
                  required
                />
              </div>
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectAddress(s)}
                      className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border-b border-zinc-700/50 last:border-b-0 flex items-start gap-2"
                    >
                      <MapPin size={11} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the job…"
              rows={3}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-zinc-600 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
