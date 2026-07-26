//import react, navigate, useAuth, api, TimeAgo, lucide-react icons
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { TimeAgo } from './UI';
import { Home, BookOpen, FileText, BarChart2, Users, LogOut, Bell, X, Menu} from 'lucide-react';
import Logo from './Logo';

// Define navigation items based on user roles
const navByRole = {
  student: [
    { to: '/student',           label: 'Dashboard',        icon: Home      },
    { to: '/student/community', label: 'Community Board',  icon: BookOpen  },
    { to: '/student/complaints',label: 'My Complaints',    icon: FileText  },
  ],
  teacher: [
    { to: '/teacher',            label: 'Dashboard',        icon: Home      },
    { to: '/teacher/community',  label: 'Community Board',  icon: BookOpen  },
    { to: '/teacher/complaints', label: 'Assigned Complaints', icon: FileText },
  ],
  admin: [
    { to: '/admin',              label: 'Dashboard',        icon: Home      },
    { to: '/admin/community',    label: 'Community Board',  icon: BookOpen  },
    { to: '/admin/complaints',   label: 'Complaints',       icon: FileText  },
    { to: '/admin/analytics',    label: 'Analytics',        icon: BarChart2 },
    { to: '/admin/users',        label: 'Manage Users',     icon: Users     },
  ],
};

//Notification panel component
function NotifPanel({ onClose }) {
  //set state for notifications and unread count, and ref for panel
  const [notifs, setNotifs]   = useState([]);
  const [unread, setUnread]   = useState(0);
  const panelRef              = useRef(null);

  //fetch notifications on mount
  useEffect(() => {
    api.get('/notifications').then(res => {
      setNotifs(res.data.notifications);
      setUnread(res.data.unread);
    });
  }, []);

  //mark all notifications as read
  const markRead = async () => {
    await api.patch('/notifications/read');
    setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

  //close panel when clicking outside
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  //render notification panel
  return (
    <div className="notif-panel" ref={panelRef}>
      <div className="notif-header">
        <span>Notifications {unread > 0 && <span style={{ color: 'var(--danger)' }}>({unread})</span>}</span>
        {unread > 0 && <button className="btn btn-sm btn-secondary" onClick={markRead}>Mark all read</button>}
      </div>
      {notifs.length === 0 ? (
        <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.855rem' }}>No notifications</div>
      ) : (
        notifs.map(n => (
          <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
            <p className="notif-msg">{n.message}</p>
            <p className="notif-time"><TimeAgo date={n.created_at} /></p>
          </div>
        ))
      )}
    </div>
  );
}

//sidebar component
export default function Sidebar() {

  //fetch user data, handle logout, and manage notification state
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [open, setOpen]           = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navItems = navByRole[user?.role] || [];

    //poll for unread notifications every minute
  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(res => setUnreadCount(res.data.unread)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications').then(res => setUnreadCount(res.data.unread)).catch(() => {});
    }, 60000); // poll every minute
    return () => clearInterval(interval);
  }, [user]);

  //get user initials for avatar
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div>
      {/* ── Mobile top bar with hamburger ── */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <span className="mobile-topbar-title">💬 Hello College</span>
        {/* Notification bell on topbar for mobile */}
        <div style={{ position: 'relative' }}>
          <button
            className="hamburger"
            onClick={() => setShowNotif(v => !v)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: 8, height: 8, background: 'var(--danger)',
                borderRadius: '50%', display: 'block',
              }} />
            )}
          </button>
          {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}
        </div>
      </div>
      {/* ── Overlay (mobile) ── */}
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={() => setOpen(false)}
      />
    <aside className="sidebar">
      {/* Sidebar header with logo and user role badge */}
      <div className="sidebar-header">
        <div className="sidebar-logo"><Logo width={200} /></div>
        <div className="sidebar-badge">{user?.role}</div>
        {/* Close button — only visible on mobile */}
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
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
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Notifications */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <button
            className="logout-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
            onClick={() => setShowNotif(v => !v)}
          >
            <Bell size={14} />
            Notifications
            {unreadCount > 0 && (
              <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', borderRadius: '10px', padding: '0 5px' }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}
        </div>
        
        {/* User Info and Logout */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={13} style={{ display: 'inline', marginRight: 5 }} />
          Sign out
        </button>
      </div>
    </aside>
    ,/</div>
  );
}
