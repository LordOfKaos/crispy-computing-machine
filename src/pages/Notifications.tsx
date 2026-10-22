import { useState } from 'react';
import { usePortal } from '../PortalContext';
import type { Notification } from '../types';
import { formatDateTime } from '../utils';

type Filter = 'all' | 'unread' | Notification['category'];
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'action', label: 'Action required' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'system', label: 'System' },
];

export default function Notifications() {
  const { notifications, setNotificationRead, markAllNotificationsRead, unreadNotifications } = usePortal();
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = notifications.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : n.category === filter,
  );

  const toggle = (n: Notification) => {
    setExpanded(expanded === n.id ? null : n.id);
    if (!n.read) setNotificationRead(n.id, true);
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="segmented">
          {filters.map((f) => (
            <button key={f.value} className={filter === f.value ? 'active' : ''} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" disabled={!unreadNotifications} onClick={markAllNotificationsRead}>
          Mark all as read
        </button>
      </div>

      <section className="card flush">
        {visible.length === 0 && <p className="empty">No notifications to show.</p>}
        <ul className="notification-list">
          {visible.map((n) => (
            <li key={n.id} className={n.read ? '' : 'unread'}>
              <button className="notification-head" onClick={() => toggle(n)} aria-expanded={expanded === n.id}>
                <span className={`dot ${n.read ? '' : 'on'}`} />
                <div className="list-main">
                  <strong>{n.title}</strong>
                  <span className="muted small">
                    {formatDateTime(n.createdOn)} · from the management team
                  </span>
                </div>
                <span className={`pill pill-${n.category}`}>{n.category === 'action' ? 'Action' : n.category}</span>
                {n.priority === 'high' && <span className="pill pill-high">High</span>}
              </button>
              {expanded === n.id && (
                <div className="notification-body">
                  <p>{n.body}</p>
                  <button className="link-btn" onClick={() => setNotificationRead(n.id, !n.read)}>
                    Mark as {n.read ? 'unread' : 'read'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
