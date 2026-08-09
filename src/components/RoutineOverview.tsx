import React, { useState } from 'react';
import type { WorkoutBlock } from '../types/workout';
import { Play, Clock, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface RoutineOverviewProps {
  blocks: WorkoutBlock[];
  onStartFromBlock: (blockIndex: number) => void;
}

export const RoutineOverview: React.FC<RoutineOverviewProps> = ({ blocks, onStartFromBlock }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedExerciseId(prev => (prev === id ? null : id));
  };

  const filteredBlocks = blocks.filter(b => {
    if (selectedCategory === 'all') return true;
    return b.category === selectedCategory;
  });

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Overview Header Banner */}
      <div className="glass-panel" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.9) 0%, rgba(32, 44, 68, 0.6) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge glow-cyan" style={{ background: 'rgba(0, 240, 255, 0.12)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
              ⚡ OFFICIAL PROGRAM STRUCTURE
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FFFFFF', marginTop: '8px' }}>
              60-Min: Pull-Ups, Hamstrings & Wrists Blueprint
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px', maxWidth: '680px', lineHeight: 1.5 }}>
              A scientifically balanced routine pairing heavy upper vertical pulling and left scapular symmetry with deep hamstring compression, Jefferson curling, and wrist relief.
            </p>
          </div>

          <button className="btn-primary" onClick={() => onStartFromBlock(0)}>
            <Play size={18} fill="#050B14" /> Start Full Workout
          </button>
        </div>

        {/* Quick Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
          {[
            { id: 'all', label: 'All 4 Blocks (60 Min)' },
            { id: 'warmup', label: '1. Warm-up (10m)' },
            { id: 'pullups', label: '2. Strength (20m)' },
            { id: 'hamstrings', label: '3. Mobility & Forward Fold (25m)' },
            { id: 'cooldown', label: '4. Cooldown (5m)' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedCategory === cat.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: selectedCategory === cat.id ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat.id ? '#00F0FF' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Blocks List */}
      {filteredBlocks.map((block, blockIdx) => (
        <div key={block.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Block Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ background: block.badgeColor, color: '#050B14', fontWeight: '800' }}>
                  {block.title}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> ~{block.durationMinutes} Minutes
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
                {block.subtitle}
              </p>
            </div>

            <button className="btn-secondary" onClick={() => onStartFromBlock(blockIdx)} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              <Play size={14} /> Jump to Block
            </button>
          </div>

          {/* Exercises in Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {block.exercises.map((ex, eIdx) => {
              const isExpanded = expandedExerciseId === ex.id;
              const isLeftScapular = ex.id === 's1';

              return (
                <div
                  key={ex.id}
                  style={{
                    background: isLeftScapular ? 'rgba(176, 38, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isLeftScapular ? '1px solid rgba(176, 38, 255, 0.3)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    onClick={() => toggleExpand(ex.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: 'var(--text-muted)',
                      }}>
                        {eIdx + 1}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF' }}>
                            {ex.name}
                          </h4>
                          {isLeftScapular && (
                            <span className="badge left-scapula-badge" style={{ fontSize: '0.68rem' }}>
                              LEFT SCAPULA FOCUS
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {ex.repsOrTime} • Equipment: {ex.equipment}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '12px' }}>
                        Rest: {ex.restSeconds}s
                      </span>
                      {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {ex.description}
                      </p>

                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Form Execution Cues:
                        </div>
                        <ul style={{ paddingLeft: '16px', fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {ex.formCues.map((cue, i) => (
                            <li key={i}>{cue}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#FF007A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={14} /> <strong>Safety Note:</strong> {ex.safetyTip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ))}
    </div>
  );
};
