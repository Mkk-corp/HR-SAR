import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { create, updateStatus } from '../../api/transfers.api';
import { getAll as getEmployees } from '../../api/employees.api';
import { getAll as getFacilities } from '../../api/facilities.api';

const EMPTY = {
  employeeId: '', transferType: 'internal',
  fromFacilityId: '', toFacilityId: '', notes: '',
};

export default function TransferModal({ isOpen, onClose, transfer, mode, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [statusForm, setStatusForm] = useState({ status: 'approved', notes: '' });
  const [employees, setEmployees] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isStatusMode = mode === 'status';
  const isEdit = !!transfer && !isStatusMode;

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (isStatusMode) {
      setStatusForm({ status: transfer?.status || 'approved', notes: '' });
      return;
    }
    setForm(transfer ? {
      employeeId: transfer.employeeId || '',
      transferType: transfer.transferType || 'internal',
      fromFacilityId: transfer.fromFacilityId || '',
      toFacilityId: transfer.toFacilityId || '',
      notes: transfer.notes || '',
    } : EMPTY);
    Promise.all([
      getEmployees().then((r) => Array.isArray(r) ? r : (r?.items || [])),
      getFacilities().then((r) => Array.isArray(r) ? r : (r?.items || [])),
    ]).then(([emps, facs]) => { setEmployees(emps); setFacilities(facs); }).catch(() => {});
  }, [isOpen, transfer, isStatusMode]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isStatusMode) {
        await updateStatus(transfer.id, statusForm);
      } else {
        const dto = {
          ...form,
          fromFacilityId: form.fromFacilityId || null,
          toFacilityId: form.toFacilityId || null,
        };
        await create(dto);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isStatusMode) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="تحديث حالة الطلب" size="sm">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>الحالة الجديدة</label>
              <select value={statusForm.status} onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="pending_approval">قيد الاعتماد</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div className="form-group">
              <label>ملاحظات</label>
              <textarea rows={3} value={statusForm.notes} onChange={(e) => setStatusForm((p) => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'جاري الحفظ...' : 'تحديث الحالة'}</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="طلب نقل جديد">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group form-span-2">
              <label>الموظف <span className="required">*</span></label>
              <select value={form.employeeId} onChange={set('employeeId')} required>
                <option value="">-- اختر الموظف --</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>نوع النقل</label>
              <select value={form.transferType} onChange={set('transferType')}>
                <option value="internal">داخلي</option>
                <option value="external">خارجي</option>
              </select>
            </div>
            <div className="form-group">
              <label>من منشأة</label>
              <select value={form.fromFacilityId} onChange={set('fromFacilityId')}>
                <option value="">-- اختر المنشأة --</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>إلى منشأة</label>
              <select value={form.toFacilityId} onChange={set('toFacilityId')}>
                <option value="">-- اختر المنشأة --</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group form-span-2">
              <label>ملاحظات</label>
              <textarea rows={3} value={form.notes} onChange={set('notes')} style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'إنشاء الطلب'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
