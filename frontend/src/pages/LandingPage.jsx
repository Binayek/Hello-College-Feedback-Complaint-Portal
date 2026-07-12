import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/shared/Logo';

export default function Landing() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo showTagline={true} width={300} /> 
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" style={{ padding: '0.45rem 1rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.875rem', color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
          <Link to="/register" style={{ padding: '0.45rem 1rem', background: 'var(--primary)', borderRadius: 6, fontSize: '0.875rem', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
            Create account
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '5rem 2rem 3.5rem' }}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.1rem' }}>
          Your voice,<br />heard and tracked
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
          A structured platform for students to share feedback, discuss ideas, and report concerns — with full privacy controls and real accountability.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ padding: '0.7rem 1.75rem', background: 'var(--primary)', borderRadius: 6, fontSize: '0.95rem', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
            Get started →
          </Link>
          <Link to="/login" style={{ padding: '0.7rem 1.75rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.95rem', color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>

      {/* Channels */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 2rem 3rem' }}>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Three ways to communicate
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '💬', title: 'Community board', desc: 'Open peer discussion. Post questions, share feedback, comment anonymously.', color: '#EFF6FF', border: '#BFDBFE' },
            { icon: '📋', title: 'Formal complaint', desc: 'Report concerns to administration. Tracked, assigned, and resolved.', color: '#FFFBEB', border: '#FDE68A' },
            { icon: '🛡️', title: 'Anonymous option', desc: 'Post without revealing your name. Identity only disclosed in legal cases.', color: '#F0FDF4', border: '#BBF7D0' },
          ].map(c => (
            <div key={c.title} style={{ background: c.color, border: `1px solid ${c.border}`, borderRadius: 10, padding: '1.5rem 1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{c.icon}</div>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.375rem', color: 'var(--text)' }}>{c.title}</h3>
              <p style={{ fontSize: '0.855rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div style={{ background: '#F9FAFB', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Built for everyone on campus
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { role: 'Student', color: '#2563EB', items: ['Post to community board', 'File formal complaints', 'Track complaint status', 'Stay anonymous'] },
              { role: 'Teacher', color: '#16A34A', items: ['View community board', 'Respond to assigned cases', 'Mark complaints resolved'] },
              { role: 'Admin',   color: '#D97706', items: ['Manage all complaints', 'Assign to teachers/faculty', 'View analytics dashboard', 'Moderate community'] },
            ].map(r => (
              <div key={r.role} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: r.color, marginBottom: '0.75rem' }}>{r.role}</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {r.items.map(item => (
                    <li key={item} style={{ fontSize: '0.855rem', color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: r.color, fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '0.855rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Hello College · Student Feedback & Complaint Portal
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <Link to="/register" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Create account</Link>
          <Link to="/login"    style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </div>
      </div>

    </div>
  );
}