import { Star, MapPin, Zap, Globe } from 'lucide-react';
import type { Provider, DispatchUiProviderItem } from '../lib/types';

type CardProvider = Provider | DispatchUiProviderItem;

interface ProviderCardProps {
  provider: CardProvider;
  onClick?: () => void;
  highlighted?: boolean;
  onBook?: () => void;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  plumber: 'bg-blue-900 text-blue-300',
  electrician: 'bg-yellow-900 text-yellow-300',
  cleaner: 'bg-emerald-900 text-emerald-300',
};

export default function ProviderCard({ provider, onClick, highlighted, onBook, compact }: ProviderCardProps) {
  const extraLanguages = provider.languages.filter((l) => l !== 'English');

  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
        highlighted
          ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-lg shadow-amber-400/10'
          : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      <div className="flex gap-3">
        <img
          src={provider.photo_url ?? `https://i.pravatar.cc/150?u=${provider.id}`}
          alt={provider.name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-zinc-800"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-tight">{provider.name}</h3>
            {provider.emergency && (
              <span className="flex-shrink-0 flex items-center gap-1 bg-red-900/60 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
                <Zap size={10} />
                Emergency
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[provider.category] ?? 'bg-zinc-800 text-zinc-400'}`}>
              {provider.category}
            </span>
            <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
              <Star size={11} fill="currentColor" />
              {Number(provider.rating).toFixed(1)}
              <span className="text-zinc-500">({provider.review_count})</span>
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
            <span className="font-semibold text-white">£{provider.price_from}<span className="text-zinc-500 font-normal">/call</span></span>
            {provider.distance_km != null && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {Number(provider.distance_km).toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">{provider.description}</p>
      )}

      {extraLanguages.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Globe size={11} className="text-zinc-500" />
          {extraLanguages.map((lang) => (
            <span key={lang} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{lang}</span>
          ))}
        </div>
      )}

      {onBook && (
        <button
          onClick={(e) => { e.stopPropagation(); onBook(); }}
          className="mt-3 w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 text-sm font-semibold py-2 rounded-xl transition-colors"
        >
          Book
        </button>
      )}
    </div>
  );
}
