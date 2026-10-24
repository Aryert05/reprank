import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';
import { useChat } from '../hooks/useChat.js';

const USERNAME_STORAGE_KEY = 'reprank_chat_username';
const MAX_MESSAGE_LENGTH = 500;

function loadSavedUsername() {
  try {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveUsername(username) {
  try {
    localStorage.setItem(USERNAME_STORAGE_KEY, username);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

// Formats an ISO timestamp into a readable local time like "14:32".
function formatTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  useDocumentTitle('Real-Time Chat — RepRank');
  const { toasts, showToast } = useToast();
  const { status, messages, users, error, join, sendMessage, clearError } = useChat();

  const [username, setUsername] = useState(loadSavedUsername);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const connected = status === 'connected';

  // Announce the display name to the server as soon as the socket is ready.
  useEffect(() => {
    if (connected && username.trim()) {
      join(username.trim());
    }
    // Only re-run when the connection state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  async function handleJoin(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      showToast('Enter a display name first.');
      return;
    }

    const ok = await join(trimmed);
    if (ok) {
      saveUsername(trimmed);
      showToast(`You are chatting as ${trimmed}.`);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed) {
      showToast('Type a message before sending.');
      return;
    }

    if (!connected) {
      showToast('Not connected — message not sent.');
      return;
    }

    const name = username.trim();
    if (!name) {
      showToast('Set your display name before sending.');
      return;
    }

    setSending(true);
    const ok = await sendMessage(name, trimmed);
    setSending(false);

    // Only clear the composer when the server actually accepted the message.
    if (ok) {
      setDraft('');
      inputRef.current?.focus();
    }
  }

  const statusLabel =
    status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected';

  const statusClasses =
    status === 'connected'
      ? 'border-volt/30 bg-volt/10 text-volt-400'
      : status === 'connecting'
        ? 'border-ink-600 bg-ink-800 text-mist-300'
        : 'border-red-400/40 bg-red-400/10 text-red-300';

  return (
    <Layout nav="app" active="chat">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="stat-label">Experiment 8 · WebSockets</p>
            <h1 className="mt-1 text-3xl font-semibold text-mist-100">Real-Time Chat Application</h1>
            <p className="mt-2 text-mist-400">
              Messages are pushed live to every connected browser session over Socket.IO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`badge ${statusClasses}`}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === 'connected' ? 'bg-volt' : status === 'connecting' ? 'bg-mist-400' : 'bg-red-400'
                }`}
              />
              {statusLabel}
            </span>
            <span className="badge">{users.length} online</span>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start justify-between gap-3 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="shrink-0 text-xs uppercase tracking-wide opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* ── Identity panel ─────────────────────────────────────────── */}
          <section className="card h-fit">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-mist-400">Your identity</h2>

            <form onSubmit={handleJoin} className="mt-4 space-y-4">
              <div>
                <label htmlFor="chat-username" className="field-label">
                  Display name
                </label>
                <input
                  id="chat-username"
                  type="text"
                  maxLength={32}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Aditi"
                  className="field-input"
                  autoComplete="off"
                />
                <p className="mt-1.5 text-xs text-mist-400">
                  Anyone can pick a name — this experiment does not authenticate users.
                </p>
              </div>

              <button type="submit" className="btn-secondary w-full !py-2.5 text-sm" disabled={!connected}>
                Update name
              </button>
            </form>

            <div className="mt-6 border-t border-ink-700 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-mist-400">Online now</h3>
              {users.length === 0 ? (
                <p className="mt-2 text-sm text-mist-400">Nobody else is here yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {users.map((user) => (
                    <li key={user.id} className="flex items-center gap-2 text-sm text-mist-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-volt" />
                      {user.username}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ── Message panel ─────────────────────────────────────────── */}
          <section className="card flex h-[32rem] flex-col lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-mist-400">Messages</h2>

            <div
              ref={listRef}
              className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1"
              aria-live="polite"
              data-testid="chat-message-list"
            >
              {messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-mist-400">
                  No messages yet. Send the first one.
                </p>
              ) : (
                messages.map((message, index) => {
                  const mine = message.username === username.trim();
                  return (
                    <div
                      key={`${message.timestamp}-${index}`}
                      data-testid="chat-message"
                      data-username={message.username}
                      className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl border px-4 py-2.5 ${
                          mine
                            ? 'border-volt/30 bg-volt/10 text-mist-100'
                            : 'border-ink-600 bg-ink-800 text-mist-100'
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-volt-400">
                          {message.username}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.message}</p>
                      </div>
                      <span className="mt-1 font-mono text-[11px] text-mist-400">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex items-end gap-3 border-t border-ink-700 pt-4">
              <div className="flex-1">
                <label htmlFor="chat-message" className="field-label">
                  Message
                </label>
                <textarea
                  id="chat-message"
                  ref={inputRef}
                  rows={2}
                  maxLength={MAX_MESSAGE_LENGTH}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter inserts a newline.
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={connected ? 'Type a message and press Enter…' : 'Waiting for the chat server…'}
                  className="field-input resize-none"
                  disabled={!connected}
                />
              </div>

              <button type="submit" className="btn-primary !px-5 !py-3" disabled={!connected || sending}>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
