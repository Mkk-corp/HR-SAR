'use strict';

// ===== Auth Manager =====
const authManager = {
    _user: null,

    getToken()       { return localStorage.getItem('hr_token'); },
    getUser()        { return this._user || JSON.parse(localStorage.getItem('hr_user') || 'null'); },
    isLoggedIn()     { return !!this.getToken(); },
    hasPermission(p) { return this.getUser()?.permissions?.includes(p) ?? false; },
    hasRole(r)       { return this.getUser()?.roles?.includes(r) ?? false; },

    async login(email, password) {
        const data = await api.login({ email, password });
        localStorage.setItem('hr_token', data.token);
        localStorage.setItem('hr_user',  JSON.stringify(data));
        this._user = data;
        return data;
    },

    logout() {
        localStorage.removeItem('hr_token');
        localStorage.removeItem('hr_user');
        this._user = null;
        showLoginScreen();
    },

    init() {
        this._user = JSON.parse(localStorage.getItem('hr_user') || 'null');
    },
};

// ===== Login Screen =====
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

function hideLoginScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
}

// ===== Permission-based UI =====
function applyPermissions() {
    document.querySelectorAll('[data-permission]').forEach(el => {
        const perm = el.dataset.permission;
        if (!authManager.hasPermission(perm)) {
            el.style.display = 'none';
        } else {
            el.style.display = '';
        }
    });

    document.querySelectorAll('[data-permission-tab]').forEach(el => {
        const perm = el.dataset.permissionTab;
        if (!authManager.hasPermission(perm)) {
            el.style.display = 'none';
        } else {
            el.style.display = '';
        }
    });

    // Update user display in header
    const user = authManager.getUser();
    if (user) {
        const nameEl = document.getElementById('currentUserName');
        const roleEl = document.getElementById('currentUserRole');
        if (nameEl) nameEl.textContent = user.fullName || user.email;
        if (roleEl) roleEl.textContent = user.roles?.[0] || '';
    }
}

// ===== Login Form Handler =====
async function handleLogin(e) {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');
    const btn      = document.getElementById('loginBtn');

    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'جاري تسجيل الدخول...';

    try {
        await authManager.login(email, password);
        hideLoginScreen();
        applyPermissions();
        await initApp();
    } catch (err) {
        errEl.textContent = err.message || 'فشل تسجيل الدخول';
    } finally {
        btn.disabled = false;
        btn.textContent = 'تسجيل الدخول';
    }
}

// ===== Profile Modal =====
async function openProfileModal() {
    try {
        const profile = await api.getProfile();
        document.getElementById('profileFullName').value  = profile.fullName || '';
        document.getElementById('profileJobTitle').value  = profile.jobTitle || '';
        document.getElementById('profileEmail').textContent = profile.email;
        document.getElementById('profileRoles').textContent = (profile.roles || []).join(', ') || '—';
        document.getElementById('profileModal').classList.remove('hidden');
    } catch (e) {
        showToast('تعذر تحميل الملف الشخصي', 'error');
    }
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
    document.getElementById('profileChangePwSection').classList.add('hidden');
}

async function saveProfile(e) {
    e.preventDefault();
    const fullName = document.getElementById('profileFullName').value.trim();
    const jobTitle = document.getElementById('profileJobTitle').value.trim();
    try {
        const updated = await api.updateProfile({ fullName, jobTitle });
        // Update cached user
        const u = authManager.getUser();
        if (u) { u.fullName = updated.fullName; u.jobTitle = updated.jobTitle; localStorage.setItem('hr_user', JSON.stringify(u)); }
        applyPermissions();
        showToast('تم تحديث الملف الشخصي', 'success');
        closeProfileModal();
    } catch (err) {
        showToast(err.message || 'فشل التحديث', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();
    const current  = document.getElementById('currentPassword').value;
    const newPw    = document.getElementById('newPassword').value;
    const confirm  = document.getElementById('confirmPassword').value;

    if (newPw !== confirm) { showToast('كلمة المرور الجديدة غير متطابقة', 'error'); return; }
    try {
        await api.changePassword({ currentPassword: current, newPassword: newPw });
        showToast('تم تغيير كلمة المرور', 'success');
        document.getElementById('profileChangePwSection').classList.add('hidden');
    } catch (err) {
        showToast(err.message || 'فشل تغيير كلمة المرور', 'error');
    }
}
