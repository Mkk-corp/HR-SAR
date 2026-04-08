import React from 'react';

export default function Badge({ variant = 'secondary', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
