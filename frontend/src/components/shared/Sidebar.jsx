//imoort react, navigate, useAUth, api, TimeAgo, lucide-react icons
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { TimeAgo } from './UI';
import { Home, BookOpen, FileText, BarChart2, Users, LogOut, Bell, X, Menu } from 'lucide-react';
import Logo from './Logo';

//Define navigation items based on user roles
const navByRole = {
  student: [
    { to: '/student',            label: 'Dashboard',           icon: Home     },
    { to: '/student/community',  label: 'Community Board',     icon: BookOpen },
    { to: '/student/complaints', label: 'My Complaints',       icon: FileText },
  ],
  teacher: [
    { to: '/teacher',            label: 'Dashboard',           icon: Home     },
    { to: '/teacher/community',  label: 'Community Board',     icon: BookOpen },
    { to: '/teacher/complaints', label: 'Assigned Complaints', icon: FileText },
  ],
  admin: [
    { to: '/admin',            label: 'Dashboard',     icon: Home      },
    { to: '/admin/community',  label: 'Community Board', icon: BookOpen },
    { to: '/admin/complaints', label: 'Complaints',     icon: FileText  },
    { to: '/admin/analytics',  label: 'Analytics',      icon: BarChart2 },
    { to: '/admin/users',      label: 'Manage Users',   icon: Users     },
  ],
};

// Module-level ref so MobileTopbar can trigger sidebar open
let _setSidebarOpen = null;
let _getSidebarOpen = () => false;

// Notification panel 
function NotifPanel({ onClose, anchorRef }) {
  //set state for notifications and unread count
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  //fetch notification
  useEffect(() => {
    api.get('/notifications').then(res => {
      setNotifs(res.data.notifications);
      setUnread(res.data.unread);
    }).catch(() => {});
  }, []);

  //close the notification panel when the user clicks ot taps outside of it
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose]);

  //mark all notification as read
  const markRead = async () => {
    await api.patch('/notifications/read').catch(() => {});
    setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

  //render notification panel
  return (
    <div className="notif-panel" ref={panelRef}>
      <div className="notif-header">
        <span>Notifications {unread > 0 && <span style={{ color: 'var(--danger)' }}>({unread})</span>}</span>
        {unread > 0 && <button className="btn btn-sm btn-secondary" onClick={markRead}>Mark all read</button>}
      </div>
      {notifs.length === 0 ? (
        <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.855rem' }}>
          No notifications
        </div>
      ) : (
        notifs.slice(0, 20).map(n => (
          <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
            <p className="notif-msg">{n.message}</p>
            <p className="notif-time"><TimeAgo date={n.created_at} /></p>
          </div>
        ))
      )}
    </div>
  );
}

//  Sidebar component
export default function Sidebar() {
  //fetch user data, handle logout, and manage notification state
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotif, setShowNotif]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

  // Expose setter to MobileTopbar
  _setSidebarOpen = setSidebarOpen;
  _getSidebarOpen = () => sidebarOpen;

  const navItems = navByRole[user?.role] || [];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Close sidebar & notif on route change
  useEffect(() => { setSidebarOpen(false); setShowNotif(false); }, [location.pathname]);

  // Poll unread count
  useEffect(() => {
    if (!user) return;
    const fetch = () => api.get('/notifications').then(r => setUnreadCount(r.data.unread)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar header with logo and user role badge */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrap">
            <div className="sidebar-logo"><Logo width={200} /></div>
            <div className="sidebar-badge">{user?.role}</div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Navigation links based on user role */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              end={to.split('/').length <= 2}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Notifications */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }} ref={bellRef}>
            <button
              className="logout-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              onClick={() => setShowNotif(v => !v)}
            >
              <Bell size={14} /> Notifications
              {unreadCount > 0 && (
                <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', borderRadius: 10, padding: '0 5px' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotif && <NotifPanel onClose={() => setShowNotif(false)} anchorRef={bellRef} />}
          </div>

          {/* User */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>

          {/* Logout */}
          <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={13} style={{ display: 'inline', marginRight: 5 }} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

// MobileTopbar — placed in AppLayout above main content 
export function MobileTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

  // Close notif on route change
  useEffect(() => { setShowNotif(false); }, [location.pathname]);

  //
  useEffect(() => {
    if (!user) return;
    const fetch = () => api.get('/notifications').then(r => setUnreadCount(r.data.unread)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [user]);

  const [, forceUpdate] = useState(0);
  // Re-render when sidebar state changes so we can hide the topbar
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 50);
    return () => clearInterval(id);
  }, []);

  if (_getSidebarOpen()) return null;

  return (
    <div className="mobile-topbar">
      <button className="hamburger" onClick={() => _setSidebarOpen?.(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <span className="mobile-topbar-title"><div className="sidebar-logo"><Logo width={200} /></div></span>

      {/* Bell */}
      <div style={{ position: 'relative' }} ref={bellRef}>
        <button className="hamburger" onClick={() => setShowNotif(v => !v)} aria-label="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%',
            }} />
          )}
        </button>
        {showNotif && <NotifPanel onClose={() => setShowNotif(false)} anchorRef={bellRef} />}
      </div>

      {/* Logout */}
      <button
        className="hamburger"
        onClick={() => { logout(); navigate('/login'); }}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}