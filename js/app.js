'use strict';

// ===== State =====
let employees  = JSON.parse(localStorage.getItem('hr_employees')  || '[]');
let facilities = JSON.parse(localStorage.getItem('hr_facilities') || '[]');
let currentEditId          = null;
let currentFacilityEditId  = null;
let currentFacilityId      = null;
let deleteTargetId         = null;
let deleteFacilityTargetId = null;
let deleteMode             = null; // 'employee' | 'facility'

// ===== Constants =====
const AVATAR_COLORS = [
    '#2563EB','#7C3AED','#10B981','#F59E0B',
    '#EF4444','#0891B2','#DB2777','#65A30D',
];

// ===== Helpers =====
function uid() {
    return 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
}
function save() {
    localStorage.setItem('hr_employees', JSON.stringify(employees));
}
function saveFacilities() {
    localStorage.setItem('hr_facilities', JSON.stringify(facilities));
}
function getFacility(id) {
    return facilities.find(f => f.id === id);
}
function getFacilityName(id) {
    return getFacility(id)?.name || '—';
}
function avatarColor(name) {
    let h = 0;
    for (const c of (name || '?')) h = c.charCodeAt(0) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function fmt(n) {
    return Number(n || 0).toLocaleString('ar-SA');
}
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}
function statusBadge(s) {
    const map = {
        'نشط': 'badge-success', 'غير نشط': 'badge-danger',
        'خروج نهائي': 'badge-danger', 'خروج مؤقت': 'badge-warning', 'اجازة': 'badge-warning',
    };
    return `<span class="badge ${map[s] || 'badge-blue'}">${s}</span>`;
}
function empAvatar(name) {
    return `<div class="emp-avatar" style="background:${avatarColor(name)}">${(name||'?').trim().charAt(0)}</div>`;
}
function showToast(msg, type = '') {
    const icons = { success: '✓', error: '✕', warning: '!' };
    const t = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = icons[type] || '';
    document.getElementById('toastMsg').textContent = msg;
    t.className = `toast ${type}`;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}
function infoItem(label, value) {
    let display = value || '—';
    if (value && (value.startsWith('http') || value.startsWith('SA') === false && value.includes('://'))) {
        display = `<a href="${value}" target="_blank" rel="noopener" style="color:var(--primary);word-break:break-all">${value}</a>`;
    }
    return `<div class="info-item"><span class="info-label">${label}</span><span class="info-value">${display}</span></div>`;
}

// ===== Navigation =====
const PAGE_TITLES = {
    dashboard:         'لوحة التحكم',
    employees:         'الموظفون',
    'add-employee':    'إضافة موظف جديد',
    facilities:        'المنشآت',
    'facility-detail': 'تفاصيل المنشأة',
    reports:           'التقارير',
};

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById(`page-${page}`)?.classList.remove('hidden');
    const navTarget = (page === 'facility-detail') ? 'facilities' : page;
    document.querySelector(`[data-page="${navTarget}"]`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || '';
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');

    const renderers = {
        dashboard, employees: renderEmployees, 'add-employee': renderAddEmployeePage,
        facilities: renderFacilities, 'facility-detail': renderFacilityDetail, reports: renderReports,
    };
    renderers[page]?.();
}

function navigateToFacility(id) {
    currentFacilityId = id;
    navigate('facility-detail');
}

// ===== Dashboard =====
function dashboard() {
    document.getElementById('totalEmployees').textContent  = employees.length;
    document.getElementById('activeEmployees').textContent = employees.filter(e => e.status === 'نشط').length;
    document.getElementById('totalDepts').textContent      = facilities.length;
    document.getElementById('totalSalary').textContent     = fmt(employees.reduce((s, e) => s + (e.salary || 0), 0));

    const recent = [...employees].reverse().slice(0, 6);
    document.getElementById('recentEmployeesList').innerHTML = recent.length
        ? recent.map(e => `<tr>
            <td><div class="emp-cell">${empAvatar(e.name)}<span style="font-weight:500">${e.name}</span></div></td>
            <td>${getFacilityName(e.facilityId)}</td>
            <td style="color:#64748B">${e.empType || '—'}</td>
            <td>${statusBadge(e.status)}</td>
        </tr>`).join('')
        : `<tr><td colspan="4" style="text-align:center;padding:32px;color:#94A3B8">لا يوجد موظفون بعد</td></tr>`;

    const counts = {};
    employees.forEach(e => { const n = getFacilityName(e.facilityId); if (n !== '—') counts[n] = (counts[n] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...sorted.map(x => x[1]), 1);
    document.getElementById('deptDistribution').innerHTML = sorted.length
        ? sorted.map(([d, n]) => `
            <div class="dept-bar-item">
                <div class="dept-bar-label"><span class="dept-bar-name">${d}</span><span class="dept-bar-count">${n} موظف</span></div>
                <div class="dept-bar-track"><div class="dept-bar-fill" style="width:${(n/max)*100}%;background:#2563EB"></div></div>
            </div>`).join('')
        : `<p style="color:#94A3B8;text-align:center;padding:24px">لا يوجد بيانات</p>`;
}

// ===== Employees =====
function renderEmployees() { populateDeptFilter(); applyFilters(); }

function populateDeptFilter() {
    const sel = document.getElementById('deptFilter');
    const cur = sel.value;
    sel.innerHTML = `<option value="">جميع المنشآت</option>` +
        facilities.map(f => `<option value="${f.id}"${f.id === cur ? ' selected' : ''}>${f.name}</option>`).join('');
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const facId  = document.getElementById('deptFilter').value;
    const status = document.getElementById('statusFilter').value;
    const filtered = employees.filter(e => {
        const ms = !search || (e.name||'').toLowerCase().includes(search) ||
            (e.code||'').toLowerCase().includes(search) || (e.nationality||'').toLowerCase().includes(search) ||
            getFacilityName(e.facilityId).toLowerCase().includes(search);
        return ms && (!facId || e.facilityId === facId) && (!status || e.status === status);
    });
    const tbody = document.getElementById('employeesList');
    const empty = document.getElementById('emptyState');
    if (!filtered.length) {
        tbody.innerHTML = ''; empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        tbody.innerHTML = filtered.map(e => `<tr>
            <td><span class="emp-code">${e.code}</span></td>
            <td><div class="emp-cell">${empAvatar(e.name)}<div>
                <div class="emp-name">${e.name}</div>
                ${e.nationality ? `<div class="emp-email">${e.nationality}</div>` : ''}
            </div></div></td>
            <td>${e.empType || '—'}</td>
            <td>${getFacilityName(e.facilityId)}</td>
            <td style="font-weight:600">${fmt(e.salary)} <span style="font-size:11px;color:#94A3B8;font-weight:400">ر.س</span></td>
            <td>${statusBadge(e.status)}</td>
            <td><div class="action-btns">
                <button class="btn btn-sm btn-ghost" data-edit="${e.id}" title="تعديل">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost" data-delete="${e.id}" title="حذف" style="color:#EF4444">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div></td>
        </tr>`).join('');
    }
}

// ===== Facilities List =====
function renderFacilities() {
    const tbody = document.getElementById('facilitiesTableBody');
    const empty = document.getElementById('facilitiesEmptyState');
    if (!facilities.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    tbody.innerHTML = facilities.map(f => {
        const count = employees.filter(e => e.facilityId === f.id).length;
        const typeBadge = f.type === 'اساسية'
            ? `<span class="badge badge-blue">اساسية</span>`
            : `<span class="badge badge-purple">فرعيه</span>`;
        const parentName = f.parentId ? `<div style="font-size:11px;color:#94A3B8;margin-top:2px">↳ ${getFacilityName(f.parentId)}</div>` : '';
        return `<tr>
            <td>${typeBadge}</td>
            <td>
                <span class="facility-name-link" data-facility="${f.id}">${f.name}</span>
                ${parentName}
            </td>
            <td style="color:#64748B;font-size:12.5px">${f.nationalNumber || '—'}</td>
            <td style="color:#64748B;font-size:12.5px">${f.crNumber || '—'}</td>
            <td style="color:#64748B;font-size:12.5px">${fmtDate(f.crDate)}</td>
            <td><span class="badge badge-blue">${count} موظف</span></td>
            <td><div class="action-btns">
                <button class="btn btn-sm btn-ghost" data-fac-edit="${f.id}" title="تعديل">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost" data-fac-delete="${f.id}" title="حذف" style="color:#EF4444">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div></td>
        </tr>`;
    }).join('');
}

// ===== Facility Detail Page =====
function renderFacilityDetail() {
    const f = getFacility(currentFacilityId);
    if (!f) { navigate('facilities'); return; }

    document.getElementById('pageTitle').textContent = f.name;

    const typeBadge = f.type === 'اساسية'
        ? `<span class="badge badge-blue">اساسية</span>`
        : `<span class="badge badge-purple">فرعيه</span>`;

    // Breadcrumb
    const parentInfo = f.parentId
        ? `<button class="btn btn-ghost btn-sm" data-facility="${f.parentId}" style="font-size:12.5px">
               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
               ${getFacilityName(f.parentId)}
           </button>
           <span class="breadcrumb-sep">›</span>` : '';
    document.getElementById('facilityBreadcrumb').innerHTML = `
        <button class="btn btn-ghost btn-sm" id="backToFacilitiesBtn" style="font-size:12.5px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            المنشآت
        </button>
        <span class="breadcrumb-sep">›</span>
        ${parentInfo}
        <span style="font-size:13px;font-weight:600;color:var(--text)">${f.name}</span>`;

    // Info card
    document.getElementById('facilityInfoCard').innerHTML = `
        <div class="card" style="margin-bottom:18px">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:10px">
                    ${typeBadge}
                    <h2 style="font-size:17px;font-weight:700;color:var(--text)">${f.name}</h2>
                </div>
                <button class="btn btn-secondary" id="editFacilityDetailBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    تعديل البيانات
                </button>
            </div>
            <div class="card-body">
                <div class="info-grid">
                    ${infoItem('الرقم الوطني الموحد', f.nationalNumber)}
                    ${infoItem('رقم السجل التجاري', f.crNumber)}
                    ${infoItem('تاريخ إصدار السجل التجاري', fmtDate(f.crDate))}
                    ${infoItem('الرقم الضريبي', f.taxNumber)}
                    ${infoItem('رقم المنشأة في التأمينات', f.insuranceNumber)}
                    ${infoItem('موقع العمل', f.workLocation)}
                </div>
                ${(f.accountName || f.iban) ? `
                    <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border-light)">
                        <div style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:12px">حساب تحويل الرواتب</div>
                        <div class="info-grid">
                            ${infoItem('اسم صاحب الحساب', f.accountName)}
                            ${f.iban ? `<div class="info-item"><span class="info-label">رقم الآيبان (IBAN)</span><span class="info-value" style="direction:ltr;text-align:right;font-family:monospace">${f.iban}</span></div>` : infoItem('رقم الآيبان (IBAN)', '')}
                        </div>
                    </div>` : ''}
                ${f.nationalAddress ? `
                    <div class="info-item" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-light)">
                        <span class="info-label">العنوان الوطني</span>
                        <span class="info-value">
                            <a href="${f.nationalAddress}" target="_blank" rel="noopener" style="color:var(--primary);display:inline-flex;align-items:center;gap:5px">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                فتح الخريطة / العنوان الوطني
                            </a>
                        </span>
                    </div>` : ''}
            </div>
        </div>`;

    // Sub-facilities card (only for main)
    const subEl = document.getElementById('subFacilitiesCard');
    if (f.type === 'اساسية') {
        const subs = facilities.filter(x => x.parentId === f.id);
        const editIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        const delIcon  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        subEl.innerHTML = `
            <div class="card" style="margin-bottom:18px">
                <div class="card-header">
                    <h3>المنشآت الفرعية <span style="color:#94A3B8;font-weight:400">(${subs.length})</span></h3>
                    <button class="btn btn-primary btn-sm" id="addSubFacilityBtn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        إضافة فرعية
                    </button>
                </div>
                <div class="card-body p0">
                    ${subs.length ? `
                        <table class="table">
                            <thead><tr>
                                <th>اسم المنشأة الفرعية</th>
                                <th>الرقم الوطني الموحد</th>
                                <th>موقع العمل</th>
                                <th>الموظفون</th>
                                <th>الإجراءات</th>
                            </tr></thead>
                            <tbody>${subs.map(s => {
                                const cnt = employees.filter(e => e.facilityId === s.id).length;
                                return `<tr>
                                    <td><span class="facility-name-link" data-facility="${s.id}">${s.name}</span></td>
                                    <td style="color:#64748B">${s.nationalNumber || '—'}</td>
                                    <td style="color:#64748B">${s.workLocation || '—'}</td>
                                    <td><span class="badge badge-blue">${cnt} موظف</span></td>
                                    <td><div class="action-btns">
                                        <button class="btn btn-sm btn-ghost" data-fac-edit="${s.id}" title="تعديل">${editIcon}</button>
                                        <button class="btn btn-sm btn-ghost" data-fac-delete="${s.id}" title="حذف" style="color:#EF4444">${delIcon}</button>
                                    </div></td>
                                </tr>`;
                            }).join('')}</tbody>
                        </table>
                    ` : '<p style="text-align:center;padding:32px;color:#94A3B8">لا يوجد منشآت فرعية بعد</p>'}
                </div>
            </div>`;
    } else {
        subEl.innerHTML = '';
    }

    // Employees card
    const facEmployees = employees.filter(e => e.facilityId === f.id);
    document.getElementById('facilityEmployeesCard').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>الموظفون التابعون <span style="color:#94A3B8;font-weight:400">(${facEmployees.length})</span></h3>
            </div>
            <div class="card-body p0">
                ${facEmployees.length ? `
                    <table class="table">
                        <thead><tr>
                            <th>الرقم التوظيفي</th>
                            <th>الموظف</th>
                            <th>نوع الموظف</th>
                            <th>المرتب الأساسي</th>
                            <th>الحالة</th>
                        </tr></thead>
                        <tbody>${facEmployees.map(e => `<tr>
                            <td><span class="emp-code">${e.code}</span></td>
                            <td><div class="emp-cell">${empAvatar(e.name)}<div>
                                <div class="emp-name">${e.name}</div>
                                ${e.nationality ? `<div class="emp-email">${e.nationality}</div>` : ''}
                            </div></div></td>
                            <td>${e.empType || '—'}</td>
                            <td style="font-weight:600">${fmt(e.salary)} <span style="font-size:11px;color:#94A3B8;font-weight:400">ر.س</span></td>
                            <td>${statusBadge(e.status)}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                ` : '<p style="text-align:center;padding:32px;color:#94A3B8">لا يوجد موظفون مسجلون في هذه المنشأة</p>'}
            </div>
        </div>`;
}

// ===== Facility Modal =====
function populateParentSelect() {
    const sel = document.getElementById('fac-parentId');
    const mains = facilities.filter(f => f.type === 'اساسية' && f.id !== currentFacilityEditId);
    sel.innerHTML = `<option value="">اختر المنشأة الأساسية...</option>` +
        mains.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
}

function onFacilityTypeChange() {
    const type = document.getElementById('fac-type').value;
    const row  = document.getElementById('fac-parent-row');
    if (type === 'فرعيه') {
        row.classList.remove('hidden');
        populateParentSelect();
    } else {
        row.classList.add('hidden');
        document.getElementById('fac-parentId').value = '';
    }
}

function inheritFromParent(parentId) {
    if (!parentId) return;
    const p = getFacility(parentId);
    if (!p) return;
    document.getElementById('fac-nationalNumber').value  = p.nationalNumber  || '';
    document.getElementById('fac-crNumber').value        = p.crNumber        || '';
    document.getElementById('fac-crDate').value          = p.crDate          || '';
    document.getElementById('fac-taxNumber').value       = p.taxNumber       || '';
    document.getElementById('fac-insuranceNumber').value = p.insuranceNumber || '';
    document.getElementById('fac-nationalAddress').value = p.nationalAddress || '';
    document.getElementById('fac-workLocation').value    = p.workLocation    || '';
    document.getElementById('fac-accountName').value     = p.accountName     || '';
    document.getElementById('fac-iban').value            = p.iban            || '';
}

function openAddFacilityModal() {
    currentFacilityEditId = null;
    document.getElementById('facilityModalTitle').textContent = 'إضافة منشأة جديدة';
    document.getElementById('facilityForm').reset();
    document.getElementById('facilityId').value = '';
    document.getElementById('fac-parent-row').classList.add('hidden');
    document.getElementById('facilityModal').classList.remove('hidden');
    document.getElementById('fac-name').focus();
}

function openAddSubFacilityModal(parentId) {
    openAddFacilityModal();
    document.getElementById('fac-type').value = 'فرعيه';
    document.getElementById('fac-parent-row').classList.remove('hidden');
    populateParentSelect();
    document.getElementById('fac-parentId').value = parentId;
    inheritFromParent(parentId);
}

function openEditFacilityModal(id) {
    const f = facilities.find(x => x.id === id);
    if (!f) return;

    currentFacilityEditId = id;
    document.getElementById('facilityModalTitle').textContent  = 'تعديل بيانات المنشأة';
    document.getElementById('facilityId').value                = f.id;
    document.getElementById('fac-name').value                  = f.name;
    document.getElementById('fac-type').value                  = f.type;
    document.getElementById('fac-nationalNumber').value        = f.nationalNumber  || '';
    document.getElementById('fac-crNumber').value              = f.crNumber        || '';
    document.getElementById('fac-crDate').value                = f.crDate          || '';
    document.getElementById('fac-taxNumber').value             = f.taxNumber       || '';
    document.getElementById('fac-insuranceNumber').value       = f.insuranceNumber || '';
    document.getElementById('fac-nationalAddress').value       = f.nationalAddress || '';
    document.getElementById('fac-workLocation').value          = f.workLocation    || '';
    document.getElementById('fac-accountName').value           = f.accountName     || '';
    document.getElementById('fac-iban').value                  = f.iban            || '';

    const row = document.getElementById('fac-parent-row');
    if (f.type === 'فرعيه') {
        row.classList.remove('hidden');
        populateParentSelect();
        document.getElementById('fac-parentId').value = f.parentId || '';
    } else {
        row.classList.add('hidden');
        document.getElementById('fac-parentId').value = '';
    }
    document.getElementById('facilityModal').classList.remove('hidden');
}

function closeFacilityModal() {
    document.getElementById('facilityModal').classList.add('hidden');
}

function saveFacility() {
    const get  = id => document.getElementById(id).value.trim();
    const name = get('fac-name');
    const type = get('fac-type');
    if (!name || !type) { showToast('يرجى إدخال اسم ونوع المنشأة', 'error'); return; }

    const data = {
        id:               currentFacilityEditId || uid(),
        name, type,
        parentId:         document.getElementById('fac-parentId').value || null,
        nationalNumber:   get('fac-nationalNumber'),
        crNumber:         get('fac-crNumber'),
        crDate:           get('fac-crDate'),
        taxNumber:        get('fac-taxNumber'),
        insuranceNumber:  get('fac-insuranceNumber'),
        nationalAddress:  get('fac-nationalAddress'),
        workLocation:     get('fac-workLocation'),
        accountName:      get('fac-accountName'),
        iban:             get('fac-iban'),
        createdAt:        currentFacilityEditId
            ? (facilities.find(f => f.id === currentFacilityEditId)?.createdAt || new Date().toISOString())
            : new Date().toISOString(),
    };

    if (currentFacilityEditId) {
        facilities[facilities.findIndex(f => f.id === currentFacilityEditId)] = data;
        showToast('تم تعديل بيانات المنشأة بنجاح', 'success');
    } else {
        facilities.push(data);
        showToast('تم إضافة المنشأة بنجاح', 'success');
    }

    saveFacilities();
    closeFacilityModal();

    const onDetail = !document.getElementById('page-facility-detail').classList.contains('hidden');
    if (onDetail) renderFacilityDetail(); else renderFacilities();
}

// ===== Reports =====
function renderReports() {
    const facSal = {};
    employees.forEach(e => { const n = getFacilityName(e.facilityId); if (n !== '—') facSal[n] = (facSal[n] || 0) + (e.salary || 0); });
    const totalSal = Object.values(facSal).reduce((a, b) => a + b, 0);
    const salEl = document.getElementById('salaryReport');
    salEl.innerHTML = Object.keys(facSal).length
        ? Object.entries(facSal).sort((a, b) => b[1] - a[1]).map(([d, s]) => `
            <div class="report-row"><span class="report-label">${d}</span><span class="report-value">${fmt(s)} ر.س</span></div>`).join('') +
          `<div class="report-total"><span class="report-total-label">الإجمالي</span><span class="report-total-value">${fmt(totalSal)} ر.س</span></div>`
        : `<p style="color:#94A3B8;text-align:center;padding:24px">لا يوجد بيانات</p>`;

    const statuses = ['نشط', 'غير نشط', 'خروج نهائي', 'خروج مؤقت', 'اجازة'];
    const counts = {}; statuses.forEach(s => counts[s] = 0);
    employees.forEach(e => { if (e.status in counts) counts[e.status]++; });
    const total = employees.length || 1;
    document.getElementById('statusReport').innerHTML =
        Object.entries(counts).map(([s, n]) => `
            <div class="report-row">
                <span class="report-label">${statusBadge(s)}</span>
                <span class="report-value">${n} موظف <span style="font-weight:400;color:#94A3B8;font-size:12px">(${Math.round(n/total*100)}%)</span></span>
            </div>`).join('') +
        `<div class="report-total"><span class="report-total-label">الإجمالي</span><span class="report-total-value">${employees.length} موظف</span></div>`;
}

// ===== Add Employee Page =====
function populateFacilitySelect(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">اختر المنشأة...</option>` +
        facilities.map(f => `<option value="${f.id}"${f.id === cur ? ' selected' : ''}>${f.name} (${f.type})</option>`).join('');
}

function renderAddEmployeePage() {
    document.getElementById('addEmpForm').reset();
    populateFacilitySelect('ae-facilityId');
}

function submitAddEmployee() {
    const get = id => document.getElementById(id).value.trim();
    const name=get('ae-name'), code=get('ae-code'), nationalId=get('ae-nationalId'),
          nationality=get('ae-nationality'),
          empType=get('ae-empType'), facilityId=get('ae-facilityId'), salary=get('ae-salary');
    if (!name||!code||!nationalId||!nationality||!empType||!facilityId||!salary) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return;
    }
    if (employees.find(e => e.code === code)) { showToast('الرقم التوظيفي مستخدم بالفعل', 'error'); return; }
    employees.push({
        id: uid(), name, code, nationalId, nationality, empType, facilityId,
        salary: parseFloat(salary), status: document.getElementById('ae-status').value,
        entryDate: get('ae-entryDate'), idExpiry: get('ae-idExpiry'),
        bank: get('ae-bank'), iban: get('ae-iban'),
        countryCode: get('ae-countryCode'), phone: get('ae-phone'), createdAt: new Date().toISOString(),
    });
    save();
    showToast('تم إضافة الموظف بنجاح', 'success');
    navigate('employees');
}

// ===== Edit Employee Modal =====
function openEditModal(id) {
    const e = employees.find(x => x.id === id);
    if (!e) return;
    currentEditId = id;
    populateFacilitySelect('empFacilityId');
    document.getElementById('modalTitle').textContent    = 'تعديل بيانات الموظف';
    document.getElementById('employeeId').value          = e.id;
    document.getElementById('empName').value             = e.name;
    document.getElementById('empCode').value             = e.code;
    document.getElementById('empNationalId').value       = e.nationalId   || '';
    document.getElementById('empNationality').value      = e.nationality  || '';
    document.getElementById('empType').value             = e.empType      || '';
    document.getElementById('empFacilityId').value       = e.facilityId   || '';
    document.getElementById('empSalary').value           = e.salary;
    document.getElementById('empStatus').value           = e.status;
    document.getElementById('empEntryDate').value        = e.entryDate    || '';
    document.getElementById('empIdExpiry').value         = e.idExpiry     || '';
    document.getElementById('empBank').value             = e.bank         || '';
    document.getElementById('empIban').value             = e.iban         || '';
    document.getElementById('empCountryCode').value      = e.countryCode  || '';
    document.getElementById('empPhone').value            = e.phone        || '';
    document.getElementById('employeeModal').classList.remove('hidden');
}

function closeModal() { document.getElementById('employeeModal').classList.add('hidden'); }

function saveEmployee() {
    const get = id => document.getElementById(id).value.trim();
    const name=get('empName'), code=get('empCode'), nationalId=get('empNationalId'),
          nationality=get('empNationality'),
          empType=get('empType'), facilityId=get('empFacilityId'), salary=get('empSalary');
    if (!name||!code||!nationalId||!nationality||!empType||!facilityId||!salary) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return;
    }
    if (employees.find(e => e.code === code && e.id !== currentEditId)) {
        showToast('الرقم التوظيفي مستخدم بالفعل', 'error'); return;
    }
    const data = {
        id: currentEditId || uid(), name, code, nationalId, nationality, empType, facilityId,
        salary: parseFloat(salary), status: document.getElementById('empStatus').value,
        entryDate: get('empEntryDate'), idExpiry: get('empIdExpiry'),
        bank: get('empBank'), iban: get('empIban'), countryCode: get('empCountryCode'), phone: get('empPhone'),
        createdAt: currentEditId ? (employees.find(e => e.id === currentEditId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    if (currentEditId) {
        employees[employees.findIndex(e => e.id === currentEditId)] = data;
        showToast('تم تعديل بيانات الموظف بنجاح', 'success');
    } else {
        employees.push(data);
        showToast('تم إضافة الموظف بنجاح', 'success');
    }
    save(); closeModal(); renderEmployees();
}

// ===== Delete =====
function openConfirmDelete(id) { deleteTargetId = id; deleteMode = 'employee'; document.getElementById('confirmModal').classList.remove('hidden'); }
function openConfirmDeleteFacility(id) { deleteFacilityTargetId = id; deleteMode = 'facility'; document.getElementById('confirmModal').classList.remove('hidden'); }

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    deleteTargetId = null; deleteFacilityTargetId = null; deleteMode = null;
}

function confirmDeleteAction() {
    if (deleteMode === 'employee' && deleteTargetId) {
        employees = employees.filter(e => e.id !== deleteTargetId);
        save(); renderEmployees(); showToast('تم حذف الموظف بنجاح', 'success');
    } else if (deleteMode === 'facility' && deleteFacilityTargetId) {
        const wasCurrentFacility = currentFacilityId === deleteFacilityTargetId;
        facilities = facilities.filter(f => f.id !== deleteFacilityTargetId);
        saveFacilities();
        showToast('تم حذف المنشأة بنجاح', 'success');
        const onDetail = !document.getElementById('page-facility-detail').classList.contains('hidden');
        if (wasCurrentFacility) navigate('facilities');
        else if (onDetail) renderFacilityDetail();
        else renderFacilities();
    }
    closeConfirmModal();
}

// ===== Sample Data =====
function loadSampleData() {
    const f1 = { id: uid(), type: 'اساسية', parentId: null, name: 'شركة التقنية المتقدمة',    nationalNumber: '7001234567', crNumber: '1010123456', crDate: '2018-03-01', taxNumber: '300012345600003', insuranceNumber: '2000123456', nationalAddress: '', workLocation: 'الرياض - حي العليا',  createdAt: new Date().toISOString() };
    const f2 = { id: uid(), type: 'اساسية', parentId: null, name: 'مجموعة المالية والاستثمار', nationalNumber: '7002345678', crNumber: '1010234567', crDate: '2015-01-10', taxNumber: '300023456700003', insuranceNumber: '2000234567', nationalAddress: '', workLocation: 'الدمام - حي الشاطئ', createdAt: new Date().toISOString() };
    const f3 = { id: uid(), type: 'فرعيه',  parentId: f1.id, name: 'فرع الرياض - التقنية',    nationalNumber: '7001234567', crNumber: '1010123456', crDate: '2018-03-01', taxNumber: '300012345600003', insuranceNumber: '2000123456', nationalAddress: '', workLocation: 'الرياض - حي النزهة', createdAt: new Date().toISOString() };
    const f4 = { id: uid(), type: 'فرعيه',  parentId: f1.id, name: 'فرع جدة - التقنية',       nationalNumber: '7001234567', crNumber: '1010123456', crDate: '2018-03-01', taxNumber: '300012345600003', insuranceNumber: '2000123456', nationalAddress: '', workLocation: 'جدة - حي الحمراء',  createdAt: new Date().toISOString() };
    facilities.push(f1, f2, f3, f4);
    saveFacilities();

    const samples = [
        { name: 'أحمد محمد العلي',      code: 'EMP-001', nationalId: '1234567890', nationality: 'سعودي',  empType: 'سعودي', facilityId: f1.id, salary: 14000, status: 'نشط',        idExpiry: '2026-05-01', entryDate: '2021-03-15', bank: 'بنك الراجحي',  iban: 'SA0380000000608010167519', countryCode: '+966', phone: '501234567' },
        { name: 'فاطمة عبدالله السعيد', code: 'EMP-002', nationalId: '2345678901', nationality: 'سعودية', empType: 'سعودي', facilityId: f3.id, salary: 10000, status: 'نشط',        idExpiry: '2027-08-15', entryDate: '2020-07-01', bank: 'البنك الأهلي', iban: 'SA4420000001234567891234', countryCode: '+966', phone: '557654321' },
        { name: 'خالد إبراهيم المنصور', code: 'EMP-003', nationalId: '3456789012', nationality: 'أردني',  empType: 'اجنبي', facilityId: f2.id, salary: 12000, status: 'نشط',        idExpiry: '2025-12-31', entryDate: '2019-01-10', bank: 'بنك الإنماء',  iban: 'SA2980000247636520123456', countryCode: '+966', phone: '509876543' },
        { name: 'نورة سعد الشمري',      code: 'EMP-004', nationalId: '4567890123', nationality: 'سعودية', empType: 'سعودي', facilityId: f4.id, salary:  9500, status: 'اجازة',      idExpiry: '2028-03-20', entryDate: '2022-09-20', bank: 'بنك الراجحي',  iban: 'SA0380000000608010167520', countryCode: '+966', phone: '541234567' },
        { name: 'محمد علي الزهراني',    code: 'EMP-005', nationalId: '5678901234', nationality: 'مصري',   empType: 'اجنبي', facilityId: f1.id, salary: 13500, status: 'خروج مؤقت', idExpiry: '2026-11-30', entryDate: '2020-05-05', bank: 'مصرف الراجحي', iban: 'SA0380000000608010167521', countryCode: '+966', phone: '562345678' },
    ];
    samples.forEach(s => employees.push({ ...s, id: uid(), createdAt: new Date().toISOString() }));
    save();
}

// ===== Event Binding =====
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => { e.preventDefault(); navigate(link.dataset.page); });
    });

    document.getElementById('addEmployeePageBtn').addEventListener('click', () => navigate('add-employee'));
    document.getElementById('emptyAddBtn').addEventListener('click', () => navigate('add-employee'));
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('deptFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('ae-saveBtn').addEventListener('click', submitAddEmployee);
    document.getElementById('ae-cancelBtn').addEventListener('click', () => navigate('employees'));

    // Facility modal
    document.getElementById('addFacilityBtn').addEventListener('click', openAddFacilityModal);
    document.getElementById('emptyAddFacilityBtn').addEventListener('click', openAddFacilityModal);
    document.getElementById('fac-type').addEventListener('change', onFacilityTypeChange);
    document.getElementById('fac-parentId').addEventListener('change', () => inheritFromParent(document.getElementById('fac-parentId').value));
    document.getElementById('saveFacilityBtn').addEventListener('click', saveFacility);
    document.getElementById('closeFacilityBtn').addEventListener('click', closeFacilityModal);
    document.getElementById('cancelFacilityBtn').addEventListener('click', closeFacilityModal);
    document.getElementById('facilityModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeFacilityModal(); });

    // Facilities list delegated
    document.getElementById('facilitiesTableBody').addEventListener('click', e => {
        const facLink  = e.target.closest('[data-facility]');
        const editBtn  = e.target.closest('[data-fac-edit]');
        const delBtn   = e.target.closest('[data-fac-delete]');
        if (facLink) navigateToFacility(facLink.dataset.facility);
        if (editBtn) openEditFacilityModal(editBtn.dataset.facEdit);
        if (delBtn)  openConfirmDeleteFacility(delBtn.dataset.facDelete);
    });

    // Facility detail page delegated
    document.getElementById('page-facility-detail').addEventListener('click', e => {
        if (e.target.closest('#backToFacilitiesBtn'))    { navigate('facilities'); return; }
        if (e.target.closest('#editFacilityDetailBtn'))  { openEditFacilityModal(currentFacilityId); return; }
        if (e.target.closest('#addSubFacilityBtn'))      { openAddSubFacilityModal(currentFacilityId); return; }
        const facLink = e.target.closest('[data-facility]');
        if (facLink) { navigateToFacility(facLink.dataset.facility); return; }
        const editBtn = e.target.closest('[data-fac-edit]');
        if (editBtn) { openEditFacilityModal(editBtn.dataset.facEdit); return; }
        const delBtn = e.target.closest('[data-fac-delete]');
        if (delBtn)  { openConfirmDeleteFacility(delBtn.dataset.facDelete); return; }
    });

    // Employee modal
    document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    document.getElementById('employeeModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteAction);
    document.getElementById('closeConfirmBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirmModal(); });

    // Employee list delegated
    document.getElementById('employeesList').addEventListener('click', e => {
        const editBtn  = e.target.closest('[data-edit]');
        const deleteBtn = e.target.closest('[data-delete]');
        if (editBtn)   openEditModal(editBtn.dataset.edit);
        if (deleteBtn) openConfirmDelete(deleteBtn.dataset.delete);
    });

    document.getElementById('menuToggle').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden', !sidebar.classList.contains('open'));
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeModal(); closeFacilityModal(); closeConfirmModal(); }
    });

    if (employees.length === 0 && facilities.length === 0) loadSampleData();
    dashboard();
});
