'use strict';

// ===== Transfers State =====
let transfers = JSON.parse(localStorage.getItem('hr_transfers') || '[]');
let currentTransferId = null;
let transferStep = 1; // wizard step
let _pendingTransferType = ''; // 'internal' | 'external'
let _pendingTransferDirection = ''; // 'out' | 'in'

function saveTransfers() {
    localStorage.setItem('hr_transfers', JSON.stringify(transfers));
}

// ===== Status / Badge Helpers =====
const TRANSFER_STATUS_LABELS = {
    draft:              'مسودة',
    pending_approval:   'قيد الاعتماد',
    approved:           'معتمد',
    pending_government: 'معلق – إجراء حكومي',
    completed:          'مكتمل',
    rejected:           'مرفوض',
    cancelled:          'ملغى',
};

const TRANSFER_STATUS_CLASS = {
    draft:              'badge-secondary',
    pending_approval:   'badge-warning',
    approved:           'badge-blue',
    pending_government: 'badge-purple',
    completed:          'badge-success',
    rejected:           'badge-danger',
    cancelled:          'badge-danger',
};

function transferStatusBadge(status) {
    const label = TRANSFER_STATUS_LABELS[status] || status;
    const cls   = TRANSFER_STATUS_CLASS[status]  || 'badge-secondary';
    return `<span class="badge ${cls}">${label}</span>`;
}

function transferTypeBadge(type, direction) {
    if (type === 'internal') return `<span class="badge badge-teal">داخلي</span>`;
    if (direction === 'out')  return `<span class="badge badge-orange">خارجي – خروج</span>`;
    return `<span class="badge badge-blue">خارجي – دخول</span>`;
}

function subTypeBadge(sub) {
    const map = { sponsorship: 'نقل كفالة', secondment: 'إعارة مؤقتة' };
    return map[sub] ? `<span class="badge badge-secondary">${map[sub]}</span>` : '';
}

function addTransferAudit(transfer, action, details, by) {
    transfer.auditLog = transfer.auditLog || [];
    transfer.auditLog.push({ action, details, by: by || 'مدير النظام', at: new Date().toISOString() });
}

// ===== Settlement Calculation =====
function calculateSettlement(emp) {
    const salary        = Number(emp.salary || 0);
    const today         = new Date();
    const entryDate     = emp.entryDate ? new Date(emp.entryDate) : null;
    const yearsOfService = entryDate ? Math.max(0, (today - entryDate) / (365.25 * 24 * 3600 * 1000)) : 0;

    // Estimate leave balance: 30 days/year accrued minus assumed 15 used
    const dailyRate     = salary / 30;
    const leaveAccrued  = Math.round(yearsOfService * 30);
    const leaveRemaining = Math.max(0, leaveAccrued - 15);
    const leaveBalance  = Math.round(leaveRemaining * dailyRate);

    // Pending salary (current month partial)
    const dayOfMonth    = today.getDate();
    const pendingSalary = Math.round((salary / 30) * dayOfMonth);

    // Placeholder for loans/deductions
    const loans = 0;

    const total = pendingSalary + leaveBalance - loans;
    return { pendingSalary, leaveBalance, loans, yearsOfService: yearsOfService.toFixed(1), dailyRate: Math.round(dailyRate), total };
}

// ===== Apply Transfer Effects =====
function applyInternalTransfer(transfer) {
    const idx = employees.findIndex(e => e.id === transfer.employeeId);
    if (idx < 0) return;
    const emp  = { ...employees[idx] };
    const ch   = transfer.changes || {};

    if (ch.branch?.to)        emp.branch        = ch.branch.to;
    if (ch.department?.to)    emp.department     = ch.department.to;
    if (ch.jobTitle?.to)      emp.jobTitle       = ch.jobTitle.to;
    if (ch.manager?.to)       emp.manager        = ch.manager.to;
    if (ch.workLocation?.to)  emp.workLocation   = ch.workLocation.to;
    if (ch.salary?.to)        emp.salary         = Number(ch.salary.to);
    if (ch.grade?.to)         emp.grade          = ch.grade.to;
    if (ch.facilityId?.to)    emp.facilityId     = ch.facilityId.to;

    // Log history on employee
    emp.history = emp.history || [];
    emp.history.push({
        type:   'internal_transfer',
        date:   new Date().toISOString(),
        transferId: transfer.id,
        changes: transfer.changes,
    });

    employees[idx] = emp;
    save();
}

function applyExternalTransferOut(transfer) {
    const idx = employees.findIndex(e => e.id === transfer.employeeId);
    if (idx < 0) return;
    employees[idx] = {
        ...employees[idx],
        status: 'خروج نهائي',
        transferredOutAt: new Date().toISOString(),
        transferRefNumber: transfer.governmentRefNumber || '',
    };
    save();
}

// ===== Renders =====

function renderTransfers() {
    const filter = document.getElementById('transferFilterTab')?.dataset.active || 'all';
    const search = (document.getElementById('transferSearch')?.value || '').toLowerCase();

    let list = [...transfers].reverse();

    if (filter === 'internal')  list = list.filter(t => t.type === 'internal');
    if (filter === 'external')  list = list.filter(t => t.type === 'external');
    if (filter === 'pending')   list = list.filter(t => t.status === 'pending_approval');
    if (filter === 'govt')      list = list.filter(t => t.status === 'pending_government');
    if (filter === 'completed') list = list.filter(t => t.status === 'completed');

    if (search) {
        list = list.filter(t =>
            t.employeeName?.toLowerCase().includes(search) ||
            t.id?.toLowerCase().includes(search)
        );
    }

    const tbody = document.getElementById('transfersTableBody');
    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7">
            <div class="empty-state" style="padding:40px 0">
                <div class="empty-icon">↔</div>
                <p class="empty-title">لا توجد طلبات نقل</p>
                <p class="empty-sub">ابدأ بإنشاء طلب نقل جديد</p>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(t => {
        const emp = employees.find(e => e.id === t.employeeId);
        const avatarHTML = emp ? empAvatarEl(emp) : empAvatar(t.employeeName || '?');
        const dirLabel   = t.type === 'external' ? (t.direction === 'out' ? ' – خروج' : ' – دخول') : '';
        const typeLabel  = t.type === 'internal' ? 'داخلي' : ('خارجي' + dirLabel);
        const typeCls    = t.type === 'internal' ? 'badge-teal' : (t.direction === 'out' ? 'badge-orange' : 'badge-blue');

        return `<tr class="transfer-row" data-tid="${t.id}" style="cursor:pointer">
            <td>
                <div class="emp-cell">
                    ${avatarHTML}
                    <div>
                        <div style="font-weight:500">${t.employeeName || '—'}</div>
                        <div style="font-size:11.5px;color:var(--text-3)">${t.employeeCode || ''}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge ${typeCls}">${typeLabel}</span>${t.transferSubType ? ' ' + subTypeBadge(t.transferSubType) : ''}</td>
            <td>${t.type === 'internal' ? (t.changes?.department?.to || '—') : (t.targetCompany || '—')}</td>
            <td>${fmtDate(t.effectiveDate)}</td>
            <td>${transferStatusBadge(t.status)}</td>
            <td>${fmtDate(t.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" data-view-transfer="${t.id}">عرض</button>
            </td>
        </tr>`;
    }).join('');

    // Stats
    document.getElementById('tr-stat-total').textContent   = transfers.length;
    document.getElementById('tr-stat-pending').textContent  = transfers.filter(t => t.status === 'pending_approval').length;
    document.getElementById('tr-stat-govt').textContent     = transfers.filter(t => t.status === 'pending_government').length;
    document.getElementById('tr-stat-done').textContent     = transfers.filter(t => t.status === 'completed').length;
}

function renderTransferDetail() {
    const t = transfers.find(x => x.id === currentTransferId);
    if (!t) { navigate('transfers'); return; }

    const emp = employees.find(e => e.id === t.employeeId);
    const container = document.getElementById('transferDetailContent');
    if (!container) return;

    const isInternal   = t.type === 'internal';
    const isExtOut     = t.type === 'external' && t.direction === 'out';
    const isExtIn      = t.type === 'external' && t.direction === 'in';
    const isGovtPending = t.status === 'pending_government';
    const isCompleted  = t.status === 'completed';
    const canApprove   = t.status === 'pending_approval';
    const canCancel    = ['draft','pending_approval'].includes(t.status);
    const canComplete  = isGovtPending;

    container.innerHTML = `
        <!-- Employee Info Card -->
        <div class="card tr-employee-card">
            <div class="tr-emp-header">
                <div class="emp-cell">
                    ${emp ? empAvatarEl(emp) : empAvatar(t.employeeName || '?')}
                    <div>
                        <div class="tr-emp-name">${t.employeeName || '—'}</div>
                        <div class="tr-emp-meta">${emp?.jobTitle || ''} ${emp?.jobTitle && getFacilityName(emp?.facilityId) ? '·' : ''} ${getFacilityName(emp?.facilityId)}</div>
                    </div>
                </div>
                <div class="tr-badges">
                    ${transferTypeBadge(t.type, t.direction)}
                    ${t.transferSubType ? subTypeBadge(t.transferSubType) : ''}
                    ${transferStatusBadge(t.status)}
                </div>
            </div>
        </div>

        <!-- Workflow Stepper -->
        ${renderStepperHTML(t)}

        <!-- Transfer Details -->
        ${isInternal ? renderInternalDetailsHTML(t) : renderExternalDetailsHTML(t)}

        <!-- Settlement Card (External Out only) -->
        ${isExtOut ? renderSettlementHTML(t) : ''}

        <!-- Approval Actions -->
        ${canApprove ? renderApprovalActionsHTML(t) : ''}

        <!-- Government Handoff -->
        ${isGovtPending ? renderGovtHandoffHTML(t) : ''}

        <!-- Complete Transfer -->
        ${isGovtPending ? renderCompleteFormHTML(t) : ''}

        <!-- Rejection / Cancel Info -->
        ${t.status === 'rejected' ? `<div class="card tr-reject-card">
            <div class="card-header"><h3 class="card-title">سبب الرفض</h3></div>
            <div class="card-body"><p style="color:var(--danger)">${t.rejectionReason || '—'}</p></div>
        </div>` : ''}

        <!-- Completed Info -->
        ${isCompleted && t.governmentRefNumber ? `<div class="card">
            <div class="card-header"><h3 class="card-title">رقم المرجع الحكومي</h3></div>
            <div class="card-body"><span style="font-weight:600;color:var(--success);font-size:16px">${t.governmentRefNumber}</span></div>
        </div>` : ''}

        <!-- Cancel Button -->
        ${canCancel ? `<div style="text-align:center;margin-top:8px">
            <button class="btn btn-danger btn-sm" id="cancelTransferBtn">إلغاء طلب النقل</button>
        </div>` : ''}

        <!-- Audit Log -->
        ${renderAuditLogHTML(t)}
    `;
}

function renderStepperHTML(t) {
    const isInternal = t.type === 'internal';
    const isExt      = t.type === 'external';
    const isExtOut   = isExt && t.direction === 'out';

    // Steps depend on type
    let steps;
    if (isInternal) {
        steps = [
            { key: 'draft',              label: 'إنشاء الطلب' },
            { key: 'pending_approval',   label: 'الاعتماد' },
            { key: 'approved',           label: 'تحديث السجل' },
            { key: 'completed',          label: 'مكتمل' },
        ];
    } else if (isExtOut) {
        steps = [
            { key: 'draft',              label: 'إنشاء الطلب' },
            { key: 'pending_approval',   label: 'الاعتماد' },
            { key: 'approved',           label: 'تجميد الملف' },
            { key: 'pending_government', label: 'إجراء حكومي' },
            { key: 'completed',          label: 'مكتمل' },
        ];
    } else {
        steps = [
            { key: 'draft',              label: 'إنشاء الطلب' },
            { key: 'pending_approval',   label: 'الاعتماد' },
            { key: 'pending_government', label: 'إجراء حكومي' },
            { key: 'completed',          label: 'مكتمل' },
        ];
    }

    const statusOrder = ['draft','pending_approval','approved','pending_government','completed','rejected','cancelled'];
    const currentIdx  = statusOrder.indexOf(t.status);

    return `<div class="card">
        <div class="card-body tr-stepper">
            ${steps.map((s, i) => {
                const stepStatusIdx = statusOrder.indexOf(s.key);
                const isDone   = currentIdx > stepStatusIdx;
                const isCurrent = s.key === t.status || (s.key === 'approved' && t.status === 'approved');
                const isActive = isDone || isCurrent;
                const cls = t.status === 'rejected' || t.status === 'cancelled'
                    ? (i === 0 ? 'step-done' : 'step-inactive')
                    : (isDone ? 'step-done' : isCurrent ? 'step-active' : 'step-inactive');
                return `<div class="tr-step ${cls}">
                    <div class="tr-step-circle">${isDone ? '✓' : (i + 1)}</div>
                    <div class="tr-step-label">${s.label}</div>
                    ${i < steps.length - 1 ? '<div class="tr-step-line"></div>' : ''}
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function renderInternalDetailsHTML(t) {
    const ch = t.changes || {};
    const rows = [
        { label: 'الفرع / المنشأة',   from: ch.branch?.from,        to: ch.branch?.to },
        { label: 'الإدارة',           from: ch.department?.from,    to: ch.department?.to },
        { label: 'المسمى الوظيفي',    from: ch.jobTitle?.from,      to: ch.jobTitle?.to },
        { label: 'المدير المباشر',    from: ch.manager?.from,       to: ch.manager?.to },
        { label: 'موقع العمل',        from: ch.workLocation?.from,  to: ch.workLocation?.to },
        { label: 'الراتب',            from: ch.salary?.from ? fmt(ch.salary.from) + ' ر.س' : null, to: ch.salary?.to ? fmt(ch.salary.to) + ' ر.س' : null },
        { label: 'الدرجة / الرتبة',   from: ch.grade?.from,         to: ch.grade?.to },
    ].filter(r => r.from || r.to);

    return `<div class="card">
        <div class="card-header">
            <h3 class="card-title">تفاصيل النقل الداخلي</h3>
            <span style="font-size:12px;color:var(--text-3)">تاريخ التفعيل: ${fmtDate(t.effectiveDate)}</span>
        </div>
        <div class="card-body">
            <div class="tr-changes-table">
                <div class="tr-changes-header">
                    <span>البيان</span><span>قبل</span><span>بعد</span>
                </div>
                ${rows.map(r => `<div class="tr-changes-row">
                    <span class="tr-changes-label">${r.label}</span>
                    <span class="tr-changes-from">${r.from || '—'}</span>
                    <span class="tr-changes-to">${r.to || '—'}</span>
                </div>`).join('')}
                ${rows.length === 0 ? '<div style="color:var(--text-3);padding:12px 0">لم تُحدَّد تعديلات</div>' : ''}
            </div>
            ${t.notes ? `<div class="tr-notes"><strong>ملاحظات:</strong> ${t.notes}</div>` : ''}
        </div>
    </div>`;
}

function renderExternalDetailsHTML(t) {
    return `<div class="card">
        <div class="card-header">
            <h3 class="card-title">تفاصيل النقل الخارجي</h3>
        </div>
        <div class="card-body">
            <div class="info-grid" style="grid-template-columns:repeat(3,1fr)">
                ${infoItem('الاتجاه', t.direction === 'out' ? 'نقل خارج المنشأة' : 'نقل إلى المنشأة')}
                ${infoItem('نوع النقل', t.transferSubType === 'sponsorship' ? 'نقل كفالة' : t.transferSubType === 'secondment' ? 'إعارة مؤقتة' : '—')}
                ${infoItem('الجهة المستقبِلة / المُرسِلة', t.targetCompany || '—')}
                ${infoItem('تاريخ النقل المتوقع', fmtDate(t.expectedDate))}
                ${infoItem('سبب النقل', t.reason || '—')}
                ${t.governmentRefNumber ? infoItem('رقم المرجع الحكومي', t.governmentRefNumber) : ''}
            </div>
            ${t.notes ? `<div class="tr-notes" style="margin-top:12px"><strong>ملاحظات:</strong> ${t.notes}</div>` : ''}
        </div>
    </div>`;
}

function renderSettlementHTML(t) {
    const s = t.settlement || {};
    return `<div class="card tr-settlement-card">
        <div class="card-header">
            <h3 class="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                حساب التسوية النهائية (تقديري)
            </h3>
        </div>
        <div class="card-body">
            <div class="tr-settlement-grid">
                <div class="tr-settlement-item">
                    <span class="tr-settlement-label">الراتب المستحق</span>
                    <span class="tr-settlement-value">${fmt(s.pendingSalary)} <small>ر.س</small></span>
                </div>
                <div class="tr-settlement-item">
                    <span class="tr-settlement-label">رصيد الإجازات</span>
                    <span class="tr-settlement-value">${fmt(s.leaveBalance)} <small>ر.س</small></span>
                </div>
                <div class="tr-settlement-item">
                    <span class="tr-settlement-label">قروض / خصومات</span>
                    <span class="tr-settlement-value danger">${fmt(s.loans)} <small>ر.س</small></span>
                </div>
                <div class="tr-settlement-item total">
                    <span class="tr-settlement-label">الإجمالي المستحق</span>
                    <span class="tr-settlement-value success">${fmt(s.total)} <small>ر.س</small></span>
                </div>
            </div>
            <p style="font-size:11.5px;color:var(--text-3);margin-top:10px">* هذه أرقام تقديرية تستند إلى بيانات الراتب ومدة الخدمة المسجلة. يجب التحقق منها مع قسم المالية قبل الصرف.</p>
        </div>
    </div>`;
}

function renderApprovalActionsHTML(t) {
    return `<div class="card tr-approval-card">
        <div class="card-header"><h3 class="card-title">إجراء الاعتماد</h3></div>
        <div class="card-body">
            <p style="margin-bottom:14px;color:var(--text-2)">يستلزم هذا الطلب اعتماداً من المدير المختص قبل المتابعة.</p>
            <div class="tr-approval-actions">
                <div class="form-group" style="flex:1">
                    <label>تعليق (اختياري)</label>
                    <input type="text" id="approvalComment" placeholder="أضف تعليقاً أو ملاحظة...">
                </div>
                <div class="tr-action-btns">
                    <button class="btn btn-success" id="approveTransferBtn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        اعتماد الطلب
                    </button>
                    <button class="btn btn-danger" id="rejectTransferBtn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        رفض الطلب
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function renderGovtHandoffHTML(t) {
    return `<div class="card tr-govt-card">
        <div class="tr-govt-header">
            <div class="tr-govt-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
                <h3 class="tr-govt-title">إجراء حكومي مطلوب</h3>
                <p class="tr-govt-sub">اكتمل الاعتماد الداخلي — يجب الآن إتمام نقل الكفالة عبر المنصات الحكومية</p>
            </div>
        </div>
        <div class="card-body">
            <div class="tr-govt-alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>لإتمام النقل الرسمي، يرجى اتباع الخطوات التالية على المنصات الحكومية:</p>
            </div>
            <ol class="tr-govt-steps">
                <li><strong>تسجيل الدخول</strong> إلى منصة قوى</li>
                <li><strong>تقديم طلب نقل</strong> للموظف المعني</li>
                <li><strong>موافقة الموظف</strong> على طلب النقل</li>
                <li><strong>موافقة صاحب العمل الحالي</strong> (إن لزم)</li>
                <li><strong>إتمام إجراءات النقل</strong> واستلام رقم المرجع</li>
            </ol>
            <div class="tr-govt-links">
                <a href="https://www.qiwa.sa" target="_blank" rel="noopener" class="tr-govt-link qiwa">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    منصة قوى
                    <small>qiwa.sa</small>
                </a>
                <a href="https://www.absher.sa" target="_blank" rel="noopener" class="tr-govt-link absher">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    أبشر
                    <small>absher.sa</small>
                </a>
            </div>
        </div>
    </div>`;
}

function renderCompleteFormHTML(t) {
    return `<div class="card">
        <div class="card-header"><h3 class="card-title">تأكيد إتمام النقل الحكومي</h3></div>
        <div class="card-body">
            <p style="margin-bottom:14px;color:var(--text-2)">بعد إتمام الإجراءات الحكومية، أدخل رقم المرجع وأكّد الإتمام.</p>
            <div class="tr-complete-form">
                <div class="form-group">
                    <label>رقم المرجع الحكومي <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="govtRefInput" placeholder="مثال: QW-2026-XXXXX" dir="ltr">
                </div>
                <button class="btn btn-success" id="completeTransferBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    تأكيد إتمام النقل
                </button>
            </div>
        </div>
    </div>`;
}

function renderAuditLogHTML(t) {
    const log = (t.auditLog || []).slice().reverse();
    if (!log.length) return '';
    return `<div class="card">
        <div class="card-header"><h3 class="card-title">سجل العمليات</h3></div>
        <div class="card-body p0">
            <div class="tr-audit-log">
                ${log.map(entry => `<div class="tr-audit-entry">
                    <div class="tr-audit-dot"></div>
                    <div class="tr-audit-body">
                        <div class="tr-audit-action">${entry.action}</div>
                        ${entry.details ? `<div class="tr-audit-details">${entry.details}</div>` : ''}
                        <div class="tr-audit-meta">${entry.by} · ${fmtDate(entry.at)}</div>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </div>`;
}

// ===== New Transfer Modal =====
function openNewTransferModal() {
    transferStep = 1;
    _pendingTransferType = '';
    _pendingTransferDirection = '';
    document.getElementById('transferModal').classList.remove('hidden');
    renderTransferModalStep();
}

function closeTransferModal() {
    document.getElementById('transferModal').classList.add('hidden');
}

function renderTransferModalStep() {
    const body  = document.getElementById('transferModalBody');
    const title = document.getElementById('transferModalTitle');

    if (transferStep === 1) {
        title.textContent = 'نوع طلب النقل';
        body.innerHTML = `
            <div class="tr-type-grid">
                <button class="tr-type-btn ${_pendingTransferType === 'internal' ? 'selected' : ''}" data-ttype="internal">
                    <div class="tr-type-icon blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    </div>
                    <span class="tr-type-name">نقل داخلي</span>
                    <span class="tr-type-desc">تغيير الإدارة، الفرع، المسمى الوظيفي داخل المنشأة</span>
                </button>
                <button class="tr-type-btn ${_pendingTransferType === 'external' && _pendingTransferDirection === 'out' ? 'selected' : ''}" data-ttype="external-out">
                    <div class="tr-type-icon orange">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </div>
                    <span class="tr-type-name">نقل خارجي – خروج</span>
                    <span class="tr-type-desc">نقل الموظف إلى منشأة أخرى (نقل كفالة / إعارة)</span>
                </button>
                <button class="tr-type-btn ${_pendingTransferType === 'external' && _pendingTransferDirection === 'in' ? 'selected' : ''}" data-ttype="external-in">
                    <div class="tr-type-icon green">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    </div>
                    <span class="tr-type-name">نقل خارجي – دخول</span>
                    <span class="tr-type-desc">استقبال موظف محوَّل من منشأة أخرى</span>
                </button>
            </div>
        `;
    } else if (transferStep === 2) {
        title.textContent = 'بيانات الطلب';
        body.innerHTML = _pendingTransferType === 'internal'
            ? buildInternalForm()
            : buildExternalForm(_pendingTransferDirection);
    } else if (transferStep === 3) {
        title.textContent = 'مراجعة وإرسال';
        body.innerHTML = buildReviewStep();
    }

    // Footer buttons
    const footer = document.getElementById('transferModalFooter');
    footer.innerHTML = `
        <button class="btn btn-secondary" id="trModalBack">${transferStep === 1 ? 'إلغاء' : 'رجوع'}</button>
        ${transferStep < 3
            ? `<button class="btn btn-primary" id="trModalNext">التالي &larr;</button>`
            : `<button class="btn btn-primary" id="trModalSave">إرسال الطلب</button>`
        }
    `;
}

function buildInternalForm() {
    const empOptions = employees
        .filter(e => e.status === 'نشط')
        .map(e => `<option value="${e.id}">${e.name} — ${getFacilityName(e.facilityId)}</option>`)
        .join('');

    const facOptions = facilities
        .map(f => `<option value="${f.id}">${f.name}</option>`)
        .join('');

    return `<div class="form-grid">
        <div class="form-group form-span-2">
            <label>الموظف <span class="req">*</span></label>
            <select id="tr-employee" required>
                <option value="">اختر موظفاً...</option>
                ${empOptions}
            </select>
        </div>
        <div class="form-group">
            <label>تاريخ التفعيل <span class="req">*</span></label>
            <input type="date" id="tr-effectiveDate" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
            <label>الإدارة الجديدة</label>
            <input type="text" id="tr-dept" placeholder="مثال: إدارة التقنية">
        </div>
        <div class="form-group">
            <label>الفرع / المنشأة الجديدة</label>
            <select id="tr-branch">
                <option value="">بدون تغيير</option>
                ${facOptions}
            </select>
        </div>
        <div class="form-group">
            <label>المسمى الوظيفي الجديد</label>
            <input type="text" id="tr-jobTitle" placeholder="مثال: مدير تقنية المعلومات">
        </div>
        <div class="form-group">
            <label>المدير المباشر الجديد</label>
            <input type="text" id="tr-manager" placeholder="اسم المدير">
        </div>
        <div class="form-group">
            <label>موقع العمل الجديد</label>
            <input type="text" id="tr-workLocation" placeholder="مثال: الرياض، مبنى A">
        </div>
        <div class="form-group">
            <label>الراتب الجديد (اختياري)</label>
            <input type="number" id="tr-salary" placeholder="0" min="0">
        </div>
        <div class="form-group">
            <label>الدرجة / الرتبة (اختياري)</label>
            <input type="text" id="tr-grade" placeholder="مثال: المستوى 4">
        </div>
        <div class="form-group form-span-2">
            <label>ملاحظات</label>
            <textarea id="tr-notes" rows="2" placeholder="أي معلومات إضافية..."></textarea>
        </div>
    </div>`;
}

function buildExternalForm(direction) {
    const isOut = direction === 'out';
    const empOptions = employees
        .filter(e => isOut ? e.status === 'نشط' : true)
        .map(e => `<option value="${e.id}">${e.name} — ${getFacilityName(e.facilityId)}</option>`)
        .join('');

    return `<div class="form-grid">
        <div class="form-group form-span-2">
            <label>الموظف <span class="req">*</span></label>
            <select id="tr-employee" required>
                <option value="">اختر موظفاً...</option>
                ${empOptions}
            </select>
        </div>
        ${isOut ? `
        <div class="form-group form-span-2">
            <label>نوع النقل <span class="req">*</span></label>
            <select id="tr-subtype" required>
                <option value="">اختر...</option>
                <option value="sponsorship">نقل كفالة</option>
                <option value="secondment">إعارة مؤقتة</option>
            </select>
        </div>` : ''}
        <div class="form-group">
            <label>${isOut ? 'المنشأة المستقبِلة' : 'المنشأة المُرسِلة'} <span class="req">*</span></label>
            <input type="text" id="tr-targetCompany" placeholder="اسم المنشأة" required>
        </div>
        <div class="form-group">
            <label>التاريخ المتوقع للنقل <span class="req">*</span></label>
            <input type="date" id="tr-expectedDate" required>
        </div>
        <div class="form-group form-span-2">
            <label>سبب النقل <span class="req">*</span></label>
            <textarea id="tr-reason" rows="2" placeholder="وصف مختصر للسبب..." required></textarea>
        </div>
        <div class="form-group form-span-2">
            <label>ملاحظات</label>
            <textarea id="tr-notes" rows="2" placeholder="أي معلومات إضافية..."></textarea>
        </div>
    </div>`;
}

function buildReviewStep() {
    const empId   = document.getElementById('tr-employee')?.value;
    const emp     = employees.find(e => e.id === empId);
    const isInt   = _pendingTransferType === 'internal';
    const isOut   = _pendingTransferDirection === 'out';

    let html = `<div class="tr-review-card">
        <div class="tr-review-row"><span>الموظف</span><strong>${emp?.name || '—'}</strong></div>
        <div class="tr-review-row"><span>نوع الطلب</span><strong>${isInt ? 'نقل داخلي' : ('نقل خارجي – ' + (isOut ? 'خروج' : 'دخول'))}</strong></div>`;

    if (isInt) {
        const dept  = document.getElementById('tr-dept')?.value;
        const title = document.getElementById('tr-jobTitle')?.value;
        const sal   = document.getElementById('tr-salary')?.value;
        const effDate = document.getElementById('tr-effectiveDate')?.value;
        if (dept)    html += `<div class="tr-review-row"><span>الإدارة الجديدة</span><strong>${dept}</strong></div>`;
        if (title)   html += `<div class="tr-review-row"><span>المسمى الوظيفي</span><strong>${title}</strong></div>`;
        if (sal)     html += `<div class="tr-review-row"><span>الراتب الجديد</span><strong>${fmt(sal)} ر.س</strong></div>`;
        if (effDate) html += `<div class="tr-review-row"><span>تاريخ التفعيل</span><strong>${fmtDate(effDate)}</strong></div>`;
    } else {
        const company   = document.getElementById('tr-targetCompany')?.value;
        const reason    = document.getElementById('tr-reason')?.value;
        const expDate   = document.getElementById('tr-expectedDate')?.value;
        const subType   = document.getElementById('tr-subtype')?.value;
        if (company)    html += `<div class="tr-review-row"><span>${isOut ? 'المستقبِل' : 'المُرسِل'}</span><strong>${company}</strong></div>`;
        if (subType)    html += `<div class="tr-review-row"><span>نوع النقل</span><strong>${subType === 'sponsorship' ? 'نقل كفالة' : 'إعارة مؤقتة'}</strong></div>`;
        if (reason)     html += `<div class="tr-review-row"><span>السبب</span><strong>${reason}</strong></div>`;
        if (expDate)    html += `<div class="tr-review-row"><span>التاريخ المتوقع</span><strong>${fmtDate(expDate)}</strong></div>`;

        // Settlement preview for ext-out
        if (isOut && emp) {
            const s = calculateSettlement(emp);
            html += `<div class="tr-review-row settlement-preview"><span>التسوية التقديرية</span><strong style="color:var(--success)">${fmt(s.total)} ر.س</strong></div>`;
        }
    }

    html += `</div>
    <p style="font-size:12px;color:var(--text-3);margin-top:10px">بالضغط على «إرسال الطلب» سيُرسَل للاعتماد تلقائياً.</p>`;
    return html;
}

// ===== Save New Transfer =====
function saveNewTransfer() {
    const empId = document.getElementById('tr-employee')?.value;
    if (!empId) { showToast('يرجى اختيار الموظف', 'error'); return; }
    const emp = employees.find(e => e.id === empId);
    if (!emp) { showToast('موظف غير موجود', 'error'); return; }

    const isInt  = _pendingTransferType === 'internal';
    const isOut  = _pendingTransferDirection === 'out';

    // Validate active status for outgoing
    if (isInt && emp.status !== 'نشط') {
        showToast('لا يمكن نقل موظف غير نشط داخلياً', 'error'); return;
    }
    if (isOut && emp.status !== 'نشط') {
        showToast('لا يمكن إصدار نقل خروج لموظف غير نشط', 'error'); return;
    }

    const id = uid();
    const now = new Date().toISOString();
    let transfer = {
        id,
        type:        _pendingTransferType,
        direction:   _pendingTransferDirection || null,
        employeeId:  empId,
        employeeName: emp.name,
        employeeCode: emp.code || '',
        status:      'pending_approval',
        auditLog:    [],
        createdBy:   'مدير النظام',
        createdAt:   now,
        updatedAt:   now,
        notes:       document.getElementById('tr-notes')?.value || '',
    };

    if (isInt) {
        const branch     = document.getElementById('tr-branch')?.value;
        const branchName = branch ? getFacilityName(branch) : null;
        transfer.effectiveDate = document.getElementById('tr-effectiveDate')?.value || now.split('T')[0];
        transfer.changes = {
            facilityId:   branch   ? { from: emp.facilityId, to: branch } : undefined,
            branch:       branchName ? { from: getFacilityName(emp.facilityId), to: branchName } : undefined,
            department:   { from: emp.department || '', to: document.getElementById('tr-dept')?.value || emp.department || '' },
            jobTitle:     { from: emp.jobTitle || '', to: document.getElementById('tr-jobTitle')?.value || emp.jobTitle || '' },
            manager:      { from: emp.manager || '', to: document.getElementById('tr-manager')?.value || emp.manager || '' },
            workLocation: { from: emp.workLocation || '', to: document.getElementById('tr-workLocation')?.value || emp.workLocation || '' },
            salary:       { from: emp.salary, to: document.getElementById('tr-salary')?.value ? Number(document.getElementById('tr-salary').value) : emp.salary },
            grade:        { from: emp.grade || '', to: document.getElementById('tr-grade')?.value || emp.grade || '' },
        };
        // Remove unchanged
        Object.keys(transfer.changes).forEach(k => {
            const c = transfer.changes[k];
            if (!c || c.from === c.to || (c.from === '' && c.to === '')) delete transfer.changes[k];
        });
    } else {
        transfer.targetCompany  = document.getElementById('tr-targetCompany')?.value || '';
        transfer.reason         = document.getElementById('tr-reason')?.value || '';
        transfer.expectedDate   = document.getElementById('tr-expectedDate')?.value || '';
        transfer.transferSubType = isOut ? (document.getElementById('tr-subtype')?.value || '') : undefined;
        if (isOut) transfer.settlement = calculateSettlement(emp);
    }

    // Validation
    if (!isInt && !transfer.targetCompany) { showToast('يرجى إدخال اسم الجهة', 'error'); return; }
    if (!isInt && !transfer.reason)        { showToast('يرجى إدخال سبب النقل', 'error'); return; }
    if (isOut && !transfer.transferSubType){ showToast('يرجى تحديد نوع النقل', 'error'); return; }

    addTransferAudit(transfer, 'تم إنشاء الطلب', `طلب نقل جديد للموظف ${emp.name}`, 'مدير النظام');
    addTransferAudit(transfer, 'إرسال للاعتماد', 'تم إرسال الطلب تلقائياً للمسؤول المعني');

    // Mark employee as pending transfer for external out
    if (isOut) {
        const idx = employees.findIndex(e => e.id === empId);
        if (idx >= 0) { employees[idx].status = 'خروج مؤقت'; save(); }
    }

    transfers.push(transfer);
    saveTransfers();
    closeTransferModal();
    showToast('تم إرسال طلب النقل للاعتماد', 'success');
    renderTransfers();
}

// ===== Workflow Actions =====
function approveTransfer(transferId) {
    const idx = transfers.findIndex(t => t.id === transferId);
    if (idx < 0) return;
    const t       = transfers[idx];
    const comment = document.getElementById('approvalComment')?.value || '';
    const isInt   = t.type === 'internal';
    const isExt   = t.type === 'external';

    if (isInt) {
        t.status = 'completed';
        applyInternalTransfer(t);
        addTransferAudit(t, 'اعتماد الطلب', comment || 'تم الاعتماد من قِبل المسؤول');
        addTransferAudit(t, 'تحديث سجل الموظف', 'تم تطبيق التغييرات على ملف الموظف تلقائياً');
        addTransferAudit(t, 'اكتمال الطلب', 'تم إغلاق طلب النقل الداخلي بنجاح');
        showToast('تم اعتماد النقل الداخلي وتحديث سجل الموظف', 'success');
    } else {
        t.status = 'pending_government';
        addTransferAudit(t, 'اعتماد الطلب', comment || 'تم الاعتماد من قِبل المسؤول');
        addTransferAudit(t, 'تجميد ملف الموظف', 'تم تغيير حالة الموظف إلى "معلق – نقل"');
        addTransferAudit(t, 'في انتظار الإجراء الحكومي', 'يجب إتمام النقل عبر منصة قوى / أبشر');
        // Freeze employee
        const ei = employees.findIndex(e => e.id === t.employeeId);
        if (ei >= 0) { employees[ei].status = 'خروج مؤقت'; save(); }
        showToast('تم الاعتماد — يُرجى إتمام الإجراءات عبر منصة قوى', 'success');
    }

    t.updatedAt = new Date().toISOString();
    transfers[idx] = t;
    saveTransfers();
    renderTransferDetail();
}

function rejectTransfer(transferId) {
    const reason = prompt('سبب الرفض (اختياري):') || '';
    const idx    = transfers.findIndex(t => t.id === transferId);
    if (idx < 0) return;
    const t = transfers[idx];
    t.status          = 'rejected';
    t.rejectionReason = reason;
    t.updatedAt       = new Date().toISOString();

    // Revert employee status if was changed
    if (t.type === 'external' && t.direction === 'out') {
        const ei = employees.findIndex(e => e.id === t.employeeId);
        if (ei >= 0) { employees[ei].status = 'نشط'; save(); }
    }

    addTransferAudit(t, 'رفض الطلب', reason ? `السبب: ${reason}` : 'رفض بدون ذكر سبب');
    transfers[idx] = t;
    saveTransfers();
    showToast('تم رفض طلب النقل', 'error');
    renderTransferDetail();
}

function cancelTransfer(transferId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    const idx = transfers.findIndex(t => t.id === transferId);
    if (idx < 0) return;
    const t = transfers[idx];
    t.status    = 'cancelled';
    t.updatedAt = new Date().toISOString();

    if (t.type === 'external' && t.direction === 'out') {
        const ei = employees.findIndex(e => e.id === t.employeeId);
        if (ei >= 0) { employees[ei].status = 'نشط'; save(); }
    }

    addTransferAudit(t, 'إلغاء الطلب', 'تم إلغاء طلب النقل');
    transfers[idx] = t;
    saveTransfers();
    showToast('تم إلغاء طلب النقل', 'warning');
    renderTransferDetail();
}

function completeTransfer(transferId) {
    const refNum = document.getElementById('govtRefInput')?.value?.trim();
    if (!refNum) { showToast('يرجى إدخال رقم المرجع الحكومي', 'error'); return; }

    const idx = transfers.findIndex(t => t.id === transferId);
    if (idx < 0) return;
    const t = transfers[idx];
    t.status               = 'completed';
    t.governmentRefNumber  = refNum;
    t.completedDate        = new Date().toISOString();
    t.updatedAt            = t.completedDate;

    // Apply employee status changes
    if (t.type === 'external' && t.direction === 'out') {
        applyExternalTransferOut(t);
        addTransferAudit(t, 'تحديث حالة الموظف', 'تم تحديث الحالة إلى "خروج نهائي"');
    } else if (t.type === 'external' && t.direction === 'in') {
        const ei = employees.findIndex(e => e.id === t.employeeId);
        if (ei >= 0) { employees[ei].status = 'نشط'; save(); }
        addTransferAudit(t, 'تفعيل الموظف', 'تم تفعيل سجل الموظف في المنشأة');
    }

    addTransferAudit(t, 'إتمام النقل الحكومي', `رقم المرجع: ${refNum}`);
    addTransferAudit(t, 'اكتمال الطلب', 'تم إغلاق طلب النقل بنجاح');

    transfers[idx] = t;
    saveTransfers();
    showToast('تم إتمام عملية النقل بنجاح', 'success');
    renderTransferDetail();
}

// ===== Navigation =====
function navigateToTransfer(id) {
    currentTransferId = id;
    navigate('transfer-detail');
}

// ===== Services Hub =====
function renderServices() {
    const pending = transfers.filter(t => t.status === 'pending_approval').length;
    const govt    = transfers.filter(t => t.status === 'pending_government').length;
    const el      = document.getElementById('svc-transfers-pending');
    if (!el) return;
    const parts = [];
    if (pending) parts.push(`${pending} بانتظار الاعتماد`);
    if (govt)    parts.push(`${govt} إجراء حكومي`);
    el.textContent = parts.length ? parts.join(' · ') : `${transfers.length} طلب إجمالاً`;
}

// ===== Event Wiring (called from app.js DOMContentLoaded) =====
function initTransferEvents() {
    // Services hub → transfer card click
    document.getElementById('page-services')?.addEventListener('click', e => {
        if (e.target.closest('#svcTransferBtn')) { navigate('transfers'); return; }
    });

    // Transfer list page
    document.getElementById('page-transfers')?.addEventListener('click', e => {
        if (e.target.closest('#newTransferBtn'))  { openNewTransferModal(); return; }
        const viewBtn = e.target.closest('[data-view-transfer]');
        if (viewBtn) { navigateToTransfer(viewBtn.dataset.viewTransfer); return; }
        const row = e.target.closest('.transfer-row');
        if (row && !e.target.closest('button')) { navigateToTransfer(row.dataset.tid); return; }
        // Filter tabs
        const tab = e.target.closest('[data-filter]');
        if (tab) {
            document.querySelectorAll('#transferTabs [data-filter]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('transferFilterTab').dataset.active = tab.dataset.filter;
            renderTransfers();
        }
    });

    // Transfer detail page
    document.getElementById('page-transfer-detail')?.addEventListener('click', e => {
        if (e.target.closest('#backToTransfersBtn'))  { navigate('transfers'); return; }
        if (e.target.closest('#approveTransferBtn'))  { approveTransfer(currentTransferId); return; }
        if (e.target.closest('#rejectTransferBtn'))   { rejectTransfer(currentTransferId); return; }
        if (e.target.closest('#cancelTransferBtn'))   { cancelTransfer(currentTransferId); return; }
        if (e.target.closest('#completeTransferBtn')) { completeTransfer(currentTransferId); return; }
    });

    // Transfer modal
    document.getElementById('transferModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget || e.target.closest('#closeTransferModalBtn') || e.target.closest('#trModalBack')) {
            if (transferStep === 1 || e.target.closest('#closeTransferModalBtn') || e.target.closest('[id="trModalBack"]') && transferStep === 1) {
                closeTransferModal(); return;
            }
            transferStep--; renderTransferModalStep(); return;
        }
        // Type selection
        const typeBtn = e.target.closest('[data-ttype]');
        if (typeBtn) {
            const t = typeBtn.dataset.ttype;
            if (t === 'internal')     { _pendingTransferType = 'internal';  _pendingTransferDirection = ''; }
            else if (t === 'external-out') { _pendingTransferType = 'external'; _pendingTransferDirection = 'out'; }
            else if (t === 'external-in')  { _pendingTransferType = 'external'; _pendingTransferDirection = 'in'; }
            document.querySelectorAll('.tr-type-btn').forEach(b => b.classList.remove('selected'));
            typeBtn.classList.add('selected');
            return;
        }
        if (e.target.closest('#trModalNext')) {
            if (transferStep === 1) {
                if (!_pendingTransferType) { showToast('يرجى اختيار نوع النقل', 'error'); return; }
                transferStep = 2;
            } else if (transferStep === 2) {
                const empId = document.getElementById('tr-employee')?.value;
                if (!empId) { showToast('يرجى اختيار الموظف', 'error'); return; }
                transferStep = 3;
            }
            renderTransferModalStep(); return;
        }
        if (e.target.closest('#trModalBack')) {
            transferStep = Math.max(1, transferStep - 1);
            renderTransferModalStep(); return;
        }
        if (e.target.closest('#trModalSave')) { saveNewTransfer(); return; }
    });

    // Search
    document.getElementById('transferSearch')?.addEventListener('input', () => renderTransfers());
}
