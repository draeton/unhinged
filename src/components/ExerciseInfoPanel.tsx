import React from 'react';
import type { ResolvedExercise } from '../types/program';
import { AlertCircle, Sparkles, ShieldAlert, Video } from 'lucide-react';

interface ExerciseInfoPanelProps {
  exercise: ResolvedExercise;
  onPlayVideo: (url: string) => void;
}

export const ExerciseInfoPanel: React.FC<ExerciseInfoPanelProps> = ({ exercise, onPlayVideo }) => {
  // Matched by name, not id: once exercises are seeded into Supabase they get generated
  // UUIDs, so a literal id check like the old `exercise.id === 's1'` would never match
  // again. Name is the only stable, human-meaningful field left to key off -- the
  // trade-off is that renaming a matching exercise silently drops its special-case tip,
  // which is acceptable for a cosmetic bonus badge.
  const isLeftScapularFocus = exercise.name === 'Pull-Up & Asymmetry Focus';
  // Previously checked id 'm2' ("PNF Hamstring Stretch"), but the tip content below is
  // about handstand parallettes/wrist support -- a pre-existing mismatch, not something
  // introduced here. Rewired to the exercise it's actually about.
  const isHandstandFocus = exercise.name === 'Handstand Prep & Balance';
  const isJeffersonCurlFocus = exercise.name === 'Modified Jefferson Curls';

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.2 }}>
            {exercise.name}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
              {exercise.repsOrTime}
            </span>
            {exercise.equipment && (
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                {exercise.equipment}
              </span>
            )}
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.5 }}>
          {exercise.description}
        </p>
      </div>

      {/* SPECIAL CUE HIGHLIGHT: Left Scapular Asymmetry Warning */}
      {isLeftScapularFocus && (
        <div className="left-scapula-badge" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.88rem', letterSpacing: '0.04em' }}>
              LEFT SCAPULAR ASYMMETRY FOCUS
            </div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px', opacity: 0.9, color: 'var(--text-main)' }}>
              Wrap left shoulder blade DOWN and BACK firmly into back pocket during the 3 slow scapular pull-ups before pulling chin over bar!
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL CUE HIGHLIGHT: Handstand Parallettes Tip */}
      {isHandstandFocus && (
        <div style={{
          background: 'rgba(0, 240, 255, 0.12)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          padding: '12px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#00F0FF'
        }}>
          <Sparkles size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.88rem' }}>PRO WRIST SAFETY TIP</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px', color: 'var(--text-muted)' }}>
              If your wrists feel limited or fatigued, use parallettes or wrist support blocks to reduce wrist extension angle!
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL CUE HIGHLIGHT: Jefferson Curl Spine Segmenting */}
      {isJeffersonCurlFocus && (
        <div style={{
          background: 'rgba(0, 240, 255, 0.12)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          padding: '12px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#00F0FF'
        }}>
          <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.88rem' }}>SPINAL ARTICULATION RULE</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px', color: 'var(--text-muted)' }}>
              Tuck chin to chest first, then roll down vertebra-by-vertebra. Keep weight light (5–10 lbs max).
            </div>
          </div>
        </div>
      )}

      {/* Form Cues List */}
      <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Form Execution Cues
        </div>
        <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
          {exercise.formCues.map((cue, i) => (
            <li key={i}>{cue}</li>
          ))}
        </ul>
        {exercise.videoUrls && exercise.videoUrls.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {exercise.videoUrls.map((video, idx) => (
              <button
                key={idx}
                onClick={() => onPlayVideo(video.url)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: 'var(--accent-cyan)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <Video size={16} />
                <span>{video.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
