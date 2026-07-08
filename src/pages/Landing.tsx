import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Search, Star, BadgeCheck, ShieldCheck, Languages,
  Sparkles, MapPin, Store, Heart, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../lib/categories';
import Logo from '../components/Logo';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate('/app', { state: { initialMessage: query.trim() } });
    else navigate('/browse');
  }

  const EXAMPLES = [
    'My kitchen sink is leaking',
    'Fit new light fixtures',
    'Deep clean before I move out',
  ];

  return (
    <div className="min-h-screen">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-lg border-b border-line">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo size={30} />
          <div className="flex items-center gap-2">
            <Link to="/browse" className="hidden sm:inline-flex text-ink-soft hover:text-ink text-sm font-semibold px-3 py-2 transition-colors">
              Explore
            </Link>
            {user ? (
              <Link to="/app" className="btn-clay px-4 py-2 text-sm">Open app <ArrowRight size={15} /></Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex text-ink-soft hover:text-ink text-sm font-semibold px-3 py-2 transition-colors">Sign in</Link>
                <Link to="/login" className="btn-clay px-4 py-2 text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-8 md:pt-20 md:pb-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <span className="chip bg-agave-tint text-agave-dark mb-5">
              <MapPin size={13} /> Trusted local pros in Liverpool
            </span>
            <h1 className="font-display text-[2.8rem] leading-[1.02] sm:text-6xl font-semibold text-ink tracking-[-0.02em]">
              Good hands,
              <br />
              <span className="text-clay">close to home.</span>
            </h1>
            <p className="text-ink-soft text-lg mt-5 max-w-md leading-relaxed">
              Manos is your neighbourhood marketplace for plumbers, electricians and cleaners you can actually trust. Describe the job — book a vetted pro in minutes.
            </p>

            {/* Search */}
            <form onSubmit={handleSubmit} className="mt-7 max-w-lg">
              <div className="flex items-center gap-2 bg-surface border border-line rounded-full pl-5 pr-2 py-2 shadow-card focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/10 transition-all">
                <Search size={19} className="text-ink-faint flex-shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you need done?"
                  className="flex-1 bg-transparent text-ink placeholder:text-ink-faint text-[15px] py-2 focus:outline-none min-w-0"
                />
                <button type="submit" className="btn-clay px-5 py-2.5 text-sm flex-shrink-0">
                  <span className="hidden sm:inline">Find a pro</span>
                  <ArrowRight size={16} className="sm:hidden" />
                  <ArrowRight size={16} className="hidden sm:inline" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-ink-faint text-xs font-medium flex items-center gap-1">
                  <Sparkles size={12} className="text-clay" /> Try:
                </span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => navigate('/app', { state: { initialMessage: ex } })}
                    className="text-xs font-medium text-ink-soft bg-surface border border-line hover:border-clay/40 hover:text-clay-dark px-3 py-1.5 rounded-full transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </form>

            {/* Trust row */}
            <div className="flex items-center gap-5 mt-8 text-sm">
              <div className="flex -space-x-2.5">
                {['a', 'b', 'c', 'd'].map((s) => (
                  <img key={s} src={`https://i.pravatar.cc/80?u=manos-${s}`} className="w-8 h-8 rounded-full ring-2 ring-canvas object-cover" alt="" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-ink font-semibold">
                  <Star size={14} className="text-marigold fill-marigold" /> 4.8
                  <span className="text-ink-faint font-normal">· 2,400+ jobs done</span>
                </div>
                <p className="text-ink-faint text-xs">Every pro is ID-checked & reviewed</p>
              </div>
            </div>
          </div>

          {/* Hero visual — product-forward, no stock */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-gradient-to-br from-marigold/15 via-clay/10 to-agave/10 rounded-[2.5rem] blur-xl" />
            <div className="relative card p-5 rounded-[2rem] shadow-lift">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft mb-3">
                <Sparkles size={14} className="text-clay" /> Your assistant found 3 pros nearby
              </div>
              <div className="space-y-2.5">
                {[
                  { n: 'Bold Street Plumbing', c: 'Plumber', r: 4.9, km: 0.8, p: 45, u: 'bold', em: true },
                  { n: 'City Centre Sparks', c: 'Electrician', r: 4.6, km: 1.2, p: 48, u: 'sparks', em: false },
                  { n: 'City Shine Cleaning', c: 'Cleaner', r: 4.7, km: 1.5, p: 38, u: 'shine', em: false },
                ].map((m) => (
                  <div key={m.u} className="flex items-center gap-3 bg-canvas/70 border border-line rounded-2xl p-3">
                    <img src={`https://i.pravatar.cc/120?u=${m.u}`} className="w-11 h-11 rounded-xl object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-ink font-semibold text-sm">
                        {m.n} <BadgeCheck size={13} className="text-agave" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-soft">
                        <span className="flex items-center gap-0.5"><Star size={11} className="text-marigold fill-marigold" />{m.r}</span>
                        <span>· {m.km} km · from £{m.p}</span>
                      </div>
                    </div>
                    {m.em && <span className="chip bg-coral-tint text-coral text-[10px] px-2 py-1">24h</span>}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/browse')} className="btn-clay w-full mt-4 py-2.5 text-sm">
                Compare & book <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two journeys ── */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid md:grid-cols-2 gap-5">
          <button
            onClick={() => navigate('/browse')}
            className="group relative overflow-hidden text-left rounded-[2rem] border border-line bg-gradient-to-br from-clay-tint to-surface p-7 hover:shadow-lift hover:-translate-y-0.5 transition-all"
          >
            <span className="w-12 h-12 rounded-2xl bg-clay text-white grid place-items-center shadow-clay mb-4"><Search size={22} /></span>
            <h3 className="font-display text-2xl font-semibold text-ink">I need a service</h3>
            <p className="text-ink-soft text-sm mt-1.5 max-w-xs leading-relaxed">Browse nearby pros, compare prices and reviews, and book in a few taps.</p>
            <span className="inline-flex items-center gap-1.5 text-clay-dark font-semibold text-sm mt-4 group-hover:gap-2.5 transition-all">
              Explore services <ArrowRight size={16} />
            </span>
          </button>

          <button
            onClick={() => navigate(user ? '/settings' : '/login')}
            className="group relative overflow-hidden text-left rounded-[2rem] border border-line bg-gradient-to-br from-agave-tint to-surface p-7 hover:shadow-lift hover:-translate-y-0.5 transition-all"
          >
            <span className="w-12 h-12 rounded-2xl bg-agave text-white grid place-items-center shadow-agave mb-4"><Store size={22} /></span>
            <h3 className="font-display text-2xl font-semibold text-ink">I offer services</h3>
            <p className="text-ink-soft text-sm mt-1.5 max-w-xs leading-relaxed">List your trade, set your hours, and get bookings from customers and the AI assistant.</p>
            <span className="inline-flex items-center gap-1.5 text-agave-dark font-semibold text-sm mt-4 group-hover:gap-2.5 transition-all">
              Start earning <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">Popular near you</h2>
            <p className="text-ink-soft text-sm mt-1">Hand-picked trades, ready when you are.</p>
          </div>
          <Link to="/browse" className="hidden sm:inline-flex items-center gap-1.5 text-clay-dark font-semibold text-sm hover:gap-2.5 transition-all">
            See all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                to={`/browse?category=${c.id}`}
                className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 hover:shadow-card hover:-translate-y-0.5 transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <span className={`relative w-12 h-12 rounded-2xl ${c.tintBg} grid place-items-center mb-4`}>
                  <Icon size={22} className={c.tintText} />
                </span>
                <h3 className="relative font-display text-xl font-semibold text-ink">{c.plural}</h3>
                <p className="relative text-ink-soft text-sm mt-1">{c.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Meet your assistant ── */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="rounded-[2.25rem] border border-line bg-gradient-to-br from-surface to-sand p-7 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="chip bg-clay-tint text-clay-dark mb-4"><Sparkles size={13} /> Your AI assistant</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink leading-tight">
              Skip the search. Just ask.
            </h2>
            <p className="text-ink-soft mt-3 leading-relaxed max-w-md">
              Describe the problem in your own words. Manos finds the right pros, compares them side by side, and books the appointment — you stay in control the whole way.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                'Finds & ranks vetted pros nearby',
                'Compares price, distance & reviews for you',
                'Books, reschedules and translates chats',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink">
                  <BadgeCheck size={17} className="text-agave flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/app" className="btn-clay mt-7 px-5 py-3 text-sm">
              <Sparkles size={16} /> Ask the assistant
            </Link>
          </div>

          {/* mini chat */}
          <div className="card rounded-3xl p-5 shadow-lift">
            <div className="flex justify-end mb-3">
              <p className="bg-clay text-white text-sm rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] leading-relaxed">
                My boiler stopped working and I have kids at home 😟
              </p>
            </div>
            <div className="flex justify-start mb-3">
              <p className="bg-sand text-ink text-sm rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[90%] leading-relaxed border border-line">
                On it. Here are 2 emergency plumbers who can come today — both under £50 and speak your language.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-canvas/70 border border-line rounded-2xl p-3">
              <img src="https://i.pravatar.cc/120?u=bold" className="w-11 h-11 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <div className="flex items-center gap-1 text-ink font-semibold text-sm">Bold Street Plumbing <BadgeCheck size={13} className="text-agave" /></div>
                <div className="text-xs text-ink-soft flex items-center gap-1"><Star size={11} className="text-marigold fill-marigold" /> 4.9 · 0.8 km · from £45</div>
              </div>
              <span className="chip bg-coral-tint text-coral text-[10px] px-2 py-1"><Clock size={10} /> Today</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <h2 className="font-display text-3xl font-semibold text-ink text-center mb-8">Booking a pro, the easy way</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { n: '1', icon: Search, t: 'Tell us the job', d: 'Search or just describe it. Add your address so we find who’s truly nearby.' },
            { n: '2', icon: Star, t: 'Compare with confidence', d: 'Real reviews, clear prices and distance — no guesswork, no cold calls.' },
            { n: '3', icon: Heart, t: 'Book & relax', d: 'Confirm a time, chat with your pro, and pay securely when the job’s done.' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="card p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-clay text-white grid place-items-center font-display font-semibold">{s.n}</span>
                  <Icon size={20} className="text-clay" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink">{s.t}</h3>
                <p className="text-ink-soft text-sm mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Trust band ── */}
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, t: 'ID-checked pros', d: 'Every provider is verified before they can take a booking.' },
            { icon: BadgeCheck, t: 'Secure payments', d: 'Pay through Manos — protected until the work is done.' },
            { icon: Languages, t: 'Talk in any language', d: 'Built-in translation so nothing gets lost between you and your pro.' },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.t} className="flex gap-3.5">
                <span className="w-11 h-11 rounded-2xl bg-agave-tint grid place-items-center flex-shrink-0"><Icon size={20} className="text-agave-dark" /></span>
                <div>
                  <h3 className="font-semibold text-ink text-[15px]">{v.t}</h3>
                  <p className="text-ink-soft text-sm mt-0.5 leading-relaxed">{v.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Provider CTA ── */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-agave text-white p-8 md:p-14">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-lg">
            <span className="chip bg-white/15 text-white mb-4"><Store size={13} /> For providers</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight">Grow your trade with Manos.</h2>
            <p className="text-white/85 mt-3 leading-relaxed">
              Reach neighbours looking for exactly what you do. Set your own prices and hours, get booked automatically by the assistant, and build a reputation that pays.
            </p>
            <Link to={user ? '/settings' : '/login'} className="btn-ghost mt-6 px-6 py-3 text-sm bg-white text-agave-dark border-transparent hover:bg-white/90">
              List your business — it’s free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line mt-6">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={26} />
          <p className="text-ink-faint text-sm">Good hands, close to home. · Made with care in Liverpool.</p>
          <div className="flex items-center gap-4 text-sm text-ink-soft">
            <Link to="/browse" className="hover:text-ink transition-colors">Explore</Link>
            <Link to="/app" className="hover:text-ink transition-colors">Assistant</Link>
            <Link to="/login" className="hover:text-ink transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
