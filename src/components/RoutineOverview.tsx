import React, { useState } from 'react';
import type { WorkoutBlock } from '../types/workout';
import { Clock, ChevronDown, ChevronUp, ShieldAlert, Video } from 'lucide-react';

interface RoutineOverviewProps {
  blocks: WorkoutBlock[];
  onPlayVideo: (url: string) => void;
  isCondensed?: boolean;
  activeExerciseId?: string | null;
  completedSetsMap?: { [id: string]: number };
}

export const RoutineOverview: React.FC<RoutineOverviewProps> = ({ blocks, onPlayVideo, isCondensed, activeExerciseId, completedSetsMap }) => {
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
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: isCondensed ? '0 16px 24px 16px' : '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {!isCondensed && (
        <>
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
        </>
      )}

      {/* Workout Blocks List */}
      <div className={isCondensed ? "glass-panel" : ""} style={{ 
        padding: isCondensed ? '24px' : '0', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isCondensed ? '32px' : '24px' 
      }}>
        {filteredBlocks.map((block) => (
          <div key={block.id} className={!isCondensed ? "glass-panel" : ""} style={{ padding: !isCondensed ? '24px' : '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
          </div>

          {/* Exercises in Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {block.exercises.map((ex, eIdx) => {
              const isExpanded = expandedExerciseId === ex.id;
              const isLeftScapular = ex.id === 's1';
              
              const isActive = activeExerciseId === ex.id;
              const isFullyComplete = completedSetsMap ? (completedSetsMap[ex.id] || 0) >= ex.sets : false;
              
              let background = 'rgba(255, 255, 255, 0.03)';
              let border = '1px solid var(--border-subtle)';
              let titleColor = '#FFFFFF';
              let badgeColor = 'rgba(255, 255, 255, 0.08)';
              let badgeTextColor = 'var(--text-muted)';
              
              if (isFullyComplete) {
                background = 'rgba(0, 255, 157, 0.1)';
                border = '1px solid #00FF9D';
                titleColor = '#00FF9D';
                badgeColor = 'rgba(0, 255, 157, 0.2)';
                badgeTextColor = '#00FF9D';
              } else if (isActive) {
                background = 'rgba(0, 240, 255, 0.1)';
                border = '1px solid #00F0FF';
                titleColor = '#00F0FF';
                badgeColor = 'rgba(0, 240, 255, 0.2)';
                badgeTextColor = '#00F0FF';
              }

              return (
                <div
                  key={ex.id}
                  style={{
                    background,
                    border,
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
                        background: badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: badgeTextColor,
                      }}>
                        {eIdx + 1}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: titleColor }}>
                            {ex.name}
                          </h4>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {ex.repsOrTime} • Equipment: {ex.equipment}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {isLeftScapular && (
                          <span className="badge left-scapula-badge" style={{ fontSize: '0.68rem' }}>
                            LEFT SCAPULA FOCUS
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                          Rest: {ex.restSeconds}s
                        </span>
                      </div>
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

                      <div style={{ fontSize: '0.8rem', color: '#00F0FF', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={14} /> <strong>Safety Note:</strong>
                        </div>
                        <div style={{ paddingLeft: '20px' }}>
                          {ex.safetyTip}
                        </div>
                      </div>

                      {ex.videoUrls && ex.videoUrls.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          {ex.videoUrls.map((video, idx) => (
                            <button
                              key={idx}
                              onClick={() => onPlayVideo(video.url)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: '#00F0FF',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                              onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                            >
                              <Video size={16} />
                              <span>{video.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ))}
      </div>
    </div>
  );
};
