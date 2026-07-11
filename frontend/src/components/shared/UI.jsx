import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status?.replace('_', ' ')}</span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

export const AnonBadge = ({ isAnonymous }) => (
  <span className={`badge badge-${isAnonymous ? 'anon' : 'named'}`}>
    {isAnonymous ? '🎭 Anonymous' : '👤 Named'}
  </span>
);

export const RoleBadge = ({ role }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

export const TimeAgo = ({ date }) => (
  <span title={new Date(date).toLocaleString()}>
    {formatDistanceToNow(new Date(date), { addSuffix: true })}
  </span>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon || '📭'}</div>
    <div className="empty-state-title">{title}</div>
    {description && <p className="empty-state-desc">{description}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

export const Spinner = ({ text = 'Loading…' }) => (
  <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
    {text}
  </div>
);

export const SectionLabel = ({ children }) => (
  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
    {children}
  </p>
);

export const ResponseBox = ({ content, author, time, color = '#EFF6FF', borderColor = 'var(--primary)' }) => (
  <div style={{ background: color, padding: '1rem', borderRadius: 6, borderLeft: `3px solid ${borderColor}` }}>
    <p style={{ fontSize: '0.875rem' }}>{content}</p>
    {(author || time) && (
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
        {author && <span>{author}</span>}{author && time && ' · '}{time && <TimeAgo date={time} />}
      </p>
    )}
  </div>
);
