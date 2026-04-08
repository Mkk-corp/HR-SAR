import React, { useEffect, useState, useCallback } from 'react';
import { getAll, remove } from '../../api/transfers.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TransferModal from './TransferModal';
import styles from './TransfersPage.module.css';

const STATUS_MAP = {
  draft: { label: 'مسودة', variant: 'secondary' },
  pending_approval: { label: 'قيد الاعتماد', variant: 'warning' },
  approved: { label: 'معتمد', variant: 'success' },
  pending_government: { label: 'انتظار حكومي', variant: 'blue' },
  completed: { label: 'مكتمل', variant: 'teal' },
  rejected: { label: 'مرفوض', variant: 'danger' },
  cancelled: { label: 'ملغي', variant: 'secondary' },
};

export default function TransfersPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [activeTransfer, setActiveTransfer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll({ status: statusFilter })
      .then((res) => setTransfers(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setActiveTransfer(null); setModalMode('create'); setModalOpen(true); };
  const openStatus = (t) => { setActiveTransfer(t); setModalMode('status'); setModalOpen(true); };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      toast('تم حذف الطلب بنجاح', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="card">
        <div className="card-header">
          <h3>طلبات النقل</h3>
          <div className="card-actions">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">جميع الحالات</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {hasPermission('transfers.create') && (
              <button className="btn btn-primary" onClick={openCreate}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                طلب نقل جديد
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div className={styles.loadingWrap}>جاري التحميل...</div>
          ) : transfers.length === 0 ? (
            <EmptyState message="لا توجد طلبات نقل" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>تاريخ الطلب</th>
                  <th>الموظف</th>
                  <th>النوع</th>
                  <th>من منشأة</th>
                  <th>إلى منشأة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => {
                  const st = STATUS_MAP[t.status] || { label: t.status, variant: 'secondary' };
                  return (
                    <tr key={t.id}>
                      <td>{t.transferDate ? new Date(t.transferDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</td>
                      <td>{t.employeeName || '—'}</td>
                      <td>{t.transferType === 'internal' ? 'داخلي' : 'خارجي'}</td>
                      <td>{t.fromFacilityName || '—'}</td>
                      <td>{t.toFacilityName || '—'}</td>
                      <td><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td>
                        <div className="action-btns">
                          {hasPermission('transfers.edit') && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openStatus(t)}>
                              تحديث الحالة
                            </button>
                          )}
                          {hasPermission('transfers.delete') && (
                            <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(t)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              </svg>
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TransferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transfer={activeTransfer}
        mode={modalMode}
        onSaved={() => { setModalOpen(false); loadData(); toast('تم الحفظ بنجاح', 'success'); }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الطلب"
        message="هل أنت متأكد من حذف هذا الطلب؟"
        loading={deleteLoading}
      />
    </div>
  );
}
