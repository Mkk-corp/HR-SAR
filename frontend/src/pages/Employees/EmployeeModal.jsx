import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { create, update } from '../../api/employees.api';
import { getAll as getFacilities } from '../../api/facilities.api';

const EMPTY = {
  fullName: '', employeeCode: '', nationalId: '', nationality: '',
  employeeType: 'سعودي', facilityId: '', salary: '', status: 'نشط',
  department: '', jobTitle: '', bankName: '', iban: '', phone: '',
};

export default function EmployeeModal({ isOpen, onClose, employee, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!employee;

  useEffect(() => {
    if (isOpen) {
      setForm(employee ? {
        fullName: employee.fullName || '',
        employeeCode: employee.employeeCode || '',
        nationalId: employee.nationalId || '',
        nationality: employee.nationality || '',
        employeeType: employee.employeeType || 'سعودي',
        facilityId: employee.facilityId || '',
        salary: employee.salary || '',
        status: employee.status || 'نشط',
        department: employee.department || '',
        jobTitle: employee.jobTitle || '',
        bankName: employee.bankName || '',
        iban: employee.iban || '',
        phone: employee.phone || '',
      } : EMPTY);
      setError('');
      getFacilities().then((res) => setFacilities(Array.isArray(res) ? res : (res?.items || []))).catch(() => {});
    }
  }, [isOpen, employee]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto = { ...form, salary: parseFloat(form.salary) || 0, facilityId: form.facilityId || null };
      if (isEdit) await update(employee.id, dto);
      else await create(dto);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل موظف' : 'إضافة موظف جديد'}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-dark)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}

          <p className="form-section-label">البيانات الأساسية</p>
          <div className="form-grid">
            <div className="form-group">
              <label>الاسم الكامل <span className="required">*</span></label>
              <input value={form.fullName} onChange={set('fullName')} required placeholder="محمد عبدالله" />
            </div>
            <div className="form-group">
              <label>الرقم الوظيفي</label>
              <input value={form.employeeCode} onChange={set('employeeCode')} placeholder="EMP-001" />
            </div>
            <div className="form-group">
              <label>رقم الهوية / الإقامة</label>
              <input value={form.nationalId} onChange={set('nationalId')} placeholder="1234567890" />
            </div>
            <div className="form-group">
              <label>الجنسية</label>
              <input value={form.nationality} onChange={set('nationality')} placeholder="سعودي" />
            </div>
            <div className="form-group">
              <label>نوع الموظف</label>
              <select value={form.employeeType} onChange={set('employeeType')}>
                <option value="سعودي">سعودي</option>
                <option value="اجنبي">اجنبي</option>
              </select>
            </div>
            <div className="form-group">
              <label>الحالة</label>
              <select value={form.status} onChange={set('status')}>
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
                <option value="خروج نهائي">خروج نهائي</option>
                <option value="خروج مؤقت">خروج مؤقت</option>
                <option value="اجازة">اجازة</option>
              </select>
            </div>
          </div>

          <p className="form-section-label">بيانات العمل</p>
          <div className="form-grid">
            <div className="form-group">
              <label>المنشأة</label>
              <select value={form.facilityId} onChange={set('facilityId')}>
                <option value="">-- اختر المنشأة --</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>القسم</label>
              <input value={form.department} onChange={set('department')} placeholder="الموارد البشرية" />
            </div>
            <div className="form-group">
              <label>المسمى الوظيفي</label>
              <input value={form.jobTitle} onChange={set('jobTitle')} placeholder="مهندس برمجيات" />
            </div>
            <div className="form-group">
              <label>الراتب (ريال)</label>
              <input type="number" value={form.salary} onChange={set('salary')} placeholder="5000" min="0" />
            </div>
            <div className="form-group">
              <label>رقم الجوال</label>
              <input value={form.phone} onChange={set('phone')} placeholder="05XXXXXXXX" />
            </div>
          </div>

          <p className="form-section-label">البيانات البنكية</p>
          <div className="form-grid">
            <div className="form-group">
              <label>اسم البنك</label>
              <input value={form.bankName} onChange={set('bankName')} placeholder="البنك الأهلي" />
            </div>
            <div className="form-group">
              <label>رقم الآيبان</label>
              <input value={form.iban} onChange={set('iban')} placeholder="SA0000000000000000000000" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة موظف')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
