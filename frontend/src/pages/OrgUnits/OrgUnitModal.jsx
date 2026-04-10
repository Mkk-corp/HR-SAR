import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { create, update, getAll } from '../../api/orgUnits.api';

const TYPES = ['Division', 'Department', 'Section', 'Unit'];
const TYPE_LABELS = { Division: 'إدارة', Department: 'قسم', Section: 'شعبة', Unit: 'وحدة' };
const EMPTY = { nameAr: '', nameEn: '', type: 'Department', parentId: '', status: 'active' };

export default function OrgUnitModal({ isOpen, onClose, unit, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!unit;

  useEffect(() => {
    if (isOpen) {
      setForm(unit ? {
        nameAr:   unit.nameAr || '',
        nameEn:   unit.nameEn || '',
        type:     unit.type || 'Department',
        parentId: unit.parentId || '',
        status:   unit.status || 'active',
      } : EMPTY);
      setError('');
      getAll()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.items || []);
          setAllUnits(list.filter((u) => !unit || u.id !== unit.id));
        })
        .catch(() => {});
    }
  }, [isOpen, unit]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto = { ...form, parentId: form.parentId || null };
      if (isEdit) await update(unit.id, dto);
      else await create(dto);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parentCandidates = allUnits.filter((u) => {
    const typeOrder = ['Division', 'Department', 'Section', 'Unit'];
    const parentIdx = typeOrder.indexOf(u.type);
    const currentIdx = typeOrder.indexOf(form.type);
    return parentIdx < currentIdx;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل الوحدة التنظيمية' : 'إضافة وحدة تنظيمية'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>الاسم بالعربية <span className="required">*</span></label>
              <input value={form.nameAr} onChange={set('nameAr')} required placeholder="إدارة الموارد البشرية" />
            </div>
            <div className="form-group">
              <label>الاسم بالإنجليزية</label>
              <input value={form.nameEn} onChange={set('nameEn')} placeholder="Human Resources" />
            </div>
            <div className="form-group">
              <label>النوع <span className="required">*</span></label>
              <select value={form.type} onChange={set('type')}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>الحالة</label>
              <select value={form.status} onChange={set('status')}>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div className="form-group form-span-2">
              <label>الوحدة الأم</label>
              <select value={form.parentId} onChange={set('parentId')}>
                <option value="">-- لا توجد وحدة أم --</option>
                {parentCandidates.map((u) => (
                  <option key={u.id} value={u.id}>{TYPE_LABELS[u.type]} — {u.nameAr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
