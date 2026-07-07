import { Link, useLocation } from 'react-router-dom';
import { Zap, MessageSquare, Search, Calendar, LogOut, LogIn, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProviderContext } from '../context/ProviderContext';
import { supabase } from '../lib/supabase';

const NAV_LINKS = [
  { to: '/app',      label: 'Concierge', icon: MessageSquare },
  { to: '/browse',   label: 'Browse',    icon: Search },
  { to: '/bookings', label: 'Bookings',  icon: Calendar },
];

export default function Nav() {
  const { user } = useAuth();
  const { listing } = useProviderContext();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white hover:text-amber-400 transition-colors">
          <Zap size={20} className="text-amber-400 fill-amber-400" />
          <span className="text-lg tracking-tight">Dispatch</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Auth + provider */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {listing && (
                <Link
                  to="/provider"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === '/provider'
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <LayoutDashboard size={15} />
                  <span className="hidden md:inline">Provider</span>
                </Link>
              )}
              <Link
                to="/settings"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === '/settings'
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Settings size={15} />
                <span className="hidden md:inline">Settings</span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm px-3 py-1.5 rounded-xl hover:bg-zinc-900 transition-all"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm px-3 py-1.5 rounded-xl hover:bg-zinc-900 transition-all"
            >
              <LogIn size={15} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
