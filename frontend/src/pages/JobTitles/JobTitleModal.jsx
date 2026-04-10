import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { create, update } from '../../api/jobTitles.api';

const LEVELS = ['Junior', 'Senior', 'Manager'];
const EMPTY = { nameAr: '', nameEn: '', code: '', description: '', classificationCode: '', level: '' };

export default function JobTitleModal({ isOpen, onClose, jobTitle, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!jobTitle;

  useEffect(() => {
    if (isOpen) {
      setForm(jobTitle ? {
        nameAr:             jobTitle.nameAr || '',
        nameEn:             jobTitle.nameEn || '',
        code:               jobTitle.code || '',
        description:        jobTitle.description || '',
        classificationCode: jobTitle.classificationCode || '',
        level:              jobTitle.level || '',
      } : EMPTY);
      setError('');
    }
  }, [isOpen, jobTitle]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto = { ...form, classificationCode: form.classificationCode || null, level: form.level || null };
      if (isEdit) await update(jobTitle.id, dto);
      else await create(dto);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل المسمى الوظيفي' : 'إضافة مسمى وظيفي'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>الاسم بالعربية <span className="required">*</span></label>
              <input value={form.nameAr} onChange={set('nameAr')} required placeholder="محاسب أول" />
            </div>
            <div className="form-group">
              <label>الاسم بالإنجليزية</label>
              <input value={form.nameEn} onChange={set('nameEn')} placeholder="Senior Accountant" />
            </div>
            <div className="form-group">
              <label>الكود <span className="required">*</span></label>
              <input value={form.code} onChange={set('code')} required placeholder="ACC-SR-01" />
            </div>
            <div className="form-group">
              <label>المستوى</label>
              <select value={form.level} onChange={set('level')}>
                <option value="">-- اختر المستوى --</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>كود التصنيف (Qiwa)</label>
              <input value={form.classificationCode} onChange={set('classificationCode')} placeholder="QIWA-001" />
            </div>
            <div className="form-group form-span-2">
              <label>الوصف</label>
              <input value={form.description} onChange={set('description')} placeholder="وصف المسمى الوظيفي..." />
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
