import { Droplets, Zap, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CategoryMeta {
  id: 'plumber' | 'electrician' | 'cleaner';
  label: string;      // singular, e.g. "Plumber"
  plural: string;     // e.g. "Plumbers"
  icon: LucideIcon;
  blurb: string;
  // Tailwind token families (design-system colors)
  accent: 'agave' | 'marigold' | 'clay';
  tintBg: string;     // soft badge / tile background
  tintText: string;   // matching foreground
  ring: string;       // hover/emphasis border
  gradient: string;   // hero tile wash
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'plumber',
    label: 'Plumber',
    plural: 'Plumbers',
    icon: Droplets,
    blurb: 'Leaks, boilers, blocked drains & fittings',
    accent: 'agave',
    tintBg: 'bg-agave-tint',
    tintText: 'text-agave-dark',
    ring: 'group-hover:border-agave/40',
    gradient: 'from-agave/12 to-agave/0',
  },
  {
    id: 'electrician',
    label: 'Electrician',
    plural: 'Electricians',
    icon: Zap,
    blurb: 'Sockets, lighting, fuseboards & EICR',
    accent: 'marigold',
    tintBg: 'bg-marigold-tint',
    tintText: 'text-[#9a6d12]',
    ring: 'group-hover:border-marigold/50',
    gradient: 'from-marigold/15 to-marigold/0',
  },
  {
    id: 'cleaner',
    label: 'Cleaner',
    plural: 'Cleaners',
    icon: Sparkles,
    blurb: 'Homes, deep cleans & Airbnb turnarounds',
    accent: 'clay',
    tintBg: 'bg-clay-tint',
    tintText: 'text-clay-dark',
    ring: 'group-hover:border-clay/40',
    gradient: 'from-clay/12 to-clay/0',
  },
];

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export function categoryMeta(id: string): CategoryMeta {
  return (
    CATEGORY_MAP[id] ?? {
      id: id as CategoryMeta['id'],
      label: id.charAt(0).toUpperCase() + id.slice(1),
      plural: id,
      icon: Wrench,
      blurb: '',
      accent: 'clay',
      tintBg: 'bg-sand',
      tintText: 'text-ink-soft',
      ring: 'group-hover:border-line-strong',
      gradient: 'from-sand to-transparent',
    }
  );
}
