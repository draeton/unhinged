import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ProgramBlock } from '../types/program';
import { updateBlock } from '../services/programs';
import { AutoGrowTextarea } from './AutoGrowTextarea';

interface BlockInfoDrawerProps {
  block: ProgramBlock;
  onSaved: (block: ProgramBlock) => void;
  onClose: () => void;
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: '700',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '6px',
};

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  padding: '10px',
  color: '#FFFFFF',
  fontFamily: 'var(--font-main)',
  fontSize: '1.15rem',
};

interface FormState {
  title: string;
  subtitle: string;
}

export const BlockInfoDrawer: React.FC<BlockInfoDrawerProps> = ({ block, onSaved, onClose }) => {
  const initialForm = useRef<FormState>({ title: block.title, subtitle: block.subtitle });
  const [form, setForm] = useState<FormState>(initialForm.current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm.current);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await updateBlock(block.id, { title: form.title, subtitle: form.subtitle });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save block.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>Edit Block</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
          <X size={22} />
        </button>
      </div>

      <div>
        <label style={fieldLabelStyle}>Title</label>
        <AutoGrowTextarea
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Warm-Up"
          style={fieldInputStyle}
        />
      </div>

      <div>
        <label style={fieldLabelStyle}>Description</label>
        <AutoGrowTextarea
          value={form.subtitle}
          onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
          placeholder="Briefly describe this block..."
          style={{ ...fieldInputStyle, minHeight: '70px' }}
        />
      </div>

      {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving || !isDirty}
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '14px',
          fontSize: '1rem',
          ...((saving || !isDirty) && {
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-dim)',
            boxShadow: 'none',
            cursor: 'not-allowed',
          }),
        }}
      >
        {saving ? 'Saving...' : 'Save Block'}
      </button>
    </div>
  );
};
