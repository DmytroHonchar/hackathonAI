import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Send, MapPin, ExternalLink, AlertCircle, SquarePen, MessageSquare, X } from 'lucide-react';
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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
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

  // Bootstrap: load sessions, auto-select most recent (or handle initialMessage)
  useEffect(() => {
    if (!user) return;
    loadSessions().then((list) => {
      if (initialMessage && !sentInitial.current) {
        // Initial message from landing → always open a fresh chat
        setHistoryLoaded(true);
      } else if (list.length > 0) {
        setCurrentSessionId(list[0].id);
        // loadSessionMessages is called by the currentSessionId effect below
      } else {
        setHistoryLoaded(true);
      }
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages whenever the active session changes
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
      }
      if (response.ui.booking) setPanelBooking(response.ui.booking);
      if (response.ui.status) setPanelStatus(response.ui.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user, userLocation]);

  // Send initial message (only when no existing sessions)
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

  async function handleSend() {
    const text = input.trim();
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasPanel = panelProviders.length > 0 || panelBooking || panelStatus;

  const SessionsList = () => (
    <>
      <div className="p-3 border-b border-zinc-800 flex-shrink-0">
        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
        >
          <SquarePen size={13} />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {sessions.length === 0 && (
          <p className="text-zinc-600 text-xs px-3 py-2">No conversations yet</p>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSession(s.id)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
              currentSessionId === s.id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <p className="truncate font-medium leading-snug">{s.title}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{formatRelativeTime(s.last_message_at)}</p>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="h-[calc(100vh-57px)] flex overflow-hidden">
      {/* Sessions sidebar — desktop */}
      <div className="hidden md:flex flex-col w-48 flex-shrink-0 border-r border-zinc-800 bg-zinc-950">
        <SessionsList />
      </div>

      {/* Chat panel */}
      <div className="flex flex-col flex-1 md:flex-none md:w-80 lg:w-96 border-r border-zinc-800">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setMobileSidebar(true)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <MessageSquare size={14} />
            Chats
          </button>
          <span className="flex-1 text-zinc-600 text-sm truncate text-center">
            {currentSessionId ? sessions.find((s) => s.id === currentSessionId)?.title ?? '' : 'New chat'}
          </span>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors"
          >
            <SquarePen size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && !loading && historyLoaded && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
              <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-zinc-400 text-sm max-w-xs">
                Ask me to find a plumber, electrician or cleaner — I'll search, compare and book on your behalf.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-400/15 border border-amber-400/20 text-amber-50 rounded-br-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-amber-400/50 text-right' : 'text-zinc-600'}`}>
                  {formatTime(msg.ts)}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl px-3 py-2">
              <AlertCircle size={15} />
              <span>{error} — please try again.</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {user ? (
          <div className="p-3 border-t border-zinc-800 flex-shrink-0">
            <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2 focus-within:border-amber-400/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you need…"
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none resize-none max-h-32 leading-relaxed pt-0.5"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-8 h-8 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-950 rounded-xl flex items-center justify-center transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-zinc-800 text-center flex-shrink-0">
            <p className="text-zinc-400 text-sm mb-2">Sign in to chat with the dispatcher.</p>
            <Link
              to="/login"
              className="inline-block bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      {/* Action panel */}
      <div className="hidden md:flex flex-col flex-1 overflow-y-auto p-5 gap-5 bg-zinc-950">
        {!hasPanel ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
              <MapPin size={28} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-zinc-400 font-medium mb-1">Ask me to find someone</p>
              <p className="text-zinc-600 text-sm">Results will appear here.</p>
            </div>
          </div>
        ) : (
          <>
            {panelBooking && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Booking confirmed</h3>
                  <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded-full font-medium capitalize">
                    {panelBooking.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">Provider</p>
                    <p className="text-white font-medium">{panelBooking.provider_name}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">Price</p>
                    <p className="text-white font-medium">£{panelBooking.price}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">When</p>
                    <p className="text-white font-medium">
                      {new Date(panelBooking.scheduled_for).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">Address</p>
                    <p className="text-white font-medium truncate">{panelBooking.address}</p>
                  </div>
                </div>
                <Link
                  to={`/bookings/${panelBooking.id}`}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                >
                  View booking <ExternalLink size={14} />
                </Link>
              </div>
            )}

            {panelStatus && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4">Booking status</h3>
                <BookingStatusStepper status={panelStatus.status as BookingStatus} />
              </div>
            )}

            {panelProviders.length > 0 && (
              <div>
                <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Matching providers</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
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
        )}
      </div>

      {/* Mobile sessions drawer */}
      {mobileSidebar && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileSidebar(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <h3 className="text-white font-semibold text-sm">Conversations</h3>
              <button onClick={() => setMobileSidebar(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <SessionsList />
          </div>
        </div>
      )}
    </div>
  );
}
