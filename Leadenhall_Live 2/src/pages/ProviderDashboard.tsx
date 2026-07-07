import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProviderContext } from '../context/ProviderContext';
import { supabase } from '../lib/supabase';
import ListingEditor from '../components/provider/ListingEditor';
import IncomingBookings from '../components/provider/IncomingBookings';
import { LayoutDashboard, FileEdit, Radio, CalendarDays, Loader, Zap } from 'lucide-react';

type Tab = 'listing' | 'availability' | 'bookings';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'listing',      label: 'My Listing',        icon: FileEdit },
  { id: 'availability', label: 'Availability',       icon: Radio },
  { id: 'bookings',     label: 'Incoming Bookings',  icon: CalendarDays },
];

export default function ProviderDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { listing, isLoading, reload } = useProviderContext();
  const [activeTab, setActiveTab] = useState<Tab>('listing');
  const [toggling, setToggling] = useState<'available' | 'emergency' | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  async function setFlag(field: 'available' | 'emergency', value: boolean) {
    if (!listing) return;
    setToggling(field);
    await supabase.from('providers').update({ [field]: value }).eq('id', listing.id);
    await reload();
    setToggling(null);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard size={28} className="text-zinc-600" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Not a provider yet</h2>
          <p className="text-zinc-500 text-sm mb-6">Create your listing to start receiving bookings from customers and the AI dispatcher.</p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Become a provider
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{listing.name}</h1>
            <p className="text-zinc-500 text-sm capitalize">{listing.category} · {listing.available ? 'Live' : 'Paused'}</p>
          </div>
          <div className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            listing.available
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/40'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${listing.available ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            {listing.available ? 'Live' : 'Paused'}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab: My Listing */}
        {activeTab === 'listing' && (
          <ListingEditor listing={listing} onSaved={reload} />
        )}

        {/* Tab: Availability */}
        {activeTab === 'availability' && (
          <div className="space-y-4">
            <ToggleCard
              title="Listing live"
              description="When on, your listing appears in Browse, search results, and is discoverable by the AI dispatcher. Turn off to pause without deleting."
              value={listing.available}
              disabled={toggling === 'available'}
              onChange={(v) => setFlag('available', v)}
              activeLabel="Live — customers can find and book you"
              inactiveLabel="Paused — hidden from all search and AI results"
              activeColor="emerald"
            />
            <ToggleCard
              title="Emergency / 24-hour service"
              description="Marks your listing as available for urgent call-outs. Customers filtering by emergency will see you first."
              value={listing.emergency}
              disabled={toggling === 'emergency'}
              onChange={(v) => setFlag('emergency', v)}
              activeLabel="Emergency calls accepted"
              inactiveLabel="Standard hours only"
              activeColor="amber"
            />
          </div>
        )}

        {/* Tab: Incoming Bookings */}
        {activeTab === 'bookings' && (
          <IncomingBookings listingId={listing.id} />
        )}
      </div>
    </div>
  );
}

function ToggleCard({
  title, description, value, disabled, onChange, activeLabel, inactiveLabel, activeColor,
}: {
  title: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  activeLabel: string;
  inactiveLabel: string;
  activeColor: 'emerald' | 'amber';
}) {
  const track = activeColor === 'emerald' ? 'bg-emerald-500' : 'bg-amber-400';
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-zinc-500 text-sm">{description}</p>
          <p className={`mt-3 text-sm font-medium ${value ? (activeColor === 'emerald' ? 'text-emerald-400' : 'text-amber-400') : 'text-zinc-500'}`}>
            {value ? activeLabel : inactiveLabel}
          </p>
        </div>
        <button
          onClick={() => onChange(!value)}
          disabled={disabled}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 disabled:opacity-60 ${value ? track : 'bg-zinc-700'}`}
        >
          {disabled && <Loader size={10} className="absolute left-1/2 -translate-x-1/2 text-white animate-spin" />}
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-8' : 'translate-x-1'} ${disabled ? 'opacity-0' : ''}`} />
        </button>
      </div>
    </div>
  );
}
