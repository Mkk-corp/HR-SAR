import React, { useEffect, useState, useCallback } from 'react';
import { getAll, remove, resetPassword } from '../../api/users.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import UserModal from './UserModal';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll()
      .then((res) => setUsers(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      toast('تم حذف المستخدم', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await resetPassword(resetTarget.id, { newPassword: resetPwd });
      toast('تم تغيير كلمة المرور', 'success');
      setResetTarget(null);
      setResetPwd('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="card">
        <div className="card-header">
          <h3>إدارة المستخدمين</h3>
          <div className="card-actions">
            {hasPermission('users.create') && (
              <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة مستخدم
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div className={styles.loadingWrap}>جاري التحميل...</div>
          ) : users.length === 0 ? (
            <EmptyState message="لا يوجد مستخدمون" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="emp-cell">
                        <Avatar name={u.fullName || u.email || ''} />
                        <div>
                          <div className="emp-name">{u.fullName || '—'}</div>
                          <div className="emp-email">{u.jobTitle || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.roleName ? <Badge variant="purple">{u.roleName}</Badge> : '—'}</td>
                    <td><Badge variant={u.isActive !== false ? 'success' : 'secondary'}>{u.isActive !== false ? 'نشط' : 'معطل'}</Badge></td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</td>
                    <td>
                      <div className="action-btns">
                        {hasPermission('users.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(u); setModalOpen(true); }}>تعديل</button>
                        )}
                        {hasPermission('users.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setResetTarget(u); setResetPwd(''); }}>
                            كلمة المرور
                          </button>
                        )}
                        {hasPermission('users.delete') && (
                          <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(u)}>حذف</button>
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

      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم تعديل المستخدم' : 'تمت إضافة المستخدم', 'success'); }}
      />

      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="إعادة تعيين كلمة المرور" size="sm">
        <form onSubmit={handleResetPassword}>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>تغيير كلمة مرور: <strong>{resetTarget?.fullName || resetTarget?.email}</strong></p>
            <div className="form-group">
              <label>كلمة المرور الجديدة <span className="required">*</span></label>
              <input type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} required placeholder="••••••••" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setResetTarget(null)} disabled={resetLoading}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={resetLoading}>{resetLoading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fullName || deleteTarget?.email}"؟`}
        loading={deleteLoading}
      />
    </div>
  );
}
