import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { apiFetch } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    jobTitle: user?.jobTitle || '',
    photoUrl: user?.photoUrl || null,
  });
  const [photoPreview, setPhotoPreview] = useState(user?.photoUrl || null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('حجم الصورة يجب ألا يتجاوز 2 ميجابايت', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPhotoPreview(base64);
      setProfile((p) => ({ ...p, photoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName: profile.fullName, jobTitle: profile.jobTitle, photoUrl: profile.photoUrl }),
      });
      updateUser({ fullName: res.fullName, jobTitle: res.jobTitle, photoUrl: res.photoUrl });
      toast('تم حفظ البيانات بنجاح', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }
    setPwdLoading(true);
    try {
      await apiFetch('/profile/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      });
      toast('تم تغيير كلمة المرور بنجاح', 'success');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* ── Personal info + photo ── */}
      <div className={`card ${styles.section}`}>
        <div className="card-header">
          <h3>المعلومات الشخصية</h3>
        </div>
        <div className="card-body">
          {/* Photo row */}
          <div className={styles.photoRow}>
            <div className={styles.photoWrap}>
              <Avatar name={user?.fullName || user?.email || 'U'} src={photoPreview} size={72} />
              <button
                type="button"
                className={styles.photoEdit}
                onClick={() => fileRef.current?.click()}
                title="تغيير الصورة"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.fullName || '—'}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>{user?.email}</div>
              {user?.roles?.[0] && (
                <div style={{ marginTop: 6 }}>
                  <span className="badge badge-blue">{user.roles[0]}</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="form-grid">
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input value={user?.email || ''} disabled />
              </div>
              <div className="form-group">
                <label>الدور</label>
                <input value={user?.roles?.[0] || 'لا يوجد دور'} disabled />
              </div>
              <div className="form-group">
                <label>الاسم الكامل <span className="required">*</span></label>
                <input
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="الاسم الكامل"
                  required
                />
              </div>
              <div className="form-group">
                <label>المسمى الوظيفي</label>
                <input
                  value={profile.jobTitle}
                  onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="المسمى الوظيفي"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Change password ── */}
      <div className={`card ${styles.section}`}>
        <div className="card-header">
          <h3>تغيير كلمة المرور</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handlePasswordChange}>
            <div className="form-grid single">
              <div className="form-group">
                <label>كلمة المرور الحالية <span className="required">*</span></label>
                <input
                  type="password"
                  value={pwd.currentPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>كلمة المرور الجديدة <span className="required">*</span></label>
                <input
                  type="password"
                  value={pwd.newPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>تأكيد كلمة المرور الجديدة <span className="required">*</span></label>
                <input
                  type="password"
                  value={pwd.confirmPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                {pwdLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
