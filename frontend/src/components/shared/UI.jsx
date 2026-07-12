import React from 'react';
import { formatDistanceToNow } from 'date-fns';

//displays a badge for the status of a complaint
export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status?.replace('_', ' ')}</span>
);

//displays a badge for the priority of a complaint
export const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

//displays a badge for the anonymity status of a user
export const AnonBadge = ({ isAnonymous }) => (
  <span className={`badge badge-${isAnonymous ? 'anon' : 'named'}`}>
    {isAnonymous ? '🎭 Anonymous' : '👤 Named'}
  </span>
);

//displays a badge for the role of a user
export const RoleBadge = ({ role }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

//time ago component that shows how long ago a date was
export const TimeAgo = ({ date }) => (
  <span title={new Date(date).toLocaleString()}>
    {formatDistanceToNow(new Date(date), { addSuffix: true })}
  </span>
);

//displays an empty page
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon || '📭'}</div>
    <div className="empty-state-title">{title}</div>
    {/*conditionally render description and action if they are provided */}
    {description && <p className="empty-state-desc">{description}</p>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

//spinner component that shows a loading state
export const Spinner = ({ text = 'Loading…' }) => (
  <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
    {text}
  </div>
);

//section label component that displays a label for a section
export const SectionLabel = ({ children }) => (
  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
    {children}
  </p>
);

//displays a respnse from teacher or admin.
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
