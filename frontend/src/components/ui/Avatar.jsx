import React from 'react';

const COLORS = ['#2563EB','#7C3AED','#10B981','#F59E0B','#EF4444','#0891B2','#DB2777','#65A30D'];

export function avatarColor(name = '') {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function Avatar({ name = '', size = 33, src = null, className = '' }) {
  const bg = avatarColor(name);
  const letter = name ? name.trim()[0] : '?';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`emp-avatar ${className}`}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }}
      />
    );
  }
  return (
    <div
      className={`emp-avatar ${className}`}
      style={{ background: bg, width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </div>
  );
}
