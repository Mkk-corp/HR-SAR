'use strict';

// ===== State =====
let employees  = JSON.parse(localStorage.getItem('hr_employees')  || '[]');
let facilities = JSON.parse(localStorage.getItem('hr_facilities') || '[]');
let currentEditId          = null;
let currentFacilityEditId  = null;
let currentFacilityId      = null;
let currentEmployeeId      = null;
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
function empAvatarEl(emp) {
    if (emp.photo?.data) return `<img src="${emp.photo.data}" class="emp-avatar emp-photo" alt="${emp.name||''}">`;
    return empAvatar(emp.name);
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

// ===== File Handling =====
const MAX_FILE_MB   = 2;
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024;
let _editRemovedDocs = new Set();

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve({ name: file.name, size: file.size, type: file.type, data: e.target.result, uploadedAt: new Date().toISOString() });
        reader.onerror = () => reject(new Error('فشل قراءة الملف'));
        reader.readAsDataURL(file);
    });
}

function fileSizeLabel(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
}

function fileItemHTML(f, showDelete) {
    const ext = (f.name || '').split('.').pop().toLowerCase();
    const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext);
    const icon = isImg
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const delBtn = showDelete
        ? `<button type="button" class="file-item-delete" data-doc-key="${f.name.replace(/"/g,'&quot;')}" title="حذف"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
        : '';
    return `<div class="file-item">
        <span class="file-item-icon">${icon}</span>
        <a class="file-item-name" href="${f.data}" download="${f.name.replace(/"/g,'&quot;')}" title="${f.name.replace(/"/g,'&quot;')}">${f.name}</a>
        <span class="file-item-size">${fileSizeLabel(f.size)}</span>
        ${delBtn}
    </div>`;
}

function filePendingHTML(name) {
    return `<div class="file-item-pending">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${name}
    </div>`;
}

function renderEditContractFile(file) {
    const el = document.getElementById('emp-contractFileList');
    el.innerHTML = file
        ? fileItemHTML(file, false)
        : '<span style="color:var(--text-3);font-size:12.5px">لا يوجد عقد مرفق</span>';
}

function renderEditAdditionalDocs(docs) {
    const el = document.getElementById('emp-additionalDocsList');
    const active = (docs || []).filter(d => !_editRemovedDocs.has(d.name));
    el.innerHTML = active.length
        ? active.map(d => fileItemHTML(d, true)).join('')
        : '<span style="color:var(--text-3);font-size:12.5px">لا توجد مستندات إضافية</span>';
}

// ===== Searchable Select =====
function initSearchableSelect(searchId, dropdownId, hiddenId, items) {
    const searchInput = document.getElementById(searchId);
    const dropdown    = document.getElementById(dropdownId);
    const hidden      = document.getElementById(hiddenId);

    function getIndices(q) {
        if (!q) return Array.from({ length: Math.min(50, items.length) }, (_, i) => i);
        const lower = q;
        return items.reduce((acc, item, i) => { if (item.includes(lower)) acc.push(i); return acc; }, []);
    }

    function renderList(indices) {
        const shown = indices.slice(0, 100);
        dropdown.innerHTML = shown.length
            ? shown.map(i => `<div class="searchable-select-item" data-idx="${i}">${items[i]}</div>`).join('') +
              (indices.length > 100 ? `<div class="searchable-select-hint">تعرض 100 من ${indices.length} نتيجة — اكتب للتضييق</div>` : '')
            : '<div class="searchable-select-hint">لا توجد نتائج</div>';
        dropdown.classList.remove('hidden');
    }

    searchInput.addEventListener('focus', () => renderList(getIndices(searchInput.value.trim())));

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim();
        if (!q) hidden.value = '';
        renderList(getIndices(q));
    });

    dropdown.addEventListener('mousedown', e => {
        const item = e.target.closest('.searchable-select-item');
        if (!item) return;
        const val = items[parseInt(item.dataset.idx)];
        searchInput.value = val;
        hidden.value = val;
        dropdown.classList.add('hidden');
    });

    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// ===== Navigation =====
const PAGE_TITLES = {
    dashboard:         'لوحة التحكم',
    employees:         'الموظفون',
    'add-employee':    'إضافة موظف جديد',
    facilities:        'المنشآت',
    'facility-detail': 'تفاصيل المنشأة',
    'employee-detail': 'بيانات الموظف',
    reports:           'التقارير',
};

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById(`page-${page}`)?.classList.remove('hidden');
    const navTarget = page === 'facility-detail' ? 'facilities'
                    : page === 'employee-detail'  ? 'employees'
                    : page;
    document.querySelector(`[data-page="${navTarget}"]`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || '';
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');

    const renderers = {
        dashboard, employees: renderEmployees, 'add-employee': renderAddEmployeePage,
        facilities: renderFacilities, 'facility-detail': renderFacilityDetail,
        'employee-detail': renderEmployeeDetail, reports: renderReports,
    };
    renderers[page]?.();
}

function navigateToFacility(id) {
    currentFacilityId = id;
    navigate('facility-detail');
}

function navigateToEmployee(id) {
    currentEmployeeId = id;
    navigate('employee-detail');
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
            <td><div class="emp-cell">${empAvatarEl(e)}<span style="font-weight:500">${e.name}</span></div></td>
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
        tbody.innerHTML = filtered.map(e => `<tr data-emp-id="${e.id}">
            <td><span class="emp-code">${e.code || '—'}</span></td>
            <td><div class="emp-cell">${empAvatarEl(e)}<div>
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
                <div class="fac-info-with-tree">
                <div class="fac-info-main">
                <div class="info-grid">
                    ${infoItem('الرقم الوطني الموحد', f.nationalNumber)}
                    ${infoItem('رقم السجل التجاري', f.crNumber)}
                    ${infoItem('تاريخ إصدار السجل التجاري', fmtDate(f.crDate))}
                    ${infoItem('الرقم الضريبي', f.taxNumber)}
                    ${infoItem('رقم المنشأة في التأمينات', f.insuranceNumber)}
                    ${infoItem('موقع العمل', f.workLocation)}
                </div>
                ${(f.economicActivity || f.isic4) ? `
                    <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border-light)">
                        <div style="font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:12px">نطاق العمل للكيان</div>
                        <div class="info-grid">
                            ${infoItem('النشاط الاقتصادي الفرعي', f.economicActivity)}
                            ${infoItem('كود ISIC4', f.isic4)}
                        </div>
                    </div>` : ''}
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
                </div><!-- /fac-info-main -->
                ${facilityTreeHTML(f)}
                </div><!-- /fac-info-with-tree -->
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

// ===== Employee Detail Page =====
function renderEmployeeDetail() {
    const emp = employees.find(x => x.id === currentEmployeeId);
    if (!emp) { navigate('employees'); return; }

    document.getElementById('pageTitle').textContent = emp.name;

    const photoEl = emp.photo?.data
        ? `<img src="${emp.photo.data}" class="emp-detail-photo" alt="${emp.name}">`
        : `<div class="emp-detail-avatar" style="background:${avatarColor(emp.name)}">${(emp.name||'?').trim().charAt(0)}</div>`;

    const editSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const delSvg  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    const csBadge = { 'ساري': 'badge-success', 'منتهي': 'badge-danger', 'موقوف': 'badge-warning' };

    document.getElementById('employeeBreadcrumb').innerHTML = `
        <button class="btn btn-ghost btn-sm" id="backToEmployeesBtn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            الموظفون
        </button>
        <span class="breadcrumb-sep">›</span>
        <span style="font-size:13px;font-weight:600;color:var(--text)">${emp.name}</span>`;

    document.getElementById('employeeDetailContent').innerHTML = `
        <div class="card" style="margin-bottom:18px">
            <div class="card-body">
                <div class="emp-detail-header">
                    <div class="emp-detail-photo-wrap">${photoEl}</div>
                    <div class="emp-detail-info">
                        <div class="emp-detail-name">${emp.name}</div>
                        ${emp.jobTitle ? `<div class="emp-detail-job">${emp.jobTitle}</div>` : ''}
                        <div style="font-size:13px;color:var(--text-2);margin-top:2px">${getFacilityName(emp.facilityId)}</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
                            ${statusBadge(emp.status)}
                            ${emp.empType  ? `<span class="badge badge-blue">${emp.empType}</span>` : ''}
                            ${emp.contractStatus ? `<span class="badge ${csBadge[emp.contractStatus]||'badge-blue'}">${emp.contractStatus}</span>` : ''}
                            ${emp.contractType   ? `<span class="badge badge-blue">${emp.contractType}</span>` : ''}
                        </div>
                    </div>
                    <div class="emp-detail-actions">
                        <button class="btn btn-secondary btn-sm" id="editEmployeeDetailBtn">${editSvg} تعديل</button>
                        <button class="btn btn-danger btn-sm" id="deleteEmployeeDetailBtn">${delSvg} حذف</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom:18px">
            <div class="card-header"><h3>البيانات الشخصية</h3></div>
            <div class="card-body">
                <div class="info-grid">
                    ${infoItem('رقم الهوية الوطني', emp.nationalId)}
                    ${infoItem('الجنسية', emp.nationality)}
                    ${infoItem('نوع الموظف', emp.empType)}
                    ${infoItem('تاريخ انتهاء الهوية', fmtDate(emp.idExpiry))}
                    ${infoItem('تاريخ دخول المملكة', fmtDate(emp.entryDate))}
                    ${infoItem('رقم رخصة العمل', emp.workPermitNumber)}
                    ${infoItem('تاريخ انتهاء رخصة العمل', fmtDate(emp.workPermitExpiry))}
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom:18px">
            <div class="card-header"><h3>بيانات العمل</h3></div>
            <div class="card-body">
                <div class="info-grid">
                    ${emp.code ? infoItem('الرقم التوظيفي', emp.code) : ''}
                    ${infoItem('المنشأة', getFacilityName(emp.facilityId))}
                    ${infoItem('المسمى الوظيفي', emp.jobTitle)}
                    ${infoItem('المرتب الأساسي', emp.salary ? fmt(emp.salary) + ' ر.س' : null)}
                    ${infoItem('نوع العقد', emp.contractType)}
                    ${infoItem('حالة العقد', emp.contractStatus)}
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom:18px">
            <div class="card-header"><h3>البنك والتواصل</h3></div>
            <div class="card-body">
                <div class="info-grid">
                    ${infoItem('البنك', emp.bank)}
                    ${emp.iban ? `<div class="info-item"><span class="info-label">رقم الآيبان</span><span class="info-value" style="direction:ltr;text-align:right;font-family:monospace;font-size:12.5px">${emp.iban}</span></div>` : infoItem('رقم الآيبان', null)}
                    ${infoItem('رقم الهاتف', [emp.countryCode, emp.phone].filter(Boolean).join(' '))}
                </div>
            </div>
        </div>

        ${(emp.contractFile || emp.additionalDocs?.length) ? `
        <div class="card">
            <div class="card-header"><h3>العقد والمستندات</h3></div>
            <div class="card-body">
                ${emp.contractFile ? `
                <div style="margin-bottom:${emp.additionalDocs?.length ? '16px':'0'}">
                    <div class="info-label" style="margin-bottom:8px">عقد العمل</div>
                    ${fileItemHTML(emp.contractFile, false)}
                </div>` : ''}
                ${emp.additionalDocs?.length ? `
                <div>
                    <div class="info-label" style="margin-bottom:8px">مستندات إضافية</div>
                    <div class="file-list">${emp.additionalDocs.map(d => fileItemHTML(d, false)).join('')}</div>
                </div>` : ''}
            </div>
        </div>` : ''}`;
}

// ===== Facility Hierarchy Tree =====
function facilityTreeHTML(f) {
    const isMain = f.type === 'اساسية';
    const isSub  = f.type === 'فرعيه' && f.parentId;
    if (!isMain && !isSub) return '';
    let rootFac, children, currentId;
    if (isMain) {
        children = facilities.filter(x => x.parentId === f.id);
        if (!children.length) return '';
        rootFac = f; currentId = f.id;
    } else {
        rootFac = getFacility(f.parentId);
        if (!rootFac) return '';
        children = facilities.filter(x => x.parentId === f.parentId);
        currentId = f.id;
    }
    const rootActive = rootFac.id === currentId;
    const childrenHTML = children.map(c => {
        const active = c.id === currentId;
        return `<div class="fac-tree-child">
            <div class="fac-tree-node ${active ? 'fac-tree-current' : 'clickable'}" ${!active ? `data-facility="${c.id}"` : ''}>
                <span class="fac-tree-dot"></span><span>${c.name}</span>
                ${active ? '<span class="fac-tree-badge">الحالي</span>' : ''}
            </div>
        </div>`;
    }).join('');
    return `<div class="fac-tree-panel">
        <div class="fac-tree-panel-title">هيكل المنشآت</div>
        <div class="fac-tree">
            <div class="fac-tree-node ${rootActive ? 'fac-tree-current' : 'clickable'}" ${!rootActive ? `data-facility="${rootFac.id}"` : ''}>
                <span class="fac-tree-dot"></span><span>${rootFac.name}</span>
                ${rootActive ? '<span class="fac-tree-badge">الحالي</span>' : ''}
            </div>
            <div class="fac-tree-children">${childrenHTML}</div>
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
    document.getElementById('fac-accountName').value     = p.accountName      || '';
    document.getElementById('fac-iban').value            = p.iban             || '';
    document.getElementById('fac-activitySearch').value  = p.economicActivity || '';
    document.getElementById('fac-activity').value        = p.economicActivity || '';
    document.getElementById('fac-isic4').value           = p.isic4            || '';
}

function openAddFacilityModal() {
    currentFacilityEditId = null;
    document.getElementById('facilityModalTitle').textContent = 'إضافة منشأة جديدة';
    document.getElementById('facilityForm').reset();
    document.getElementById('facilityId').value = '';
    document.getElementById('fac-parent-row').classList.add('hidden');
    document.getElementById('fac-activitySearch').value = '';
    document.getElementById('fac-activity').value = '';
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
    document.getElementById('fac-accountName').value           = f.accountName       || '';
    document.getElementById('fac-iban').value                  = f.iban              || '';
    document.getElementById('fac-activitySearch').value        = f.economicActivity  || '';
    document.getElementById('fac-activity').value              = f.economicActivity  || '';
    document.getElementById('fac-isic4').value                 = f.isic4             || '';

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
        economicActivity: document.getElementById('fac-activity').value.trim(),
        isic4:            get('fac-isic4'),
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
    document.getElementById('ae-contractFileList').innerHTML    = '';
    document.getElementById('ae-additionalDocsList').innerHTML  = '';
    document.getElementById('ae-photoPreview').innerHTML =
        `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    populateFacilitySelect('ae-facilityId');
}

async function submitAddEmployee() {
    const get = id => document.getElementById(id).value.trim();
    const name=get('ae-name'), code=get('ae-code'), nationalId=get('ae-nationalId'),
          nationality=get('ae-nationality'),
          empType=get('ae-empType'), facilityId=get('ae-facilityId'), salary=get('ae-salary');
    if (!name||!nationalId||!nationality||!empType||!facilityId||!salary) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return;
    }
    if (code && employees.find(e => e.code === code)) { showToast('الرقم التوظيفي مستخدم بالفعل', 'error'); return; }
    employees.push({
        id: uid(), name, code, nationalId, nationality, empType, facilityId,
        salary: parseFloat(salary), status: document.getElementById('ae-status').value,
        entryDate: get('ae-entryDate'), idExpiry: get('ae-idExpiry'),
        workPermitNumber: get('ae-workPermitNumber'), workPermitExpiry: get('ae-workPermitExpiry'),
        bank: get('ae-bank'), iban: get('ae-iban'),
        countryCode: get('ae-countryCode'), phone: get('ae-phone'),
        photo: await (async () => {
            const f = document.getElementById('ae-photo').files[0];
            if (!f) return null;
            if (f.size > MAX_FILE_SIZE) { showToast(`حجم الصورة يتجاوز ${MAX_FILE_MB}MB`, 'error'); return undefined; }
            return readFileAsBase64(f);
        })(),
        jobTitle: get('ae-jobTitle'),
        contractStatus: document.getElementById('ae-contractStatus').value,
        contractType:   document.getElementById('ae-contractType').value,
        contractFile:   await (async () => {
            const f = document.getElementById('ae-contractFile').files[0];
            if (!f) return null;
            if (f.size > MAX_FILE_SIZE) { showToast(`حجم الملف يتجاوز ${MAX_FILE_MB}MB`, 'error'); return undefined; }
            return readFileAsBase64(f);
        })(),
        additionalDocs: await (async () => {
            const files = Array.from(document.getElementById('ae-additionalDocs').files);
            const big = files.find(f => f.size > MAX_FILE_SIZE);
            if (big) { showToast(`الملف "${big.name}" يتجاوز ${MAX_FILE_MB}MB`, 'error'); return undefined; }
            return Promise.all(files.map(readFileAsBase64));
        })(),
        createdAt: new Date().toISOString(),
    });
    // abort if file size error (undefined signals error)
    const last = employees[employees.length - 1];
    if (last.photo === undefined || last.contractFile === undefined || last.additionalDocs === undefined) { employees.pop(); return; }
    try { save(); } catch(e) { employees.pop(); showToast('مساحة التخزين ممتلئة، قلّل حجم الملفات', 'error'); return; }
    showToast('تم إضافة الموظف بنجاح', 'success');
    navigate('employees');
}

// ===== Edit Employee Modal =====
function openEditModal(id) {
    const e = employees.find(x => x.id === id);
    if (!e) return;
    currentEditId = id;
    _editRemovedDocs = new Set();
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
    document.getElementById('empIdExpiry').value         = e.idExpiry          || '';
    document.getElementById('empWorkPermitNumber').value = e.workPermitNumber  || '';
    document.getElementById('empWorkPermitExpiry').value = e.workPermitExpiry  || '';
    document.getElementById('empBank').value             = e.bank              || '';
    document.getElementById('empIban').value             = e.iban         || '';
    document.getElementById('empCountryCode').value      = e.countryCode  || '';
    document.getElementById('empPhone').value            = e.phone        || '';
    // Photo preview
    const prevEl = document.getElementById('empPhotoPreview');
    if (e.photo?.data) {
        prevEl.innerHTML = `<img src="${e.photo.data}" alt="${e.name}">`;
    } else {
        prevEl.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }
    document.getElementById('empPhoto').value            = '';
    document.getElementById('empJobTitle').value         = e.jobTitle        || '';
    document.getElementById('empContractStatus').value   = e.contractStatus  || '';
    document.getElementById('empContractType').value     = e.contractType    || '';
    document.getElementById('empContractFile').value     = '';
    document.getElementById('empAdditionalDocs').value   = '';
    document.getElementById('emp-contractNewList').innerHTML  = '';
    document.getElementById('emp-additionalNewList').innerHTML = '';
    renderEditContractFile(e.contractFile || null);
    renderEditAdditionalDocs(e.additionalDocs || []);
    document.getElementById('employeeModal').classList.remove('hidden');
}

function closeModal() { document.getElementById('employeeModal').classList.add('hidden'); }

async function saveEmployee() {
    const get = id => document.getElementById(id).value.trim();
    const name=get('empName'), code=get('empCode'), nationalId=get('empNationalId'),
          nationality=get('empNationality'),
          empType=get('empType'), facilityId=get('empFacilityId'), salary=get('empSalary');
    if (!name||!nationalId||!nationality||!empType||!facilityId||!salary) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error'); return;
    }
    if (code && employees.find(e => e.code === code && e.id !== currentEditId)) {
        showToast('الرقم التوظيفي مستخدم بالفعل', 'error'); return;
    }
    const data = {
        id: currentEditId || uid(), name, code, nationalId, nationality, empType, facilityId,
        salary: parseFloat(salary), status: document.getElementById('empStatus').value,
        entryDate: get('empEntryDate'), idExpiry: get('empIdExpiry'),
        workPermitNumber: get('empWorkPermitNumber'), workPermitExpiry: get('empWorkPermitExpiry'),
        bank: get('empBank'), iban: get('empIban'), countryCode: get('empCountryCode'), phone: get('empPhone'),
        photo: await (async () => {
            const existing = employees.find(e => e.id === currentEditId);
            const f = document.getElementById('empPhoto').files[0];
            if (f) {
                if (f.size > MAX_FILE_SIZE) { showToast(`حجم الصورة يتجاوز ${MAX_FILE_MB}MB`, 'error'); return undefined; }
                return readFileAsBase64(f);
            }
            return existing?.photo || null;
        })(),
        jobTitle:        get('empJobTitle'),
        contractStatus:  document.getElementById('empContractStatus').value,
        contractType:    document.getElementById('empContractType').value,
        contractFile:    await (async () => {
            const existing = employees.find(e => e.id === currentEditId);
            const f = document.getElementById('empContractFile').files[0];
            if (f) {
                if (f.size > MAX_FILE_SIZE) { showToast(`حجم الملف يتجاوز ${MAX_FILE_MB}MB`, 'error'); return undefined; }
                return readFileAsBase64(f);
            }
            return existing?.contractFile || null;
        })(),
        additionalDocs:  await (async () => {
            const existing = employees.find(e => e.id === currentEditId);
            const kept = (existing?.additionalDocs || []).filter(d => !_editRemovedDocs.has(d.name));
            const newFiles = Array.from(document.getElementById('empAdditionalDocs').files);
            const big = newFiles.find(f => f.size > MAX_FILE_SIZE);
            if (big) { showToast(`الملف "${big.name}" يتجاوز ${MAX_FILE_MB}MB`, 'error'); return undefined; }
            const added = await Promise.all(newFiles.map(readFileAsBase64));
            return [...kept, ...added];
        })(),
        createdAt: currentEditId ? (employees.find(e => e.id === currentEditId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    if (data.photo === undefined || data.contractFile === undefined || data.additionalDocs === undefined) return;
    if (currentEditId) {
        employees[employees.findIndex(e => e.id === currentEditId)] = data;
        showToast('تم تعديل بيانات الموظف بنجاح', 'success');
    } else {
        employees.push(data);
        showToast('تم إضافة الموظف بنجاح', 'success');
    }
    try { save(); } catch(e) { showToast('مساحة التخزين ممتلئة، قلّل حجم الملفات', 'error'); return; }
    const onEmpDetailPage = !document.getElementById('page-employee-detail').classList.contains('hidden');
    closeModal();
    if (onEmpDetailPage) renderEmployeeDetail(); else renderEmployees();
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
        const wasCurrentEmployee = currentEmployeeId === deleteTargetId;
        employees = employees.filter(e => e.id !== deleteTargetId);
        save();
        showToast('تم حذف الموظف بنجاح', 'success');
        const onEmpDetail = !document.getElementById('page-employee-detail').classList.contains('hidden');
        if (wasCurrentEmployee || onEmpDetail) navigate('employees');
        else renderEmployees();
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

    // Employee detail page delegated
    document.getElementById('page-employee-detail').addEventListener('click', e => {
        if (e.target.closest('#backToEmployeesBtn'))    { navigate('employees'); return; }
        if (e.target.closest('#editEmployeeDetailBtn')) { openEditModal(currentEmployeeId); return; }
        if (e.target.closest('#deleteEmployeeDetailBtn')) {
            deleteTargetId = currentEmployeeId; deleteMode = 'employee';
            document.getElementById('confirmModal').classList.remove('hidden');
            return;
        }
    });

    // Employee modal
    document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    document.getElementById('employeeModal').addEventListener('click', e => {
        if (e.target === e.currentTarget) { closeModal(); return; }
        const delBtn = e.target.closest('[data-doc-key]');
        if (delBtn) {
            _editRemovedDocs.add(delBtn.dataset.docKey);
            const emp = employees.find(x => x.id === currentEditId);
            renderEditAdditionalDocs(emp?.additionalDocs || []);
        }
    });

    // Photo preview — add page
    document.getElementById('ae-photo').addEventListener('change', function() {
        const preview = document.getElementById('ae-photoPreview');
        if (this.files[0]) {
            const url = URL.createObjectURL(this.files[0]);
            preview.innerHTML = `<img src="${url}" alt="صورة الموظف">`;
        }
    });
    // Photo preview — edit modal
    document.getElementById('empPhoto').addEventListener('change', function() {
        const preview = document.getElementById('empPhotoPreview');
        if (this.files[0]) {
            const url = URL.createObjectURL(this.files[0]);
            preview.innerHTML = `<img src="${url}" alt="صورة الموظف">`;
        }
    });

    // File preview — add page
    document.getElementById('ae-contractFile').addEventListener('change', function() {
        document.getElementById('ae-contractFileList').innerHTML =
            this.files[0] ? filePendingHTML(this.files[0].name) : '';
    });
    document.getElementById('ae-additionalDocs').addEventListener('change', function() {
        document.getElementById('ae-additionalDocsList').innerHTML =
            Array.from(this.files).map(f => filePendingHTML(f.name)).join('');
    });

    // File preview — edit modal
    document.getElementById('empContractFile').addEventListener('change', function() {
        document.getElementById('emp-contractNewList').innerHTML =
            this.files[0] ? filePendingHTML(this.files[0].name) : '';
    });
    document.getElementById('empAdditionalDocs').addEventListener('change', function() {
        document.getElementById('emp-additionalNewList').innerHTML =
            Array.from(this.files).map(f => filePendingHTML(f.name)).join('');
    });

    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteAction);
    document.getElementById('closeConfirmBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirmModal(); });

    // Employee list delegated
    document.getElementById('employeesList').addEventListener('click', e => {
        const editBtn   = e.target.closest('[data-edit]');
        const deleteBtn = e.target.closest('[data-delete]');
        if (editBtn)   { openEditModal(editBtn.dataset.edit); return; }
        if (deleteBtn) { openConfirmDelete(deleteBtn.dataset.delete); return; }
        const row = e.target.closest('tr[data-emp-id]');
        if (row) navigateToEmployee(row.dataset.empId);
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

    initSearchableSelect('fac-activitySearch', 'fac-activityDropdown', 'fac-activity', ECONOMIC_ACTIVITIES);

    if (employees.length === 0 && facilities.length === 0) loadSampleData();
    dashboard();
});
