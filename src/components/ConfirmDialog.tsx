import React from 'react';
import { Drawer } from './Drawer';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Bottom-sheet confirm, built on Drawer so cancelling (backdrop click, swipe-down) matches the
// non-destructive default: it dismisses the dialog and leaves the underlying screen untouched.
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Discard',
  cancelLabel = 'Keep Editing',
  onConfirm,
  onCancel,
}) => (
  <Drawer isOpen={isOpen} onClose={onCancel}>
    <div style={{ padding: '8px 20px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn-secondary"
          onClick={onCancel}
          style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
        >
          {cancelLabel}
        </button>
        <button
          className="btn-primary"
          onClick={onConfirm}
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '12px',
            fontSize: '0.9rem',
            background: '#FF3366',
            boxShadow: '0 4px 20px rgba(255, 51, 102, 0.3)',
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </Drawer>
);
