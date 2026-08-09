import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle } from 'lucide-react';

interface CompletionModalProps {
  durationMinutes: number;
  completedSetsCount: number;
  onSaveAndClose: (rpe: number, notes: string) => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  durationMinutes,
  completedSetsCount,
  onSaveAndClose,
}) => {
  const [rpe, setRpe] = useState<number>(8);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    // Fire confetti celebration!
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#00FF9D', '#FF007A', '#FFD700', '#B026FF']
      });
    } catch {
      // Ignore if confetti fails
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(5, 11, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95) 0%, rgba(32, 44, 68, 0.95) 100%)',
        border: '1px solid var(--accent-cyan)',
        boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
      }}>
        {/* Trophy Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00F0FF 0%, #00FF9D 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#050B14',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.6)',
        }}>
          <Trophy size={36} />
        </div>

        <div>
          <span className="badge glow-gold" style={{ background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            ⚡ 60-MIN SESSION COMPLETE!
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FFFFFF', marginTop: '8px' }}>
            UNHINGED Mastered!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            You crushed pull-ups, left scapular wrapping, hamstring compression, and wrist relief.
          </p>
        </div>

        {/* Stats Summary Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL TIME</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#00F0FF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {durationMinutes} mins
            </div>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>SETS LOGGED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#00FF9D', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {completedSetsCount} sets
            </div>
          </div>
        </div>

        {/* RPE Rating Slider */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Rate Workout Exertion (RPE: 1 - 10): <strong style={{ color: '#00F0FF' }}>{rpe} / 10</strong>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#00F0FF', cursor: 'pointer' }}
          />
        </div>

        {/* Notes Input */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Workout Notes / Left Scapula Feeling:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Left scapula wrapped great on sets 1-3. Jefferson curls felt smooth..."
            style={{
              width: '100%',
              minHeight: '70px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px',
              color: '#FFFFFF',
              fontFamily: 'var(--font-main)',
              fontSize: '0.88rem',
              resize: 'none',
            }}
          />
        </div>

        <button
          className="btn-primary"
          onClick={() => onSaveAndClose(rpe, notes)}
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
        >
          <CheckCircle size={20} fill="#050B14" /> Save Workout & Return to App
        </button>
      </div>
    </div>
  );
};
