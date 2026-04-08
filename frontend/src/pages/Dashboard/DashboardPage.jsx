import React, { useEffect, useState } from 'react';
import { getDashboard } from '../../api/dashboard.api';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import styles from './DashboardPage.module.css';

const TRANSFER_STATUS_MAP = {
  draft: { label: 'مسودة', variant: 'secondary' },
  pending_approval: { label: 'قيد الاعتماد', variant: 'warning' },
  approved: { label: 'معتمد', variant: 'success' },
  pending_government: { label: 'انتظار حكومي', variant: 'blue' },
  completed: { label: 'مكتمل', variant: 'teal' },
  rejected: { label: 'مرفوض', variant: 'danger' },
  cancelled: { label: 'ملغي', variant: 'secondary' },
};

function StatCard({ icon, iconColor, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconColor}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loadingWrap}>جاري التحميل...</div>;
  }

  const stats = data || {};
  const transfers = stats.recentTransfers || [];

  return (
    <div>
      <div className={styles.statsGrid}>
        <StatCard
          iconColor="blue"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          value={Number(stats.totalEmployees || 0).toLocaleString('ar-SA')}
          label="إجمالي الموظفين"
        />
        <StatCard
          iconColor="green"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
          }
          value={Number(stats.activeEmployees || 0).toLocaleString('ar-SA')}
          label="الموظفون النشطون"
        />
        <StatCard
          iconColor="purple"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
          value={Number(stats.totalFacilities || 0).toLocaleString('ar-SA')}
          label="إجمالي المنشآت"
        />
        <StatCard
          iconColor="orange"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
          value={Number(stats.totalSalary || 0).toLocaleString('ar-SA')}
          label="إجمالي الرواتب (ريال)"
        />
      </div>

      <div className={`card ${styles.recentSection}`}>
        <div className="card-header">
          <h3>آخر التحويلات</h3>
        </div>
        <div className="card-body p0">
          {transfers.length === 0 ? (
            <EmptyState message="لا توجد تحويلات حديثة" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>النوع</th>
                  <th>من منشأة</th>
                  <th>إلى منشأة</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {transfers.slice(0, 5).map((t) => {
                  const st = TRANSFER_STATUS_MAP[t.status] || { label: t.status, variant: 'secondary' };
                  return (
                    <tr key={t.id}>
                      <td>{t.employeeName || '—'}</td>
                      <td>{t.transferType === 'internal' ? 'داخلي' : 'خارجي'}</td>
                      <td>{t.fromFacilityName || '—'}</td>
                      <td>{t.toFacilityName || '—'}</td>
                      <td>{t.transferDate ? new Date(t.transferDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</td>
                      <td><Badge variant={st.variant}>{st.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
