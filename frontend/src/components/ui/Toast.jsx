import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const configs = {
    success: { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', icon: '✓' },
    error: { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5', icon: '✕' },
    warning: { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', icon: '!' },
    info: { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', icon: 'ℹ' },
  };
  const cfg = configs[toast.type] || configs.info;

  return (
    <div
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '13.5px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,.1)',
        pointerEvents: 'all',
        cursor: 'pointer',
        minWidth: '260px',
        maxWidth: '380px',
        animation: 'slideInToast .2s ease',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: cfg.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, flexShrink: 0,
      }}>{cfg.icon}</span>
      {toast.message}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.addToast;
}
