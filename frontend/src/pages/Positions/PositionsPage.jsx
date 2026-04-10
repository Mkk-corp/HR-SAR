import React, { useEffect, useState, useCallback } from 'react';
import { getAll, remove } from '../../api/positions.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PositionModal from './PositionModal';

export default function PositionsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll({ status: statusFilter })
      .then((res) => setPositions(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      toast('تم الحذف بنجاح', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>المناصب الوظيفية</h3>
          <div className="card-actions">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            {hasPermission('positions.create') && (
              <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة منصب
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>جاري التحميل...</div>
          ) : positions.length === 0 ? (
            <EmptyState message="لا توجد مناصب" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>المسمى الوظيفي</th>
                  <th>الوحدة التنظيمية</th>
                  <th>المشرف</th>
                  <th>الطاقة / الشاغر</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const vacant = p.headcount - p.filledCount;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.jobTitleNameAr}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.jobTitleCode}</div>
                      </td>
                      <td>{p.orgUnitNameAr}</td>
                      <td>{p.managerJobTitleNameAr || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.filledCount}</span>
                        <span style={{ color: 'var(--text-3)' }}> / {p.headcount}</span>
                        {vacant > 0 && (
                          <Badge variant="warning" style={{ marginRight: 6 }}>{vacant} شاغر</Badge>
                        )}
                      </td>
                      <td><Badge variant={p.status === 'active' ? 'success' : 'secondary'}>{p.status === 'active' ? 'نشط' : 'غير نشط'}</Badge></td>
                      <td>
                        <div className="action-btns">
                          {hasPermission('positions.edit') && (
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(p); setModalOpen(true); }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              تعديل
                            </button>
                          )}
                          {hasPermission('positions.delete') && (
                            <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(p)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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

      <PositionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        position={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم التعديل' : 'تمت الإضافة', 'success'); }}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المنصب"
        message={`هل أنت متأكد من حذف منصب "${deleteTarget?.jobTitleNameAr}"؟`}
        loading={deleteLoading}
      />
    </div>
  );
}
