import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../PortalContext';
import { dataService } from '../services';
import type { Activity, Opportunity } from '../types';
import { formatCurrency, formatDate, timeAgo } from '../utils';

export default function Dashboard() {
  const { user, notifications, threads, unreadNotifications, unreadMessages, loading } = usePortal();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    dataService.getOpportunities().then(setOpportunities);
    dataService.getActivities().then(setActivities);
  }, []);

  const pipeline = opportunities.reduce((sum, o) => sum + o.estimatedValue, 0);
  const openTasks = activities.filter((a) => !a.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <section className="hero">
        <h2>Welcome back, {user?.name.split(' ')[0]}</h2>
        <p>Here is what's new from the management team.</p>
      </section>

      <div className="stats">
        <Link to="/notifications" className="stat">
          <span className="stat-value">{unreadNotifications}</span>
          <span className="stat-label">Unread notifications</span>
        </Link>
        <Link to="/messages" className="stat">
          <span className="stat-value">{unreadMessages}</span>
          <span className="stat-label">Unread messages</span>
        </Link>
        <Link to="/crm/opportunities" className="stat">
          <span className="stat-value">{formatCurrency(pipeline)}</span>
          <span className="stat-label">Open pipeline</span>
        </Link>
        <Link to="/crm" className="stat">
          <span className="stat-value">{openTasks.length}</span>
          <span className="stat-label">Open tasks</span>
        </Link>
      </div>

      <div className="grid-2">
        <section className="card">
          <header className="card-header">
            <h3>Latest notifications</h3>
            <Link to="/notifications">View all</Link>
          </header>
          <ul className="list">
            {notifications.slice(0, 4).map((n) => (
              <li key={n.id} className={n.read ? '' : 'unread'}>
                <div className="list-main">
                  <strong>{n.title}</strong>
                  <span className="muted small">{timeAgo(n.createdOn)}</span>
                </div>
                {n.priority === 'high' && <span className="pill pill-high">High</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <header className="card-header">
            <h3>Recent messages</h3>
            <Link to="/messages">View all</Link>
          </header>
          <ul className="list">
            {threads.slice(0, 4).map((t) => {
              const last = t.messages[t.messages.length - 1];
              return (
                <li key={t.threadId} className={t.unread ? 'unread' : ''}>
                  <Link to={`/messages/${t.threadId}`} className="list-main">
                    <strong>{t.subject}</strong>
                    <span className="muted small">
                      {last.fromName} · {timeAgo(t.lastSentOn)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <header className="card-header">
            <h3>Upcoming tasks</h3>
            <Link to="/crm">Open CRM</Link>
          </header>
          <ul className="list">
            {openTasks.slice(0, 4).map((a) => {
              const overdue = new Date(a.dueDate) < new Date();
              return (
                <li key={a.id}>
                  <div className="list-main">
                    <strong>{a.subject}</strong>
                    <span className={`small ${overdue ? 'text-danger' : 'muted'}`}>
                      {overdue ? 'Overdue · ' : 'Due '}
                      {formatDate(a.dueDate)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <header className="card-header">
            <h3>Pipeline by stage</h3>
          </header>
          <PipelineBars opportunities={opportunities} />
        </section>
      </div>
    </div>
  );
}

function PipelineBars({ opportunities }: { opportunities: Opportunity[] }) {
  const stages = ['Qualify', 'Develop', 'Propose', 'Close'] as const;
  const totals = stages.map((s) => ({
    stage: s,
    value: opportunities.filter((o) => o.stage === s).reduce((sum, o) => sum + o.estimatedValue, 0),
  }));
  const max = Math.max(1, ...totals.map((t) => t.value));
  return (
    <div className="bars">
      {totals.map((t) => (
        <div key={t.stage} className="bar-row">
          <span className="bar-label">{t.stage}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(t.value / max) * 100}%` }} />
          </div>
          <span className="bar-value">{formatCurrency(t.value)}</span>
        </div>
      ))}
    </div>
  );
}
