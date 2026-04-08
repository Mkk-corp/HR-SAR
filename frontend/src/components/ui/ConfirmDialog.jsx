import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.',
  confirmLabel = 'حذف',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="modal-body">
        <div className="confirm-icon">
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
        </div>
        <p className="confirm-title">{title}</p>
        <p className="confirm-sub">{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'جاري الحذف...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
