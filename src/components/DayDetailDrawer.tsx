import React from 'react';
import type { CompletedWorkout } from '../types/workout';
import { Calendar as CalendarIcon, Clock, Activity, CheckCircle } from 'lucide-react';

interface DayDetailDrawerProps {
  dateStr: string;
  completedWorkouts: CompletedWorkout[];
}

export const DayDetailDrawer: React.FC<DayDetailDrawerProps> = ({
  dateStr,
  completedWorkouts,
}) => {
  const getLocalDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const dayWorkouts = completedWorkouts.filter(w => getLocalDateString(new Date(w.date)) === dateStr);

  const displayDate = new Date(dateStr + 'T12:00:00'); // Prevent timezone shift issues

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarIcon size={20} color="#00F0FF" />
        {displayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </h2>

      {dayWorkouts.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          No workouts logged on this date.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dayWorkouts.map((w, index) => (
            <div key={w.id || index} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                  <CheckCircle size={16} color="#00F0FF" />
                  Workout {index + 1}
                </div>
                {w.rpe ? <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>RPE: <strong style={{ color: '#fff' }}>{w.rpe}/10</strong></div> : null}
              </div>

              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  <Clock size={16} />
                  <span>{w.durationMinutes} mins</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  <Activity size={16} />
                  <span>{w.totalSetsCompleted} sets</span>
                </div>
              </div>
              
              {w.notes && (
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontStyle: 'italic' }}>
                  "{w.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
