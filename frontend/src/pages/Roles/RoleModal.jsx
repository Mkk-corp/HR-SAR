import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import { create, update, getById, getAllPermissions } from '../../api/roles.api';

const PERM_LABELS = {
  employees: 'الموظفون',
  facilities: 'المنشآت',
  transfers: 'الخدمات / النقل',
  users: 'المستخدمون',
  roles: 'الأدوار',
  reports: 'التقارير',
  dashboard: 'لوحة التحكم',
};

function groupPermissions(perms) {
  const groups = {};
  for (const p of perms) {
    const [cat] = p.split('.');
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }
  return groups;
}

function permLabel(perm) {
  const actionMap = { view: 'عرض', create: 'إنشاء', edit: 'تعديل', delete: 'حذف', export: 'تصدير' };
  const action = perm.split('.')[1] || perm;
  return actionMap[action] || action;
}

export default function RoleModal({ isOpen, onClose, role, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [allPerms, setAllPerms] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!role;

  const groups = useMemo(() => groupPermissions(allPerms), [allPerms]);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    getAllPermissions()
      .then((r) => setAllPerms(Array.isArray(r) ? r : (r?.permissions || Object.values(r || {}).flat())))
      .catch(() => {});

    if (isEdit) {
      setForm({ name: role.name || '', description: role.description || '' });
      getById(role.id)
        .then((detail) => {
          const perms = detail?.permissions || [];
          setSelected(new Set(perms));
        })
        .catch(() => {});
    } else {
      setForm({ name: '', description: '' });
      setSelected(new Set());
    }
  }, [isOpen, role, isEdit]);

  const togglePerm = (perm) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(perm)) n.delete(perm); else n.add(perm);
      return n;
    });
  };

  const toggleGroup = (cat, perms) => {
    const allSelected = perms.every((p) => selected.has(p));
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelected) perms.forEach((p) => n.delete(p));
      else perms.forEach((p) => n.add(p));
      return n;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto = { ...form, permissions: Array.from(selected) };
      if (isEdit) await update(role.id, dto);
      else await create(dto);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل الدور' : 'إنشاء دور جديد'} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div className="form-group">
              <label>اسم الدور <span className="required">*</span></label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="مشرف الموارد البشرية" />
            </div>
            <div className="form-group">
              <label>الوصف</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر للدور" />
            </div>
          </div>

          <p className="form-section-label">الصلاحيات</p>
          {allPerms.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>لا توجد صلاحيات متاحة</p>
          ) : (
            <div className="permissions-grid">
              {Object.entries(groups).map(([cat, perms]) => {
                const allSel = perms.every((p) => selected.has(p));
                const someSel = perms.some((p) => selected.has(p));
                return (
                  <div key={cat} className="perm-group">
                    <div className="perm-group-header">
                      <label>
                        <input
                          type="checkbox"
                          checked={allSel}
                          ref={(el) => { if (el) el.indeterminate = !allSel && someSel; }}
                          onChange={() => toggleGroup(cat, perms)}
                          style={{ width: 15, height: 15 }}
                        />
                        {PERM_LABELS[cat] || cat}
                      </label>
                    </div>
                    <div className="perm-items">
                      {perms.map((p) => (
                        <label key={p} className="perm-item">
                          <input
                            type="checkbox"
                            checked={selected.has(p)}
                            onChange={() => togglePerm(p)}
                            style={{ width: 14, height: 14 }}
                          />
                          {permLabel(p)}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إنشاء الدور')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
