import React from 'react';

export default function EmptyState({ message = 'لا توجد بيانات', icon, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {icon || (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
      </div>
      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-2)' }}>{message}</p>
      {action && action}
    </div>
  );
}
