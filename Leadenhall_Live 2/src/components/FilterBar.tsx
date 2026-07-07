import { Zap, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '../lib/categories';

interface FilterBarProps {
  category: string;
  setCategory: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  emergencyOnly: boolean;
  setEmergencyOnly: (v: boolean) => void;
  maxDistance: number;
  setMaxDistance: (v: number) => void;
}

export default function FilterBar({
  category, setCategory,
  maxPrice, setMaxPrice,
  emergencyOnly, setEmergencyOnly,
  maxDistance, setMaxDistance,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setCategory('')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            category === '' ? 'bg-ink text-canvas border-ink' : 'bg-surface text-ink-soft border-line hover:border-line-strong'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(active ? '' : c.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                active ? 'bg-clay text-white border-clay shadow-clay' : 'bg-surface text-ink-soft border-line hover:border-line-strong'
              }`}
            >
              <Icon size={15} className={active ? '' : c.tintText} />
              {c.plural}
            </button>
          );
        })}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="hidden sm:flex items-center gap-1.5 text-ink-faint text-xs font-semibold">
          <SlidersHorizontal size={13} /> Filters
        </span>

        <label className="flex items-center gap-2 bg-surface border border-line rounded-full pl-3.5 pr-2 py-1.5">
          <span className="text-xs font-medium text-ink-soft">Under £</span>
          <input
            type="number"
            min={0}
            value={maxPrice || ''}
            onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
            placeholder="Any"
            className="w-16 bg-transparent text-ink text-sm font-semibold focus:outline-none placeholder:text-ink-faint placeholder:font-normal"
          />
        </label>

        <label className="flex items-center gap-2 bg-surface border border-line rounded-full pl-3.5 pr-2 py-1.5">
          <span className="text-xs font-medium text-ink-soft">Within km</span>
          <input
            type="number"
            min={0}
            value={maxDistance || ''}
            onChange={(e) => setMaxDistance(Number(e.target.value) || 0)}
            placeholder="Any"
            className="w-14 bg-transparent text-ink text-sm font-semibold focus:outline-none placeholder:text-ink-faint placeholder:font-normal"
          />
        </label>

        <button
          onClick={() => setEmergencyOnly(!emergencyOnly)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            emergencyOnly ? 'bg-coral text-white border-coral' : 'bg-surface text-ink-soft border-line hover:border-line-strong'
          }`}
        >
          <Zap size={14} className={emergencyOnly ? '' : 'text-coral'} />
          24h / Emergency
        </button>
      </div>
    </div>
  );
}
