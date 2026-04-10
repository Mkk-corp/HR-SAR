import React, { useEffect, useState, useCallback } from 'react';
import { getAll, remove } from '../../api/jobTitles.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import JobTitleModal from './JobTitleModal';

const LEVEL_VARIANTS = { Junior: 'secondary', Senior: 'blue', Manager: 'purple' };

export default function JobTitlesPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll({ search })
      .then((res) => setJobTitles(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search]);

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
          <h3>المسميات الوظيفية</h3>
          <div className="card-actions">
            <div className="search-wrapper">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="search-input" placeholder="بحث بالاسم أو الكود..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {hasPermission('job-titles.create') && (
              <button className="btn btn-primary" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة مسمى
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>جاري التحميل...</div>
          ) : jobTitles.length === 0 ? (
            <EmptyState message="لا توجد مسميات وظيفية" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>المسمى</th>
                  <th>الكود</th>
                  <th>المستوى</th>
                  <th>كود Qiwa</th>
                  <th>عدد المناصب</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {jobTitles.map((jt) => (
                  <tr key={jt.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{jt.nameAr}</div>
                      {jt.nameEn && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{jt.nameEn}</div>}
                    </td>
                    <td><code style={{ fontSize: 12, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{jt.code}</code></td>
                    <td>{jt.level ? <Badge variant={LEVEL_VARIANTS[jt.level] || 'secondary'}>{jt.level}</Badge> : '—'}</td>
                    <td>{jt.classificationCode || '—'}</td>
                    <td>{jt.positionCount}</td>
                    <td>
                      <div className="action-btns">
                        {hasPermission('job-titles.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(jt); setModalOpen(true); }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            تعديل
                          </button>
                        )}
                        {hasPermission('job-titles.delete') && (
                          <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(jt)}>
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

      <JobTitleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        jobTitle={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم التعديل' : 'تمت الإضافة', 'success'); }}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المسمى الوظيفي"
        message={`هل أنت متأكد من حذف "${deleteTarget?.nameAr}"؟`}
        loading={deleteLoading}
      />
    </div>
  );
}
