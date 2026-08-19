import React from 'react';
import type { CompletedWorkout } from '../types/workout';
import { Flame, Calendar, Clock, CheckCircle2, Trophy } from 'lucide-react';
import { WorkoutCompletionDiagram } from './WorkoutCompletionDiagram';

interface HistoryStatsProps {
  workouts: CompletedWorkout[];
  prs?: any[];
  onClearHistory?: () => void;
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ workouts }) => {
  const totalMinutes = workouts.reduce((sum, w) => sum + w.durationMinutes, 0);
  const totalSets = workouts.reduce((sum, w) => sum + w.totalSetsCompleted, 0);

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00F0FF' }}>
            <Flame size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              TOTAL WORKOUTS
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {workouts.length}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00F0FF' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              TIME LOGGED
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {totalMinutes} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>mins</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00F0FF' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              SETS COMPLETED
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {totalSets}
            </div>
          </div>
        </div>

      </div>

      {/* Completed Sessions Logbook */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-cyan)" />
            Completed Sessions Logbook
          </h3>
        </div>

        {workouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Trophy size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>No completed sessions recorded yet!</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Launch your first 60-minute session from the Live Player tab.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workouts.map((w, idx) => (
              <div key={w.id || idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#FFFFFF' }}>
                      {w.programName ?? 'Workout'} — Session #{workouts.length - idx}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(w.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF' }}>
                      ⏱️ {w.durationMinutes} mins
                    </span>
                    <span className="badge" style={{ background: 'rgba(0, 255, 157, 0.15)', color: '#00F0FF' }}>
                      ✅ {w.totalSetsCompleted} sets
                    </span>
                  </div>
                </div>

                {w.exerciseLogs.length > 0 && (
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <WorkoutCompletionDiagram exerciseLogs={w.exerciseLogs} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
