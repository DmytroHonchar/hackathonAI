import { Link, useLocation } from 'react-router-dom';
import { Search, Sparkles, CalendarCheck, LogOut, LogIn, Store, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProviderContext } from '../context/ProviderContext';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

const NAV_LINKS = [
  { to: '/browse',   label: 'Explore',    icon: Search },
  { to: '/app',      label: 'Assistant',  icon: Sparkles },
  { to: '/bookings', label: 'Bookings',   icon: CalendarCheck },
];

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + '/');
}

export default function Nav() {
  const { user } = useAuth();
  const { listing } = useProviderContext();
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-lg border-b border-line">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0">
            <Logo size={30} />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 bg-surface/70 border border-line rounded-full p-1 shadow-soft">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = isActive(path, to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    active ? 'bg-clay text-white shadow-clay' : 'text-ink-soft hover:text-ink hover:bg-sand'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to={listing ? '/provider' : '/settings'}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                    isActive(path, '/provider')
                      ? 'bg-agave text-white border-agave'
                      : 'bg-agave-tint text-agave-dark border-transparent hover:border-agave/30'
                  }`}
                >
                  <Store size={15} />
                  {listing ? 'My business' : 'Sell services'}
                </Link>
                <Link
                  to="/settings"
                  className={`w-10 h-10 rounded-full grid place-items-center transition-all ${
                    isActive(path, '/settings') ? 'bg-ink text-canvas' : 'bg-surface border border-line text-ink-soft hover:text-ink'
                  }`}
                  aria-label="Account"
                >
                  <User size={17} />
                </Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="hidden lg:grid w-10 h-10 rounded-full place-items-center bg-surface border border-line text-ink-faint hover:text-coral transition-all"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex items-center gap-2 text-ink-soft hover:text-ink text-sm font-semibold px-3 py-2 transition-colors">
                  <LogIn size={16} /> Sign in
                </Link>
                <Link to="/login" className="btn-clay px-4 py-2 text-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-canvas/90 backdrop-blur-lg border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = isActive(path, to);
            return (
              <Link key={to} to={to} className="flex flex-col items-center justify-center gap-0.5">
                <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-all ${active ? 'bg-clay-tint text-clay-dark' : 'text-ink-faint'}`}>
                  <Icon size={19} />
                </span>
                <span className={`text-[10px] font-semibold ${active ? 'text-clay-dark' : 'text-ink-faint'}`}>{label}</span>
              </Link>
            );
          })}
          <Link to={user ? '/settings' : '/login'} className="flex flex-col items-center justify-center gap-0.5">
            <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-all ${isActive(path, '/settings') ? 'bg-clay-tint text-clay-dark' : 'text-ink-faint'}`}>
              <User size={19} />
            </span>
            <span className={`text-[10px] font-semibold ${isActive(path, '/settings') ? 'text-clay-dark' : 'text-ink-faint'}`}>Account</span>
          </Link>
        </div>
      </div>
    </>
  );
}
