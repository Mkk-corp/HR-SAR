import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById } from '../../api/employees.api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmployeeModal from './EmployeeModal';
import styles from './EmployeeDetailPage.module.css';

const STATUS_VARIANTS = {
  'نشط': 'success',
  'غير نشط': 'secondary',
  'خروج نهائي': 'danger',
  'خروج مؤقت': 'warning',
  'اجازة': 'orange',
};

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className={`card ${styles.section}`}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--primary)' }}>{icon}</span>
          <h3>{title}</h3>
        </div>
      </div>
      <div className={`card-body ${styles.sectionBody}`}>{children}</div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getById(id)
      .then((data) => {
        if (!data) { setNotFound(true); return; }
        setEmployee(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (notFound || !employee) {
    return (
      <div className={styles.center}>
        <p style={{ color: 'var(--text-3)' }}>لم يتم العثور على الموظف.</p>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/employees')}>
          العودة للقائمة
        </button>
      </div>
    );
  }

  const emp = employee;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const fmtSalary = (n) => n ? Number(n).toLocaleString('ar-SA') + ' ر.س' : null;

  return (
    <div className={styles.page}>
      {/* ── Header card ── */}
      <div className={`card ${styles.header}`}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Avatar name={emp.name || ''} size={62} />
            <div>
              <h2 className={styles.empName}>{emp.name || '—'}</h2>
              <div className={styles.empMeta}>
                {emp.jobTitle && <span>{emp.jobTitle}</span>}
                {emp.facilityName && (
                  <>
                    <span className={styles.dot}>·</span>
                    <span>{emp.facilityName}</span>
                  </>
                )}
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge variant={STATUS_VARIANTS[emp.status] || 'secondary'}>{emp.status || '—'}</Badge>
                <Badge variant={emp.empType === 'سعودي' ? 'success' : 'blue'}>{emp.empType || '—'}</Badge>
                {emp.code && <span className={styles.code}>{emp.code}</span>}
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/employees')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              رجوع
            </button>
            {hasPermission('employees.edit') && (
              <button className="btn btn-primary btn-sm" onClick={() => setEditOpen(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                تعديل
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Personal info ── */}
        <Section
          title="البيانات الشخصية"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          }
        >
          <InfoItem label="الاسم الكامل"    value={emp.name} />
          <InfoItem label="الرقم التوظيفي"  value={emp.code} />
          <InfoItem label="الجنسية"          value={emp.nationality} />
          <InfoItem label="نوع الموظف"       value={emp.empType} />
          <InfoItem label="الرقم القومي"     value={emp.nationalId} />
          <InfoItem label="رقم الهوية"       value={emp.idNumber} />
          <InfoItem label="تاريخ انتهاء الهوية" value={fmtDate(emp.idExpiry)} />
          <InfoItem label="تاريخ دخول المملكة" value={fmtDate(emp.entryDate)} />
        </Section>

        {/* ── Work info ── */}
        <Section
          title="بيانات العمل"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          }
        >
          <InfoItem label="المنشأة"          value={emp.facilityName} />
          <InfoItem label="المسمى الوظيفي"   value={emp.jobTitle} />
          <InfoItem label="الإدارة"           value={emp.department} />
          <InfoItem label="المدير المباشر"    value={emp.manager} />
          <InfoItem label="موقع العمل"        value={emp.workLocation} />
          <InfoItem label="الدرجة الوظيفية"  value={emp.grade} />
          <InfoItem label="الراتب الأساسي"   value={fmtSalary(emp.salary)} />
          <InfoItem label="الحالة الوظيفية"  value={emp.status} />
        </Section>

        {/* ── Bank & contact ── */}
        <Section
          title="بيانات البنك والتواصل"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          }
        >
          <InfoItem label="اسم البنك"  value={emp.bank} />
          <InfoItem label="رقم IBAN"   value={emp.iban} />
          <InfoItem label="رقم الهاتف" value={emp.phone ? `${emp.countryCode || ''} ${emp.phone}`.trim() : null} />
        </Section>

        {/* ── Timestamps ── */}
        <Section
          title="معلومات السجل"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        >
          <InfoItem label="تاريخ الإضافة" value={fmtDate(emp.createdAt)} />
        </Section>
      </div>

      <EmployeeModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        employee={emp}
        onSaved={() => { setEditOpen(false); load(); }}
      />
    </div>
  );
}
