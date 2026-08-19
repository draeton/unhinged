import React from 'react';
import type { ExerciseLog } from '../types/workout';

interface SetCompletionDiagramProps {
  exerciseLogs: ExerciseLog[];
}

// Per-exercise row: name + a connected line of dots, one per set -- open (outlined) for
// an uncompleted set, filled/glowing green for a completed one. A line segment between
// two consecutive dots only lights up green when both its endpoints are completed, so a
// completed run reads as one continuous line rather than isolated dots.
export const SetCompletionDiagram: React.FC<SetCompletionDiagramProps> = ({ exerciseLogs }) => {
  if (exerciseLogs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {exerciseLogs.map(log => (
        <div key={log.exerciseId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              flex: '0 0 auto',
              maxWidth: '42%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            {log.exerciseName}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {log.sets.map((setLog, i) => (
              <React.Fragment key={setLog.setNumber}>
                {i > 0 && (
                  <div
                    style={{
                      flex: 1,
                      minWidth: '6px',
                      height: '2px',
                      background: setLog.completed && log.sets[i - 1].completed ? '#00FF9D' : 'var(--border-subtle)',
                    }}
                  />
                )}
                <div
                  role="img"
                  aria-label={`${log.exerciseName} set ${setLog.setNumber} ${setLog.completed ? 'completed' : 'not completed'}`}
                  style={{
                    width: '14px',
                    height: '14px',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    borderRadius: '50%',
                    border: `2px solid ${setLog.completed ? '#00FF9D' : 'var(--border-subtle)'}`,
                    background: setLog.completed ? '#00FF9D' : 'transparent',
                    boxShadow: setLog.completed ? '0 0 6px rgba(0, 255, 157, 0.6)' : 'none',
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
