import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { usePortal } from '../PortalContext';
import { formatDateTime, initials, timeAgo } from '../utils';

export default function Messages() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { threads, openThread, reply } = usePortal();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = threads.find((t) => t.threadId === threadId);

  useEffect(() => {
    if (active?.unread) openThread(active.threadId);
    setDraft('');
  }, [active?.threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [active?.threadId, active?.messages.length]);

  const filtered = threads.filter(
    (t) =>
      t.subject.toLowerCase().includes(query.toLowerCase()) ||
      t.messages.some((m) => m.fromName.toLowerCase().includes(query.toLowerCase())),
  );

  const send = async () => {
    if (!active || !draft.trim()) return;
    setSending(true);
    await reply(active.threadId, draft.trim());
    setDraft('');
    setSending(false);
  };

  return (
    <div className={`messages ${active ? 'has-active' : ''}`}>
      <aside className="thread-list card flush">
        <div className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search messages" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ul>
          {filtered.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <li key={t.threadId}>
                <Link
                  to={`/messages/${t.threadId}`}
                  className={`thread-item ${t.threadId === threadId ? 'active' : ''} ${t.unread ? 'unread' : ''}`}
                >
                  <div className="thread-top">
                    <strong>{t.messages[0].fromName}</strong>
                    <span className="muted small">{timeAgo(t.lastSentOn)}</span>
                  </div>
                  <div className="thread-subject">{t.subject}</div>
                  <div className="muted small truncate">{last.body.replace(/\s+/g, ' ')}</div>
                </Link>
              </li>
            );
          })}
          {filtered.length === 0 && <p className="empty">No messages found.</p>}
        </ul>
      </aside>

      <section className="thread-view card flush">
        {!active ? (
          <p className="empty">Select a message to read it.</p>
        ) : (
          <>
            <header className="thread-header">
              <button className="icon-btn back-btn" onClick={() => navigate('/messages')} aria-label="Back">
                <Icon name="arrowLeft" />
              </button>
              <h2>{active.subject}</h2>
            </header>
            <div className="thread-messages">
              {active.messages.map((m) => (
                <article key={m.id} className={`bubble ${m.fromManagement ? 'from-mgmt' : 'from-me'}`}>
                  <header>
                    <span className="avatar small">{initials(m.fromName)}</span>
                    <div>
                      <strong>{m.fromName}</strong>
                      <span className="muted small"> · {m.fromRole}</span>
                    </div>
                    <span className="muted small push">{formatDateTime(m.sentOn)}</span>
                  </header>
                  <p>{m.body}</p>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
            <footer className="composer">
              <textarea
                placeholder="Write a reply to the management team…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()}
                rows={3}
              />
              <button className="btn" onClick={send} disabled={!draft.trim() || sending}>
                <Icon name="send" size={16} /> {sending ? 'Sending…' : 'Send'}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
