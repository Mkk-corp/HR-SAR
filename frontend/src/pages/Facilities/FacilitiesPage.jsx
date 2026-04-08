import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAll, remove } from '../../api/facilities.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FacilityModal from './FacilityModal';
import styles from './FacilitiesPage.module.css';

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll({ search })
      .then((res) => setFacilities(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      toast('تم حذف المنشأة بنجاح', 'success');
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
          <h3>قائمة المنشآت</h3>
          <div className="card-actions">
            <div className="search-wrapper">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="search-input" placeholder="بحث باسم المنشأة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {hasPermission('facilities.create') && (
              <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة منشأة
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div className={styles.loadingWrap}>جاري التحميل...</div>
          ) : facilities.length === 0 ? (
            <EmptyState message="لا توجد منشآت مطابقة للبحث" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>اسم المنشأة</th>
                  <th>رقم السجل التجاري</th>
                  <th>المنشأة الأم</th>
                  <th>عدد الموظفين</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => (
                  <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/facilities/${f.id}`)}>
                    <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{f.name}</td>
                    <td>{f.crNumber || '—'}</td>
                    <td>{f.parentName || '—'}</td>
                    <td>{f.employeeCount ?? '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-btns">
                        {hasPermission('facilities.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(f); setModalOpen(true); }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            تعديل
                          </button>
                        )}
                        {hasPermission('facilities.delete') && (
                          <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(f)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            </svg>
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

      <FacilityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        facility={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم تعديل المنشأة' : 'تمت إضافة المنشأة', 'success'); }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المنشأة"
        message={`هل أنت متأكد من حذف منشأة "${deleteTarget?.name}"؟`}
        loading={deleteLoading}
      />
    </div>
  );
}
