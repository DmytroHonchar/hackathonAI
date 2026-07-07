import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProviderContext } from '../context/ProviderContext';
import { supabase } from '../lib/supabase';
import ListingEditor from '../components/provider/ListingEditor';
import IncomingBookings from '../components/provider/IncomingBookings';
import { Store, FileEdit, Radio, CalendarDays, Loader, Eye } from 'lucide-react';
import { categoryMeta } from '../lib/categories';

type Tab = 'listing' | 'availability' | 'bookings';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'bookings',     label: 'Bookings',   icon: CalendarDays },
  { id: 'listing',      label: 'My listing', icon: FileEdit },
  { id: 'availability', label: 'Availability', icon: Radio },
];

export default function ProviderDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { listing, isLoading, reload } = useProviderContext();
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-agave/25 border-t-agave rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card rounded-4xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 bg-agave-tint rounded-3xl grid place-items-center mx-auto mb-4"><Store size={28} className="text-agave-dark" /></div>
          <h2 className="font-display text-2xl font-semibold text-ink mb-2">Start earning on Manos</h2>
          <p className="text-ink-soft text-sm mb-6">Create your listing to receive bookings from customers and the AI assistant.</p>
          <Link to="/settings" className="btn-agave px-5 py-3 text-sm">List my business</Link>
        </div>
      </div>
    );
  }

  const cat = categoryMeta(listing.category);
  const CatIcon = cat.icon;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card rounded-4xl p-5 mb-5 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img src={listing.photo_url ?? `https://i.pravatar.cc/160?u=${listing.id}`} alt="" className="w-14 h-14 rounded-2xl object-cover bg-sand" />
            <span className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full grid place-items-center ring-2 ring-surface ${cat.tintBg}`}><CatIcon size={13} className={cat.tintText} /></span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-semibold text-ink truncate">{listing.name}</h1>
            <p className={`text-sm font-semibold ${cat.tintText}`}>{cat.label}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`chip ${listing.available ? 'bg-agave-tint text-agave-dark' : 'bg-sand text-ink-faint'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${listing.available ? 'bg-agave' : 'bg-ink-faint'}`} />
              {listing.available ? 'Live' : 'Paused'}
            </span>
            <Link to={`/provider/${listing.id}`} className="text-xs font-semibold text-ink-soft hover:text-clay flex items-center gap-1"><Eye size={13} /> View public</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-sand rounded-full p-1 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === id ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'listing' && <ListingEditor listing={listing} onSaved={reload} />}

        {activeTab === 'availability' && (
          <div className="space-y-4">
            <ToggleCard
              title="Listing live"
              description="When on, your listing appears in Explore, search and AI results. Turn off to pause without deleting."
              value={listing.available}
              disabled={toggling === 'available'}
              onChange={(v) => setFlag('available', v)}
              activeLabel="Live — customers can find and book you"
              inactiveLabel="Paused — hidden from all results"
              activeColor="agave"
            />
            <ToggleCard
              title="Emergency / 24-hour service"
              description="Available for urgent call-outs. Customers filtering by emergency see you first."
              value={listing.emergency}
              disabled={toggling === 'emergency'}
              onChange={(v) => setFlag('emergency', v)}
              activeLabel="Emergency calls accepted"
              inactiveLabel="Standard hours only"
              activeColor="coral"
            />
          </div>
        )}

        {activeTab === 'bookings' && <IncomingBookings listingId={listing.id} />}
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
  activeColor: 'agave' | 'coral';
}) {
  const track = value ? (activeColor === 'agave' ? 'bg-agave' : 'bg-coral') : 'bg-line-strong';
  const label = value ? (activeColor === 'agave' ? 'text-agave-dark' : 'text-coral') : 'text-ink-faint';
  return (
    <div className="card rounded-4xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-ink mb-1">{title}</h3>
          <p className="text-ink-soft text-sm">{description}</p>
          <p className={`mt-3 text-sm font-semibold ${label}`}>{value ? activeLabel : inactiveLabel}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          disabled={disabled}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 disabled:opacity-60 ${track}`}
        >
          {disabled && <Loader size={11} className="absolute left-1/2 -translate-x-1/2 text-white animate-spin" />}
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-8' : 'translate-x-1'} ${disabled ? 'opacity-0' : ''}`} />
        </button>
      </div>
    </div>
  );
}
