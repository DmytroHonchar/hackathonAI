import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Send, MapPin, ExternalLink, AlertCircle, SquarePen, MessageSquare, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { callDispatch } from '../lib/dispatch';
import ProviderCard from '../components/ProviderCard';
import ProviderMap from '../components/ProviderMap';
import BookingStatusStepper from '../components/BookingStatusStepper';
import type { ChatMessage, DispatchUiProviderItem, DispatchUiBooking, DispatchUiStatus } from '../lib/types';

type BookingStatus = 'pending' | 'accepted' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
}

const QUICK_PROMPTS = [
  'My kitchen sink is leaking',
  'I need an electrician this week',
  'Deep clean my 2-bed flat',
  'Emergency plumber tonight',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-surface border border-line rounded-3xl rounded-tl-md w-fit shadow-soft">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-clay/60 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </div>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const days = Math.floor(hr / 24);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Concierge() {
  const { user } = useAuth();
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { ts: Date })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [panelProviders, setPanelProviders] = useState<DispatchUiProviderItem[]>([]);
  const [panelBooking, setPanelBooking] = useState<DispatchUiBooking | null>(null);
  const [panelStatus, setPanelStatus] = useState<DispatchUiStatus | null>(null);
  const [highlightedProvider, setHighlightedProvider] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user_location') || 'null');
    if (stored?.lat && stored?.lng) {
      setUserLocation({ lat: stored.lat, lng: stored.lng });
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(undefined)
      );
    }
  }, []);

  const loadSessions = useCallback(async (): Promise<ChatSession[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, last_message_at')
      .order('last_message_at', { ascending: false })
      .limit(30);
    const list = (data as ChatSession[]) ?? [];
    setSessions(list);
    return list;
  }, [user]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setHistoryLoaded(false);
    setMessages([]);
    const { data } = await supabase
      .from('conversations')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages(
      (data ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        ts: new Date(m.created_at),
      }))
    );
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSessions().then((list) => {
      if (initialMessage && !sentInitial.current) {
        setHistoryLoaded(true);
      } else if (list.length > 0) {
        setCurrentSessionId(list[0].id);
      } else {
        setHistoryLoaded(true);
      }
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentSessionId) return;
    loadSessionMessages(currentSessionId);
    setPanelProviders([]);
    setPanelBooking(null);
    setPanelStatus(null);
    setHighlightedProvider(null);
  }, [currentSessionId, loadSessionMessages]);

  const sendMessage = useCallback(async (history: ChatMessage[], sessionId: string) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const response = await callDispatch(history, userLocation, sessionId);
      if (response.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.reply, ts: new Date() }]);
      }
      if (response.ui.providers?.length) {
        setPanelProviders(response.ui.providers);
        setPanelBooking(null);
        setHighlightedProvider(null);
        setMobilePanel(true);
      }
      if (response.ui.booking) { setPanelBooking(response.ui.booking); setMobilePanel(true); }
      if (response.ui.status) { setPanelStatus(response.ui.status); setMobilePanel(true); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user, userLocation]);

  useEffect(() => {
    if (!historyLoaded || !initialMessage || sentInitial.current || !user) return;
    sentInitial.current = true;
    (async () => {
      const title = initialMessage.length > 40 ? initialMessage.slice(0, 40) + '…' : initialMessage;
      const { data } = await supabase.from('chat_sessions').insert({ title }).select('id').single();
      if (!data) return;
      const sid = data.id as string;
      setCurrentSessionId(sid);
      const userMsg: ChatMessage & { ts: Date } = { role: 'user', content: initialMessage, ts: new Date() };
      setMessages([userMsg]);
      await sendMessage([{ role: 'user', content: initialMessage }], sid);
      loadSessions();
    })();
  }, [historyLoaded, initialMessage, user, sendMessage, loadSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setPanelProviders([]);
    setPanelBooking(null);
    setPanelStatus(null);
    setHighlightedProvider(null);
    setHistoryLoaded(true);
    setMobileSidebar(false);
  }

  async function selectSession(sessionId: string) {
    setCurrentSessionId(sessionId);
    setMobileSidebar(false);
  }

  async function submitText(text: string) {
    if (!text || loading || !user) return;
    setInput('');
    let sid = currentSessionId;
    if (!sid) {
      const title = text.length > 40 ? text.slice(0, 40) + '…' : text;
      const { data } = await supabase.from('chat_sessions').insert({ title }).select('id').single();
      if (!data) return;
      sid = data.id as string;
      setCurrentSessionId(sid);
    }
    const userMsg: ChatMessage & { ts: Date } = { role: 'user', content: text, ts: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await sendMessage(updatedMessages.map(({ role, content }) => ({ role, content })), sid);
    loadSessions();
  }

  function handleSend() {
    submitText(input.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasPanel = panelProviders.length > 0 || panelBooking || panelStatus;

  const SessionsList = () => (
    <>
      <div className="p-3 border-b border-line flex-shrink-0">
        <button onClick={startNewChat} className="btn-clay w-full py-2.5 text-sm">
          <SquarePen size={15} /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {sessions.length === 0 && <p className="text-ink-faint text-xs px-3 py-2">No conversations yet</p>}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSession(s.id)}
            className={`w-full text-left px-3 py-2.5 rounded-2xl text-sm transition-colors ${
              currentSessionId === s.id ? 'bg-clay-tint text-clay-dark' : 'text-ink-soft hover:bg-sand'
            }`}
          >
            <p className="truncate font-semibold leading-snug">{s.title}</p>
            <p className="text-xs text-ink-faint mt-0.5">{formatRelativeTime(s.last_message_at)}</p>
          </button>
        ))}
      </div>
    </>
  );

  const PanelContent = () => (
    <>
      {panelBooking && (
        <div className="card rounded-3xl p-5 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
              <CheckCircle2 size={18} className="text-agave" /> Booking confirmed
            </h3>
            <span className="chip bg-agave-tint text-agave-dark capitalize">{panelBooking.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-ink-faint text-xs mb-0.5">Provider</p><p className="text-ink font-semibold">{panelBooking.provider_name}</p></div>
            <div><p className="text-ink-faint text-xs mb-0.5">Price</p><p className="text-ink font-semibold">£{panelBooking.price}</p></div>
            <div><p className="text-ink-faint text-xs mb-0.5">When</p><p className="text-ink font-semibold">{new Date(panelBooking.scheduled_for).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
            <div><p className="text-ink-faint text-xs mb-0.5">Address</p><p className="text-ink font-semibold truncate">{panelBooking.address}</p></div>
          </div>
          <Link to={`/bookings/${panelBooking.id}`} className="btn-clay w-full py-2.5 text-sm">
            View booking <ExternalLink size={14} />
          </Link>
        </div>
      )}

      {panelStatus && (
        <div className="card rounded-3xl p-5">
          <h3 className="font-display text-lg font-semibold text-ink mb-5">Booking status</h3>
          <BookingStatusStepper status={panelStatus.status as BookingStatus} />
        </div>
      )}

      {panelProviders.length > 0 && (
        <div>
          <h3 className="text-ink-faint text-xs font-bold uppercase tracking-wider mb-3">
            {panelProviders.length} matching pros
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
            {panelProviders.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                highlighted={highlightedProvider === p.id}
                onClick={() => setHighlightedProvider(p.id === highlightedProvider ? null : p.id)}
              />
            ))}
          </div>
          <ProviderMap
            providers={panelProviders}
            userLocation={userLocation}
            highlightedId={highlightedProvider}
            onMarkerClick={setHighlightedProvider}
            height="280px"
          />
        </div>
      )}
    </>
  );

  return (
    <div className="flex overflow-hidden h-[calc(100dvh-64px-64px)] md:h-[calc(100dvh-64px)]">
      {/* Sessions sidebar — desktop */}
      <div className="hidden md:flex flex-col w-52 flex-shrink-0 border-r border-line bg-canvas">
        <SessionsList />
      </div>

      {/* Chat panel */}
      <div className="flex flex-col flex-1 md:flex-none md:w-[22rem] lg:w-[26rem] border-r border-line bg-canvas">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-line flex-shrink-0">
          <button onClick={() => setMobileSidebar(true)} className="flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm font-medium transition-colors">
            <MessageSquare size={15} /> Chats
          </button>
          <span className="flex-1 text-ink-faint text-sm truncate text-center">
            {currentSessionId ? sessions.find((s) => s.id === currentSessionId)?.title ?? '' : 'New chat'}
          </span>
          <button onClick={startNewChat} className="text-clay hover:text-clay-dark transition-colors"><SquarePen size={16} /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && !loading && historyLoaded && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-10 px-2">
              <div className="w-16 h-16 bg-clay-tint rounded-3xl grid place-items-center">
                <Sparkles size={28} className="text-clay" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">How can I help?</h2>
                <p className="text-ink-soft text-sm max-w-xs mt-1.5 leading-relaxed">
                  Describe what you need and I’ll find, compare and book the right local pro for you.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => submitText(q)}
                    className="text-left text-sm text-ink bg-surface border border-line hover:border-clay/40 rounded-2xl px-4 py-3 transition-all hover:shadow-soft"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-clay text-white rounded-3xl rounded-br-md'
                  : 'bg-surface border border-line text-ink rounded-3xl rounded-bl-md shadow-soft'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[11px] mt-1.5 ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-ink-faint'}`}>{formatTime(msg.ts)}</p>
              </div>
            </div>
          ))}

          {loading && <div className="flex justify-start"><TypingIndicator /></div>}

          {error && (
            <div className="flex items-center gap-2 text-coral text-sm bg-coral-tint border border-coral/20 rounded-2xl px-3 py-2.5">
              <AlertCircle size={16} /><span>{error} — please try again.</span>
            </div>
          )}

          {/* Mobile: view results button */}
          {hasPanel && (
            <button onClick={() => setMobilePanel(true)} className="md:hidden btn-agave w-full py-2.5 text-sm">
              <MapPin size={15} /> View {panelProviders.length > 0 ? `${panelProviders.length} results` : 'results'}
            </button>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {user ? (
          <div className="p-3 border-t border-line flex-shrink-0">
            <div className="flex items-end gap-2 bg-surface border border-line rounded-3xl px-3 py-2 focus-within:border-clay focus-within:ring-4 focus-within:ring-clay/10 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you need…"
                rows={1}
                className="flex-1 bg-transparent text-ink text-sm placeholder:text-ink-faint focus:outline-none resize-none max-h-32 leading-relaxed pt-1.5"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 bg-clay hover:bg-clay-dark disabled:opacity-40 text-white rounded-full grid place-items-center transition-all active:scale-95"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 border-t border-line text-center flex-shrink-0">
            <p className="text-ink-soft text-sm mb-3">Sign in to chat with your assistant.</p>
            <Link to="/login" className="btn-clay px-6 py-2.5 text-sm">Sign in</Link>
          </div>
        )}
      </div>

      {/* Action panel — desktop */}
      <div className="hidden md:flex flex-col flex-1 overflow-y-auto p-5 gap-5">
        {!hasPanel ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-6">
            <div className="w-20 h-20 bg-surface border border-line rounded-4xl grid place-items-center shadow-soft">
              <MapPin size={30} className="text-ink-faint" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-ink mb-1">Your results appear here</p>
              <p className="text-ink-soft text-sm max-w-xs">Ask me to find someone — I’ll show ranked pros, a live map and one-tap booking.</p>
            </div>
          </div>
        ) : (
          <PanelContent />
        )}
      </div>

      {/* Mobile results drawer */}
      {mobilePanel && hasPanel && (
        <div className="md:hidden fixed inset-0 z-50 bg-canvas flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-line flex-shrink-0">
            <h2 className="font-display text-lg font-semibold text-ink">Results</h2>
            <button onClick={() => setMobilePanel(false)} className="w-9 h-9 rounded-full bg-sand grid place-items-center"><X size={18} className="text-ink" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5"><PanelContent /></div>
        </div>
      )}

      {/* Mobile sessions drawer */}
      {mobileSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onClick={() => setMobileSidebar(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-canvas border-r border-line flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-line flex-shrink-0">
              <h3 className="font-display font-semibold text-ink">Conversations</h3>
              <button onClick={() => setMobileSidebar(false)} className="text-ink-soft hover:text-ink transition-colors"><X size={18} /></button>
            </div>
            <SessionsList />
          </div>
        </div>
      )}
    </div>
  );
}
