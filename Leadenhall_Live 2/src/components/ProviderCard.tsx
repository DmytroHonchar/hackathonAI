import { Star, MapPin, Zap, Globe, BadgeCheck } from 'lucide-react';
import type { Provider, DispatchUiProviderItem } from '../lib/types';
import { categoryMeta } from '../lib/categories';

type CardProvider = Provider | DispatchUiProviderItem;

interface ProviderCardProps {
  provider: CardProvider;
  onClick?: () => void;
  highlighted?: boolean;
  onBook?: () => void;
  compact?: boolean;
}

export default function ProviderCard({ provider, onClick, highlighted, onBook, compact }: ProviderCardProps) {
  const extraLanguages = provider.languages.filter((l) => l !== 'English');
  const cat = categoryMeta(provider.category);
  const CatIcon = cat.icon;
  const rating = Number(provider.rating);

  return (
    <div
      onClick={onClick}
      className={`group text-left bg-surface border rounded-3xl p-3.5 transition-all duration-200 cursor-pointer ${
        highlighted
          ? 'border-clay ring-4 ring-clay/10 shadow-card -translate-y-0.5'
          : 'border-line hover:border-line-strong hover:shadow-card hover:-translate-y-0.5'
      }`}
    >
      <div className="flex gap-3.5">
        <div className="relative flex-shrink-0">
          <img
            src={provider.photo_url ?? `https://i.pravatar.cc/160?u=${provider.id}`}
            alt={provider.name}
            className="w-16 h-16 rounded-2xl object-cover bg-sand"
          />
          <span className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full grid place-items-center ring-2 ring-surface ${cat.tintBg}`}>
            <CatIcon size={12} className={cat.tintText} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-ink text-[15px] leading-tight truncate flex items-center gap-1">
                {provider.name}
                <BadgeCheck size={14} className="text-agave flex-shrink-0" />
              </h3>
              <p className={`text-xs font-semibold mt-0.5 ${cat.tintText}`}>{cat.label}</p>
            </div>
            {provider.emergency && (
              <span className="chip bg-coral-tint text-coral flex-shrink-0">
                <Zap size={11} />
                24h
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[13px]">
            <span className="flex items-center gap-1 text-ink font-semibold">
              <Star size={13} className="text-marigold fill-marigold" />
              {rating > 0 ? rating.toFixed(1) : 'New'}
              {provider.review_count > 0 && <span className="text-ink-faint font-normal">({provider.review_count})</span>}
            </span>
            {provider.distance_km != null && (
              <span className="flex items-center gap-1 text-ink-soft">
                <MapPin size={12} className="text-ink-faint" />
                {Number(provider.distance_km).toFixed(1)} km
              </span>
            )}
            <span className="text-ink-soft">
              from <span className="font-bold text-ink">£{provider.price_from}</span>
            </span>
          </div>
        </div>
      </div>

      {!compact && provider.description && (
        <p className="text-ink-soft text-[13px] mt-3 line-clamp-2 leading-relaxed">{provider.description}</p>
      )}

      {extraLanguages.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <Globe size={12} className="text-ink-faint" />
          {extraLanguages.map((lang) => (
            <span key={lang} className="text-[11px] font-medium bg-sand text-ink-soft px-2 py-0.5 rounded-full">{lang}</span>
          ))}
        </div>
      )}

      {onBook && (
        <button
          onClick={(e) => { e.stopPropagation(); onBook(); }}
          className="btn-clay mt-3.5 w-full py-2.5 text-sm"
        >
          Book now
        </button>
      )}
    </div>
  );
}
