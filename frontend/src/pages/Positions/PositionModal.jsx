import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { create, update } from '../../api/positions.api';
import { getAll as getOrgUnits } from '../../api/orgUnits.api';
import { getAll as getJobTitles } from '../../api/jobTitles.api';
import { getAll as getPositions } from '../../api/positions.api';

const EMPTY = { jobTitleId: '', orgUnitId: '', managerPositionId: '', headcount: 1, status: 'active' };

export default function PositionModal({ isOpen, onClose, position, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [orgUnits, setOrgUnits] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!position;

  useEffect(() => {
    if (isOpen) {
      setForm(position ? {
        jobTitleId:        position.jobTitleId || '',
        orgUnitId:         position.orgUnitId || '',
        managerPositionId: position.managerPositionId || '',
        headcount:         position.headcount || 1,
        status:            position.status || 'active',
      } : EMPTY);
      setError('');
      Promise.all([
        getOrgUnits({ status: 'active' }),
        getJobTitles({}),
        getPositions({ status: 'active' }),
      ]).then(([units, titles, pos]) => {
        setOrgUnits(Array.isArray(units) ? units : []);
        setJobTitles(Array.isArray(titles) ? titles : []);
        setPositions((Array.isArray(pos) ? pos : []).filter((p) => !position || p.id !== position.id));
      }).catch(() => {});
    }
  }, [isOpen, position]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto = {
        ...form,
        headcount:         Number(form.headcount),
        managerPositionId: form.managerPositionId || null,
      };
      if (isEdit) await update(position.id, dto);
      else await create(dto);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل المنصب' : 'إضافة منصب'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>المسمى الوظيفي <span className="required">*</span></label>
              <select value={form.jobTitleId} onChange={set('jobTitleId')} required>
                <option value="">-- اختر المسمى --</option>
                {jobTitles.map((jt) => <option key={jt.id} value={jt.id}>{jt.nameAr} ({jt.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>الوحدة التنظيمية <span className="required">*</span></label>
              <select value={form.orgUnitId} onChange={set('orgUnitId')} required>
                <option value="">-- اختر الوحدة --</option>
                {orgUnits.map((u) => <option key={u.id} value={u.id}>{u.nameAr}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>الطاقة الاستيعابية <span className="required">*</span></label>
              <input type="number" min="1" value={form.headcount} onChange={set('headcount')} required />
            </div>
            <div className="form-group">
              <label>الحالة</label>
              <select value={form.status} onChange={set('status')}>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div className="form-group form-span-2">
              <label>المنصب المشرف</label>
              <select value={form.managerPositionId} onChange={set('managerPositionId')}>
                <option value="">-- لا يوجد مشرف --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.jobTitleNameAr} — {p.orgUnitNameAr}</option>
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
