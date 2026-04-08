'use strict';

// ===== State =====
let _users       = [];
let _roles       = [];
let _allPerms    = [];
let _editUserId  = null;
let _editRoleId  = null;
let _deleteUserId   = null;
let _deleteRoleId   = null;

// ===================================================================
//  USERS TAB
// ===================================================================

async function loadUsersTab() {
    if (!authManager.hasPermission('users.view')) return;
    try {
        [_users, _roles] = await Promise.all([api.getUsers(), api.getRoles()]);
        renderUsersTable();
    } catch (e) {
        showToast('تعذر تحميل المستخدمين', 'error');
    }
}

function renderUsersTable() {
    const tbody  = document.getElementById('usersTableBody');
    const empty  = document.getElementById('usersEmptyState');
    const table  = document.getElementById('usersTable');
    if (!tbody) return;

    const visible = _users.length > 0;
    table.style.display  = visible ? '' : 'none';
    if (empty) empty.classList.toggle('hidden', visible);

    tbody.innerHTML = _users.map(u => `
        <tr>
            <td>
                <div class="emp-cell">
                    <div class="emp-avatar" style="background:${avatarColor(u.fullName)}">${(u.fullName||'?').charAt(0)}</div>
                    <div>
                        <div class="emp-name">${u.fullName}</div>
                        <div class="emp-email">${u.jobTitle || ''}</div>
                    </div>
                </div>
            </td>
            <td style="color:var(--text-2);font-size:13px">${u.email}</td>
            <td>${(u.roles||[]).map(r => `<span class="badge badge-blue">${r}</span>`).join(' ') || '—'}</td>
            <td>${u.isActive ? '<span class="badge badge-success">نشط</span>' : '<span class="badge badge-danger">غير نشط</span>'}</td>
            <td style="color:var(--text-3);font-size:12.5px">${fmtDate(u.createdAt)}</td>
            <td>
                <div class="action-btns">
                    ${authManager.hasPermission('users.edit')   ? `<button class="btn btn-sm btn-ghost" onclick="openEditUserModal('${u.id}')">تعديل</button>` : ''}
                    ${authManager.hasPermission('users.edit')   ? `<button class="btn btn-sm btn-ghost" onclick="openResetPasswordModal('${u.id}','${u.fullName}')">كلمة المرور</button>` : ''}
                    ${authManager.hasPermission('users.delete') ? `<button class="btn btn-sm btn-danger" onclick="confirmDeleteUser('${u.id}','${u.fullName}')">حذف</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// ── Create User Modal ────────────────────────────────────────────────────────

function openCreateUserModal() {
    _editUserId = null;
    document.getElementById('userModalTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('userForm').reset();
    document.getElementById('userPasswordGroup').style.display = '';
    populateRoleSelect('userRoleId');
    document.getElementById('userModal').classList.remove('hidden');
}

async function openEditUserModal(id) {
    const user = _users.find(u => u.id === id);
    if (!user) return;
    _editUserId = id;
    document.getElementById('userModalTitle').textContent = 'تعديل المستخدم';
    document.getElementById('userFullName').value  = user.fullName;
    document.getElementById('userJobTitle').value  = user.jobTitle || '';
    document.getElementById('userEmail').value     = user.email;
    document.getElementById('userIsActive').checked = user.isActive;
    document.getElementById('userPasswordGroup').style.display = 'none';
    populateRoleSelect('userRoleId', user.roles?.[0]);
    document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
    _editUserId = null;
}

function populateRoleSelect(selectId, selectedRoleName = '') {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— اختر دوراً —</option>' +
        _roles.map(r => `<option value="${r.id}" ${r.name === selectedRoleName ? 'selected' : ''}>${r.name}${r.description ? ' — ' + r.description : ''}</option>`).join('');
}

async function saveUser(e) {
    e.preventDefault();
    const fullName = document.getElementById('userFullName').value.trim();
    const jobTitle = document.getElementById('userJobTitle').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword')?.value;
    const roleId   = document.getElementById('userRoleId').value;
    const isActive = document.getElementById('userIsActive')?.checked ?? true;

    try {
        if (_editUserId) {
            await api.updateUser(_editUserId, { fullName, jobTitle, isActive, roleId: roleId || null });
            showToast('تم تحديث المستخدم', 'success');
        } else {
            await api.createUser({ email, password, fullName, jobTitle, roleId });
            showToast('تم إنشاء المستخدم', 'success');
        }
        closeUserModal();
        await loadUsersTab();
    } catch (err) {
        showToast(err.message || 'فشل الحفظ', 'error');
    }
}

// ── Reset Password ────────────────────────────────────────────────────────────

function openResetPasswordModal(id, name) {
    _deleteUserId = id;
    document.getElementById('resetPwUserName').textContent = name;
    document.getElementById('resetPwModal').classList.remove('hidden');
}

function closeResetPasswordModal() {
    document.getElementById('resetPwModal').classList.add('hidden');
    _deleteUserId = null;
}

async function confirmResetPassword(e) {
    e.preventDefault();
    const newPw   = document.getElementById('resetNewPassword').value;
    const confirm = document.getElementById('resetConfirmPassword').value;
    if (newPw !== confirm) { showToast('كلمة المرور غير متطابقة', 'error'); return; }
    try {
        await api.resetPassword(_deleteUserId, { newPassword: newPw });
        showToast('تم إعادة تعيين كلمة المرور', 'success');
        closeResetPasswordModal();
    } catch (err) {
        showToast(err.message || 'فشل إعادة التعيين', 'error');
    }
}

// ── Delete User ───────────────────────────────────────────────────────────────

function confirmDeleteUser(id, name) {
    _deleteUserId = id;
    document.getElementById('deleteUserName').textContent = name;
    document.getElementById('deleteUserModal').classList.remove('hidden');
}

function closeDeleteUserModal() {
    document.getElementById('deleteUserModal').classList.add('hidden');
    _deleteUserId = null;
}

async function executeDeleteUser() {
    try {
        await api.deleteUser(_deleteUserId);
        showToast('تم حذف المستخدم', 'success');
        closeDeleteUserModal();
        await loadUsersTab();
    } catch (err) {
        showToast(err.message || 'فشل الحذف', 'error');
    }
}

// ===================================================================
//  ROLES TAB
// ===================================================================

async function loadRolesTab() {
    if (!authManager.hasPermission('roles.view')) return;
    try {
        [_roles, _allPerms] = await Promise.all([api.getRoles(), api.getAllPermissions()]);
        renderRolesTable();
    } catch (e) {
        showToast('تعذر تحميل الأدوار', 'error');
    }
}

function renderRolesTable() {
    const tbody = document.getElementById('rolesTableBody');
    const empty = document.getElementById('rolesEmptyState');
    const table = document.getElementById('rolesTable');
    if (!tbody) return;

    const visible = _roles.length > 0;
    table.style.display = visible ? '' : 'none';
    if (empty) empty.classList.toggle('hidden', visible);

    tbody.innerHTML = _roles.map(r => `
        <tr>
            <td>
                <div style="font-weight:600;font-size:13.5px;color:var(--text)">${r.name}</div>
            </td>
            <td style="color:var(--text-3);font-size:13px">${r.description || '—'}</td>
            <td><span class="badge badge-blue">${r.permissionCount} صلاحية</span></td>
            <td><span class="badge ${r.userCount > 0 ? 'badge-success' : 'badge-blue'}">${r.userCount} مستخدم</span></td>
            <td>
                <div class="action-btns">
                    ${authManager.hasPermission('roles.edit')   ? `<button class="btn btn-sm btn-ghost" onclick="openEditRoleModal('${r.id}')">تعديل</button>` : ''}
                    ${authManager.hasPermission('roles.delete') ? `<button class="btn btn-sm btn-danger" onclick="confirmDeleteRole('${r.id}','${r.name}')" ${r.userCount > 0 ? 'disabled title="الدور مُسنَد لمستخدمين"' : ''}>حذف</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// ── Create / Edit Role Modal ──────────────────────────────────────────────────

function openCreateRoleModal() {
    _editRoleId = null;
    document.getElementById('roleModalTitle').textContent = 'إنشاء دور جديد';
    document.getElementById('roleForm').reset();
    renderPermissionsGrid([]);
    document.getElementById('roleModal').classList.remove('hidden');
}

async function openEditRoleModal(id) {
    try {
        const role = await api.getRole(id);
        _editRoleId = id;
        document.getElementById('roleModalTitle').textContent = 'تعديل الدور';
        document.getElementById('roleName').value        = role.name;
        document.getElementById('roleDescription').value = role.description || '';
        const selectedIds = (role.permissions || []).map(p => p.id);
        renderPermissionsGrid(selectedIds);
        document.getElementById('roleModal').classList.remove('hidden');
    } catch (e) {
        showToast('تعذر تحميل الدور', 'error');
    }
}

function closeRoleModal() {
    document.getElementById('roleModal').classList.add('hidden');
    _editRoleId = null;
}

function renderPermissionsGrid(selectedIds = []) {
    const container = document.getElementById('permissionsGrid');
    if (!container) return;

    const grouped = {};
    _allPerms.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    });

    container.innerHTML = Object.entries(grouped).map(([cat, perms]) => `
        <div class="perm-group">
            <div class="perm-group-header">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-weight:600">
                    <input type="checkbox" class="perm-cat-check" data-cat="${cat}"
                        ${perms.every(p => selectedIds.includes(p.id)) ? 'checked' : ''}
                        onchange="togglePermCategory('${cat}', this.checked)">
                    ${cat}
                </label>
            </div>
            <div class="perm-items">
                ${perms.map(p => `
                    <label class="perm-item">
                        <input type="checkbox" name="permission" value="${p.id}"
                            data-cat="${cat}"
                            ${selectedIds.includes(p.id) ? 'checked' : ''}
                            onchange="updateCatCheckbox('${cat}')">
                        ${p.displayName}
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function togglePermCategory(cat, checked) {
    document.querySelectorAll(`input[name="permission"][data-cat="${cat}"]`).forEach(cb => {
        cb.checked = checked;
    });
}

function updateCatCheckbox(cat) {
    const items  = [...document.querySelectorAll(`input[name="permission"][data-cat="${cat}"]`)];
    const catCb  = document.querySelector(`.perm-cat-check[data-cat="${cat}"]`);
    if (!catCb) return;
    catCb.checked = items.every(i => i.checked);
    catCb.indeterminate = !catCb.checked && items.some(i => i.checked);
}

async function saveRole(e) {
    e.preventDefault();
    const name        = document.getElementById('roleName').value.trim();
    const description = document.getElementById('roleDescription').value.trim();
    const permissionIds = [...document.querySelectorAll('input[name="permission"]:checked')]
        .map(cb => parseInt(cb.value));

    try {
        if (_editRoleId) {
            await api.updateRole(_editRoleId, { name, description, permissionIds });
            showToast('تم تحديث الدور', 'success');
        } else {
            await api.createRole({ name, description, permissionIds });
            showToast('تم إنشاء الدور', 'success');
        }
        closeRoleModal();
        await loadRolesTab();
    } catch (err) {
        showToast(err.message || 'فشل الحفظ', 'error');
    }
}

// ── Delete Role ───────────────────────────────────────────────────────────────

function confirmDeleteRole(id, name) {
    _deleteRoleId = id;
    document.getElementById('deleteRoleName').textContent = name;
    document.getElementById('deleteRoleModal').classList.remove('hidden');
}

function closeDeleteRoleModal() {
    document.getElementById('deleteRoleModal').classList.add('hidden');
    _deleteRoleId = null;
}

async function executeDeleteRole() {
    try {
        await api.deleteRole(_deleteRoleId);
        showToast('تم حذف الدور', 'success');
        closeDeleteRoleModal();
        await loadRolesTab();
    } catch (err) {
        showToast(err.message || 'فشل الحذف', 'error');
        closeDeleteRoleModal();
    }
}
