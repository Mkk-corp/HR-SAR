import React, { useEffect, useState, useCallback } from 'react';
import { getAll, remove } from '../../api/roles.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RoleModal from './RoleModal';
import styles from './RolesPage.module.css';

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll()
      .then((res) => setRoles(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      toast('تم حذف الدور', 'success');
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
          <h3>الأدوار والصلاحيات</h3>
          <div className="card-actions">
            {hasPermission('roles.create') && (
              <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إنشاء دور
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div className={styles.loadingWrap}>جاري التحميل...</div>
          ) : roles.length === 0 ? (
            <EmptyState message="لا توجد أدوار بعد" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>اسم الدور</th>
                  <th>الوصف</th>
                  <th>الصلاحيات</th>
                  <th>المستخدمون</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{r.description || '—'}</td>
                    <td><Badge variant="blue">{r.permissionCount ?? (r.permissions?.length ?? 0)} صلاحية</Badge></td>
                    <td><Badge variant="purple">{r.userCount ?? 0} مستخدم</Badge></td>
                    <td>
                      <div className="action-btns">
                        {hasPermission('roles.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(r); setModalOpen(true); }}>تعديل</button>
                        )}
                        {hasPermission('roles.delete') && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                            onClick={() => setDeleteTarget(r)}
                            disabled={(r.userCount ?? 0) > 0}
                            title={(r.userCount ?? 0) > 0 ? 'لا يمكن حذف دور مرتبط بمستخدمين' : ''}
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RoleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        role={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم تعديل الدور' : 'تم إنشاء الدور', 'success'); }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الدور"
        message={`هل أنت متأكد من حذف دور "${deleteTarget?.name}"؟`}
        loading={deleteLoading}
      />
    </div>
  );
}
