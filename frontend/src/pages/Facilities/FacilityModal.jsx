import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { create, update, getAll } from '../../api/facilities.api';

const EMPTY = { name: '', crNumber: '', parentId: '', address: '', phone: '', email: '' };

export default function FacilityModal({ isOpen, onClose, facility, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [allFacilities, setAllFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!facility;

  useEffect(() => {
    if (isOpen) {
      setForm(facility ? {
        name: facility.name || '',
        crNumber: facility.crNumber || '',
        parentId: facility.parentId || '',
        address: facility.address || '',
        phone: facility.phone || '',
        email: facility.email || '',
      } : EMPTY);
      setError('');
      getAll()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.items || []);
          setAllFacilities(list.filter((f) => !facility || f.id !== facility.id));
        })
        .catch(() => {});
    }
  }, [isOpen, facility]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto = { ...form, parentId: form.parentId || null };
      if (isEdit) await update(facility.id, dto);
      else await create(dto);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل المنشأة' : 'إضافة منشأة جديدة'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>اسم المنشأة <span className="required">*</span></label>
              <input value={form.name} onChange={set('name')} required placeholder="شركة الفارس" />
            </div>
            <div className="form-group">
              <label>رقم السجل التجاري</label>
              <input value={form.crNumber} onChange={set('crNumber')} placeholder="1234567890" />
            </div>
            <div className="form-group">
              <label>المنشأة الأم</label>
              <select value={form.parentId} onChange={set('parentId')}>
                <option value="">-- لا توجد منشأة أم --</option>
                {allFacilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input value={form.phone} onChange={set('phone')} placeholder="0112345678" />
            </div>
            <div className="form-group form-span-2">
              <label>البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="info@company.com" />
            </div>
            <div className="form-group form-span-2">
              <label>العنوان</label>
              <input value={form.address} onChange={set('address')} placeholder="الرياض، حي النزهة" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة منشأة')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
