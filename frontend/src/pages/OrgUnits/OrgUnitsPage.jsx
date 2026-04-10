import React, { useEffect, useState, useCallback } from 'react';
import { getAll, remove } from '../../api/orgUnits.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import OrgUnitModal from './OrgUnitModal';

const TYPE_LABELS = { Division: 'إدارة', Department: 'قسم', Section: 'شعبة', Unit: 'وحدة' };
const TYPE_VARIANTS = { Division: 'blue', Department: 'purple', Section: 'orange', Unit: 'secondary' };

export default function OrgUnitsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll({ search, type: typeFilter })
      .then((res) => setUnits(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

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
          <h3>الوحدات التنظيمية</h3>
          <div className="card-actions">
            <div className="search-wrapper">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="search-input" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">جميع الأنواع</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {hasPermission('org-units.create') && (
              <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة وحدة
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>جاري التحميل...</div>
          ) : units.length === 0 ? (
            <EmptyState message="لا توجد وحدات تنظيمية" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>الوحدة الأم</th>
                  <th>المناصب</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.nameAr}</div>
                      {u.nameEn && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.nameEn}</div>}
                    </td>
                    <td><Badge variant={TYPE_VARIANTS[u.type] || 'secondary'}>{TYPE_LABELS[u.type] || u.type}</Badge></td>
                    <td>{u.parentNameAr || '—'}</td>
                    <td>{u.positionCount}</td>
                    <td><Badge variant={u.status === 'active' ? 'success' : 'secondary'}>{u.status === 'active' ? 'نشط' : 'غير نشط'}</Badge></td>
                    <td>
                      <div className="action-btns">
                        {hasPermission('org-units.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(u); setModalOpen(true); }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            تعديل
                          </button>
                        )}
                        {hasPermission('org-units.delete') && (
                          <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(u)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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

      <OrgUnitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        unit={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم التعديل' : 'تمت الإضافة', 'success'); }}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الوحدة التنظيمية"
        message={`هل أنت متأكد من حذف "${deleteTarget?.nameAr}"؟`}
        loading={deleteLoading}
      />
    </div>
  );
}
