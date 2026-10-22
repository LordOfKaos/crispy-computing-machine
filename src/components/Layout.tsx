import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { usePortal } from '../PortalContext';
import { initials } from '../utils';
import Icon, { type IconName } from './Icon';

const nav: { to: string; label: string; icon: IconName; badge?: 'notifications' | 'messages' }[] = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/notifications', label: 'Notifications', icon: 'bell', badge: 'notifications' },
  { to: '/messages', label: 'Messages', icon: 'mail', badge: 'messages' },
  { to: '/documents', label: 'Documents', icon: 'file' },
  { to: '/crm', label: 'CRM', icon: 'users' },
];

export default function Layout() {
  const { user, unreadNotifications, unreadMessages } = usePortal();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const current = nav.find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)));
  const badges = { notifications: unreadNotifications, messages: unreadMessages };

  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">P</span>
          <span>Partner Portal</span>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && badges[item.badge] > 0 && <span className="nav-badge">{badges[item.badge]}</span>}
            </NavLink>
          ))}
        </nav>
        {import.meta.env.VITE_DATA_SOURCE !== 'dataverse' && (
          <div className="sidebar-footer">Demo data · not connected to Dataverse</div>
        )}
      </aside>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <h1>{current?.label ?? 'Partner Portal'}</h1>
          {user && (
            <div className="user-chip">
              <div className="user-text">
                <strong>{user.name}</strong>
                <span>{user.company}</span>
              </div>
              <span className="avatar">{initials(user.name)}</span>
            </div>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
