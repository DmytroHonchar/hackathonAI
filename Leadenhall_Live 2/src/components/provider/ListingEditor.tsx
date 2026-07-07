import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { OwnedProvider } from '../../context/ProviderContext';
import ProviderMap from '../ProviderMap';
import { Upload, Link2, X, Plus, Save, Loader, ImageIcon, MapPin, Search } from 'lucide-react';

const CATEGORIES = ['plumber', 'electrician', 'cleaner'] as const;

interface Props {
  listing: OwnedProvider;
  onSaved: () => Promise<void>;
}

export default function ListingEditor({ listing, onSaved }: Props) {
  const { user } = useAuth();

  const [name, setName] = useState(listing.name);
  const [category, setCategory] = useState<typeof CATEGORIES[number]>(listing.category);
  const [description, setDescription] = useState(listing.description);
  const [priceStr, setPriceStr] = useState(String(listing.price_from));
  const [services, setServices] = useState<string[]>(listing.services ?? []);
  const [languages, setLanguages] = useState<string[]>(listing.languages ?? []);
  const [emergency, setEmergency] = useState(listing.emergency);
  const [images, setImages] = useState<string[]>([
    ...(listing.photo_url ? [listing.photo_url] : []),
    ...(listing.gallery ?? []),
  ]);

  // Location state
  const [city, setCity] = useState(listing.city);
  const [lat, setLat] = useState(listing.lat);
  const [lng, setLng] = useState(listing.lng);
  const [locationQuery, setLocationQuery] = useState(listing.city);
  const [geocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [serviceInput, setServiceInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when listing prop changes
  useEffect(() => {
    setName(listing.name);
    setCategory(listing.category);
    setDescription(listing.description);
    setPriceStr(String(listing.price_from));
    setServices(listing.services ?? []);
    setLanguages(listing.languages ?? []);
    setEmergency(listing.emergency);
    setImages([
      ...(listing.photo_url ? [listing.photo_url] : []),
      ...(listing.gallery ?? []),
    ]);
    setCity(listing.city);
    setLat(listing.lat);
    setLng(listing.lng);
    setLocationQuery(listing.city);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  }, [listing.id]);

  function handleLocationInput(value: string) {
    setLocationQuery(value);
    setGeocodeError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setLocationSuggestions([]);
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
        setLocationSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  function selectLocation(suggestion: { display_name: string; lat: string; lon: string }) {
    setLat(parseFloat(suggestion.lat));
    setLng(parseFloat(suggestion.lon));
    setCity(suggestion.display_name.split(',')[0].trim());
    setLocationQuery(suggestion.display_name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    setGeocodeError('');
  }

  async function uploadFile(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('provider-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('provider-photos').getPublicUrl(path);
      setImages((prev) => [...prev, publicUrl]);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function addUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function addTag(list: string[], setList: (v: string[]) => void, val: string) {
    const trimmed = val.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    setSaved(false);

    const photo_url = images[0] ?? null;
    const gallery = images.slice(1);

    const { error } = await supabase
      .from('providers')
      .update({
        name: name.trim(),
        category,
        description: description.trim(),
        price_from: parseFloat(priceStr) || 0,
        services,
        languages,
        emergency,
        photo_url,
        gallery,
        city: city.trim(),
        lat,
        lng,
        embedding: null,
      })
      .eq('id', listing.id);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-providers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider_id: listing.id }),
    }).catch(() => {});

    await onSaved();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Preview pin uses current (possibly unsaved) lat/lng
  const previewPin = { id: listing.id, name: name || listing.name, lat, lng, price_from: parseFloat(priceStr) || 0, rating: listing.rating };

  return (
    <div className="space-y-6">
      {/* Images */}
      <section>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Photos</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover rounded-xl bg-zinc-800" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-amber-400 text-zinc-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  Primary
                </span>
              )}
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-zinc-950/80 hover:bg-red-900/80 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <div className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-700">
              <ImageIcon size={20} className="text-zinc-600" />
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            Upload photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex-1 flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2">
              <Link2 size={13} className="text-zinc-500 flex-shrink-0" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                placeholder="Paste image URL…"
                className="bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none flex-1 min-w-0"
              />
            </div>
            <button onClick={addUrl} className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-xl transition-colors flex-shrink-0">Add</button>
          </div>
        </div>
      </section>

      {/* Core fields */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5">Business name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-400/60 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-400/60 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none transition-colors appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-zinc-400 text-xs font-medium mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-400/60 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none transition-colors resize-none"
            placeholder="Describe your services, experience, and coverage area…"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5">Starting price (£)</label>
          <input
            type="number"
            min="0"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-400/60 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="block text-zinc-400 text-xs font-medium">Emergency / 24h</label>
          <button
            onClick={() => setEmergency((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emergency ? 'bg-amber-400' : 'bg-zinc-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emergency ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-xs text-zinc-500">{emergency ? 'Yes' : 'No'}</span>
        </div>
      </section>

      {/* Location */}
      <section className="relative z-[1000]">
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MapPin size={12} /> Location
        </h3>
        <div className="space-y-3">
          {/* Address lookup with autocomplete */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 focus-within:border-amber-400/60 rounded-xl px-3 py-2.5 transition-colors">
              <Search size={13} className="text-zinc-500 flex-shrink-0" />
              <input
                value={locationQuery}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search address, city or postcode…"
                className="bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none flex-1 min-w-0"
              />
              {geocoding && <Loader size={13} className="text-zinc-400 animate-spin" />}
            </div>

            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
                {locationSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectLocation(s)}
                    className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border-b border-zinc-700/50 last:border-b-0 flex items-start gap-2"
                  >
                    <MapPin size={12} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {geocodeError && (
            <p className="text-amber-400 text-xs flex items-start gap-1.5">
              <span className="mt-0.5">⚠</span> {geocodeError}
            </p>
          )}

          {city && (
            <p className="text-zinc-400 text-xs">
              Selected: <span className="text-white font-medium">{city}</span> ({lat.toFixed(4)}, {lng.toFixed(4)})
            </p>
          )}

          {/* Map preview */}
          <ProviderMap providers={[previewPin]} height="200px" />
          <p className="text-zinc-600 text-xs">This pin shows where your listing appears on the customer map.</p>
        </div>
      </section>

      {/* Services */}
      <TagInput
        label="Services offered"
        tags={services}
        input={serviceInput}
        setInput={setServiceInput}
        onAdd={() => { addTag(services, setServices, serviceInput); setServiceInput(''); }}
        onRemove={(i) => setServices(services.filter((_, idx) => idx !== i))}
        placeholder="e.g. boiler repair"
      />

      {/* Languages */}
      <TagInput
        label="Languages spoken"
        tags={languages}
        input={languageInput}
        setInput={setLanguageInput}
        onAdd={() => { addTag(languages, setLanguages, languageInput); setLanguageInput(''); }}
        onRemove={(i) => setLanguages(languages.filter((_, idx) => idx !== i))}
        placeholder="e.g. Polish"
      />

      {/* Save */}
      {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950'
        }`}
      >
        {saving ? <><Loader size={14} className="animate-spin" /> Saving…</> : saved ? '✓ Saved' : <><Save size={14} /> Save listing</>}
      </button>
    </div>
  );
}

function TagInput({
  label, tags, input, setInput, onAdd, onRemove, placeholder,
}: {
  label: string;
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder?: string;
}) {
  return (
    <section>
      <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</h3>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t, i) => (
          <span key={i} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full">
            {t}
            <button onClick={() => onRemove(i)} className="text-zinc-500 hover:text-white transition-colors ml-0.5">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder={placeholder}
          className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-amber-400/60 text-white text-sm px-3 py-2 rounded-xl focus:outline-none transition-colors placeholder:text-zinc-600"
        />
        <button
          onClick={onAdd}
          className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </section>
  );
}
