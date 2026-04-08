import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import { create, update } from '../../api/users.api';
import { getAll as getRoles } from '../../api/roles.api';

const EMPTY = { fullName: '', jobTitle: '', email: '', password: '', roleId: '', isActive: true, photoUrl: null };

export default function UserModal({ isOpen, onClose, user, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);
  const isEdit = !!user;

  useEffect(() => {
    if (isOpen) {
      const initial = user ? {
        fullName: user.fullName || '',
        jobTitle: user.jobTitle || '',
        email: user.email || '',
        password: '',
        roleId: user.roleId || '',
        isActive: user.isActive !== false,
        photoUrl: user.photoUrl || null,
      } : EMPTY;
      setForm(initial);
      setPhotoPreview(user?.photoUrl || null);
      setError('');
      getRoles().then((r) => setRoles(Array.isArray(r) ? r : (r?.items || []))).catch(() => {});
    }
  }, [isOpen, user]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.checked }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPhotoPreview(base64);
      setForm((p) => ({ ...p, photoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        const dto = { fullName: form.fullName, jobTitle: form.jobTitle, roleId: form.roleId || null, isActive: form.isActive };
        await update(user.id, dto);
      } else {
        await create({ ...form, roleId: form.roleId || null });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}

          {/* Photo upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={form.fullName || '?'} src={photoPreview} size={56} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: -2, left: -2,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff',
                  border: '2px solid var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
                title="اختر صورة"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              <div>صورة شخصية (اختياري)</div>
              <div>PNG أو JPG، حجم أقصى 2 ميجابايت</div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>الاسم الكامل <span className="required">*</span></label>
              <input value={form.fullName} onChange={set('fullName')} required placeholder="عبدالله محمد" />
            </div>
            <div className="form-group">
              <label>المسمى الوظيفي</label>
              <input value={form.jobTitle} onChange={set('jobTitle')} placeholder="مدير الموارد البشرية" />
            </div>
            <div className="form-group form-span-2">
              <label>البريد الإلكتروني <span className="required">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} required disabled={isEdit} placeholder="user@company.com" />
            </div>
            {!isEdit && (
              <div className="form-group form-span-2">
                <label>كلمة المرور <span className="required">*</span></label>
                <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" />
              </div>
            )}
            <div className="form-group">
              <label>الدور</label>
              <select value={form.roleId} onChange={set('roleId')}>
                <option value="">-- بدون دور --</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 'auto' }}>
                <input type="checkbox" checked={form.isActive} onChange={setCheck('isActive')} style={{ width: 16, height: 16 }} />
                حساب نشط
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة مستخدم')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
