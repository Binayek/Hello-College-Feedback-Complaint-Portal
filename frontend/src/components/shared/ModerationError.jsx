import React from 'react';

/**
 * Parses a failed API response and returns a structured moderation error,
 * or null if this is not a moderation error.
 */
export function parseModerationError(err) {
  if (err?.response?.status !== 403) return null;
  const data = err.response.data;
  if (!data) return null;
  return {
    message: data.message || 'Your submission contains inappropriate content.',
    blockedWords: data.blockedWords || [],   // profanity matches
    aiReason: data.reason || null,           // AI moderation reason
  };
}

/**
 * Inline error box shown inside the form when content is rejected.
 * Pass the result of parseModerationError() as `error`.
 */
export default function ModerationError({ error }) {
  if (!error) return null;

  return (
    <div style={{
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: 8,
      padding: '0.875rem 1rem',
      marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '1rem' }}>🚫</span>
        <strong style={{ fontSize: '0.875rem', color: '#991B1B' }}>
          Submission blocked
        </strong>
      </div>

      <p style={{ fontSize: '0.835rem', color: '#B91C1C', marginBottom: error.blockedWords.length > 0 || error.aiReason ? '0.625rem' : 0 }}>
        {error.message}
      </p>

      {/* Profanity — show exact words */}
      {error.blockedWords.length > 0 && (
        <div style={{ marginBottom: error.aiReason ? '0.5rem' : 0 }}>
          <p style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 600, marginBottom: '0.25rem' }}>
            Blocked words detected:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {error.blockedWords.map((entry, i) => (
              // entry can be { field, words } (profanity structure) or a plain string
              typeof entry === 'object' && entry.words
                ? entry.words.map((w, j) => (
                    <span key={`${i}-${j}`} style={{
                      background: '#FEE2E2', color: '#991B1B',
                      padding: '2px 8px', borderRadius: 20,
                      fontSize: '0.78rem', fontWeight: 500,
                    }}>
                      {w}
                    </span>
                  ))
                : (
                  <span key={i} style={{
                    background: '#FEE2E2', color: '#991B1B',
                    padding: '2px 8px', borderRadius: 20,
                    fontSize: '0.78rem', fontWeight: 500,
                  }}>
                    {entry}
                  </span>
                )
            ))}
          </div>
        </div>
      )}

      {/* AI moderation reason */}
      {error.aiReason && (
        <p style={{ fontSize: '0.8rem', color: '#991B1B', marginTop: '0.25rem' }}>
          <span style={{ fontWeight: 600 }}>AI review: </span>{error.aiReason}
        </p>
      )}

      <p style={{ fontSize: '0.78rem', color: '#B91C1C', marginTop: '0.5rem', opacity: 0.8 }}>
        Please edit your content and try again.
      </p>
    </div>
  );
}
