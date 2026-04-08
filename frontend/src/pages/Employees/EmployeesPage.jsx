import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAll, remove } from '../../api/employees.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmployeeModal from './EmployeeModal';
import styles from './EmployeesPage.module.css';

const STATUS_VARIANTS = {
  'نشط': 'success',
  'غير نشط': 'secondary',
  'خروج نهائي': 'danger',
  'خروج مؤقت': 'warning',
  'اجازة': 'orange',
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    getAll({ search, status: statusFilter })
      .then((res) => setEmployees(Array.isArray(res) ? res : (res?.items || [])))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = () => { setEditTarget(null); setModalOpen(true); };
  const handleEdit = (emp) => { setEditTarget(emp); setModalOpen(true); };
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      toast('تم حذف الموظف بنجاح', 'success');
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
          <h3>قائمة الموظفين</h3>
          <div className="card-actions">
            <div className="search-wrapper">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="search-input"
                placeholder="بحث بالاسم أو الرمز..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
              <option value="خروج نهائي">خروج نهائي</option>
              <option value="خروج مؤقت">خروج مؤقت</option>
              <option value="اجازة">اجازة</option>
            </select>
            {hasPermission('employees.create') && (
              <button className="btn btn-primary" onClick={handleAdd}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                إضافة موظف
              </button>
            )}
          </div>
        </div>
        <div className="card-body p0">
          {loading ? (
            <div className={styles.loadingWrap}>جاري التحميل...</div>
          ) : employees.length === 0 ? (
            <EmptyState message="لا يوجد موظفون مطابقون للبحث" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الرمز</th>
                  <th>الجنسية</th>
                  <th>المنشأة</th>
                  <th>الراتب</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}`)}>
                    <td>
                      <div className="emp-cell">
                        <Avatar name={emp.name || emp.fullName || ''} />
                        <div>
                          <div className="emp-name" style={{ color: 'var(--primary)' }}>{emp.name || emp.fullName}</div>
                          <div className="emp-email">{emp.jobTitle || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.employeeCode || '—'}</td>
                    <td>{emp.nationality || '—'}</td>
                    <td>{emp.facilityName || '—'}</td>
                    <td>{emp.salary ? Number(emp.salary).toLocaleString('ar-SA') + ' ر.س' : '—'}</td>
                    <td><Badge variant={STATUS_VARIANTS[emp.status] || 'secondary'}>{emp.status || '—'}</Badge></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-btns">
                        {hasPermission('employees.edit') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(emp)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            تعديل
                          </button>
                        )}
                        {hasPermission('employees.delete') && (
                          <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setDeleteTarget(emp)}>
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

      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editTarget}
        onSaved={() => { setModalOpen(false); loadData(); toast(editTarget ? 'تم تعديل الموظف' : 'تمت إضافة الموظف', 'success'); }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف الموظف"
        message={`هل أنت متأكد من حذف الموظف "${deleteTarget?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleteLoading}
      />
    </div>
  );
}
