import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const PAGE_TITLES = {
  '/': 'لوحة التحكم',
  '/employees': 'الموظفون',
  '/facilities': 'المنشآت',
  '/transfers': 'الخدمات',
  '/reports': 'التقارير',
  '/users': 'إدارة المستخدمين',
  '/roles': 'الأدوار والصلاحيات',
  '/profile': 'الملف الشخصي',
  '/org-units': 'الهيكل التنظيمي',
  '/job-titles': 'المسميات الوظيفية',
  '/positions': 'المناصب الوظيفية',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] || 'نظام الموارد البشرية';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      right: 'var(--sidebar-w)',
      left: 0,
      height: 'var(--topbar-h)',
      background: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 26px',
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px', borderRadius: '10px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'border-color .15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Avatar name={user?.fullName || user?.email || 'U'} src={user?.photoUrl || null} size={28} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
            {user?.fullName || user?.email || 'المستخدم'}
          </span>
        </div>
      </div>
    </header>
  );
}
