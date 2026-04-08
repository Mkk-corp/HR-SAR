import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById, getAll } from '../../api/facilities.api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import FacilityModal from './FacilityModal';
import styles from './FacilityDetailPage.module.css';

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Facility Tree Component
   Shows: main facility as root → sub-facilities as branches
   If current is a sub-facility: parent as root → all siblings as branches
───────────────────────────────────────────── */
function FacilityTree({ current, allFacilities, onNavigate }) {
  // Determine the root: if current is a sub-facility, root = parent; else root = current
  const isMain = !current.parentId;

  const root = isMain
    ? current
    : allFacilities.find((f) => f.id === current.parentId) || current;

  const children = allFacilities.filter((f) => f.parentId === root.id);

  return (
    <div className={styles.tree}>
      {/* Root node */}
      <div className={styles.treeRoot}>
        <TreeNode
          facility={root}
          isCurrent={root.id === current.id}
          onNavigate={onNavigate}
          isRoot
        />
      </div>

      {children.length > 0 && (
        <div className={styles.treeChildren}>
          {children.map((child, idx) => (
            <div key={child.id} className={styles.treeBranch}>
              {/* Vertical + horizontal connector lines */}
              <div className={`${styles.branchLine} ${idx === 0 ? styles.branchLineFirst : ''} ${idx === children.length - 1 ? styles.branchLineLast : ''}`} />
              <TreeNode
                facility={child}
                isCurrent={child.id === current.id}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      )}

      {children.length === 0 && isMain && (
        <div className={styles.noChildren}>لا توجد منشآت فرعية</div>
      )}
    </div>
  );
}

function TreeNode({ facility, isCurrent, onNavigate, isRoot }) {
  return (
    <div
      className={`${styles.treeNode} ${isCurrent ? styles.treeNodeCurrent : ''} ${isRoot ? styles.treeNodeRoot : ''}`}
      onClick={() => !isCurrent && onNavigate(facility.id)}
      style={{ cursor: isCurrent ? 'default' : 'pointer' }}
    >
      <div className={styles.nodeIcon}>
        {isRoot ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        )}
      </div>
      <div className={styles.nodeInfo}>
        <div className={styles.nodeName}>{facility.name}</div>
        <div className={styles.nodeMeta}>
          <Badge variant={facility.type === 'اساسية' ? 'blue' : 'purple'}>
            {facility.type === 'اساسية' ? 'رئيسية' : 'فرعية'}
          </Badge>
          {facility.employeeCount > 0 && (
            <span className={styles.nodeCount}>{facility.employeeCount} موظف</span>
          )}
        </div>
      </div>
      {isCurrent && <span className={styles.currentBadge}>الحالية</span>}
      {!isCurrent && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      )}
    </div>
  );
}

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [facility, setFacility] = useState(null);
  const [allFacilities, setAllFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getById(id), getAll()])
      .then(([detail, all]) => {
        if (!detail) { setNotFound(true); return; }
        setFacility(detail);
        setAllFacilities(Array.isArray(all) ? all : (all?.items || []));
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

  if (notFound || !facility) {
    return (
      <div className={styles.center}>
        <p style={{ color: 'var(--text-3)' }}>لم يتم العثور على المنشأة.</p>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/facilities')}>
          العودة للقائمة
        </button>
      </div>
    );
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const saudiRate = facility.employeeCount > 0
    ? Math.round((facility.saudiCount / facility.employeeCount) * 100)
    : 0;

  const subFacilities = allFacilities.filter((f) => f.parentId === facility.id);

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={`card ${styles.header}`}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.facilityIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <h2 className={styles.facilityName}>{facility.name}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge variant={facility.type === 'اساسية' ? 'blue' : 'purple'}>
                  {facility.type === 'اساسية' ? 'منشأة رئيسية' : 'منشأة فرعية'}
                </Badge>
                {facility.parentName && (
                  <span className={styles.parentTag}>
                    تابعة لـ: {facility.parentName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/facilities')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              رجوع
            </button>
            {hasPermission('facilities.edit') && (
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

        {/* Stats strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{facility.employeeCount}</span>
            <span className={styles.statLabel}>إجمالي الموظفين</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{facility.saudiCount}</span>
            <span className={styles.statLabel}>سعودي</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{facility.employeeCount - (facility.saudiCount || 0)}</span>
            <span className={styles.statLabel}>غير سعودي</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${saudiRate >= 50 ? styles.green : saudiRate >= 25 ? styles.orange : styles.red}`}>
              {saudiRate}%
            </span>
            <span className={styles.statLabel}>نسبة السعودة</span>
          </div>
          {facility.type === 'اساسية' && (
            <div className={styles.statItem}>
              <span className={styles.statValue}>{subFacilities.length}</span>
              <span className={styles.statLabel}>فروع</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Facility info ── */}
        <div className={`card ${styles.infoCard}`}>
          <div className="card-header"><h3>بيانات المنشأة</h3></div>
          <div className={`card-body ${styles.infoBody}`}>
            <InfoItem label="اسم المنشأة"              value={facility.name} />
            <InfoItem label="النوع"                     value={facility.type === 'اساسية' ? 'رئيسية' : 'فرعية'} />
            <InfoItem label="المنشأة الأم"              value={facility.parentName} />
            <InfoItem label="رقم السجل التجاري"         value={facility.crNumber} />
            <InfoItem label="تاريخ السجل التجاري"       value={fmtDate(facility.crDate)} />
            <InfoItem label="الرقم الوطني الموحد"       value={facility.nationalNumber} />
            <InfoItem label="الرقم الضريبي"             value={facility.taxNumber} />
            <InfoItem label="رقم التأمينات"             value={facility.insuranceNumber} />
            <InfoItem label="النشاط الاقتصادي"          value={facility.economicActivity} />
            <InfoItem label="كود ISIC4"                 value={facility.isic4} />
            <InfoItem label="العنوان الوطني"            value={facility.nationalAddress} />
            <InfoItem label="موقع العمل"                value={facility.workLocation} />
            <InfoItem label="تاريخ الإنشاء"             value={fmtDate(facility.createdAt)} />
          </div>
        </div>

        {/* ── Hierarchy tree ── */}
        <div className={`card ${styles.treeCard}`}>
          <div className="card-header">
            <h3>الهيكل التنظيمي</h3>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {facility.type === 'اساسية'
                ? `${subFacilities.length} فرع`
                : `تابعة لـ ${facility.parentName || '—'}`}
            </span>
          </div>
          <div className="card-body">
            <FacilityTree
              current={facility}
              allFacilities={allFacilities}
              onNavigate={(fid) => navigate(`/facilities/${fid}`)}
            />
          </div>
        </div>
      </div>

      <FacilityModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        facility={facility}
        onSaved={() => { setEditOpen(false); load(); }}
      />
    </div>
  );
}
