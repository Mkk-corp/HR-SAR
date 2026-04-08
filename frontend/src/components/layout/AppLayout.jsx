import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        marginRight: 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <TopBar />
        <main style={{
          marginTop: 'var(--topbar-h)',
          padding: '26px',
          flex: 1,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
