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
    <div className="flex flex-wrap gap-4 items-end p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400 font-medium">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 min-w-[140px]"
        >
          <option value="">All categories</option>
          <option value="plumber">Plumber</option>
          <option value="electrician">Electrician</option>
          <option value="cleaner">Cleaner</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400 font-medium">Max price (£)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={maxPrice || ''}
            onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
            placeholder="Any"
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 w-24"
          />
          {maxPrice > 0 && <span className="text-zinc-500 text-xs">£{maxPrice}</span>}
          {!maxPrice && <span className="text-zinc-500 text-xs">No limit</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400 font-medium">Max distance (km)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={maxDistance || ''}
            onChange={(e) => setMaxDistance(Number(e.target.value) || 0)}
            placeholder="Any"
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 w-24"
          />
          {maxDistance > 0 && <span className="text-zinc-500 text-xs">{maxDistance} km</span>}
          {!maxDistance && <span className="text-zinc-500 text-xs">No limit</span>}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => setEmergencyOnly(!emergencyOnly)}
          className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${emergencyOnly ? 'bg-amber-400' : 'bg-zinc-700'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${emergencyOnly ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm text-zinc-300">Emergency only</span>
      </label>
    </div>
  );
}
