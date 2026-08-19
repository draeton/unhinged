import React from 'react';
import type { ExerciseLog } from '../types/workout';

interface WorkoutCompletionDiagramProps {
  exerciseLogs: ExerciseLog[];
}

const isExerciseComplete = (log: ExerciseLog): boolean =>
  log.sets.length > 0 && log.sets.every(s => s.completed);

// A single line for the whole workout, one dot per exercise (in program order) -- open
// (outlined) if that exercise still has any uncompleted set, filled/glowing green if
// every set on it was completed. The connecting segment between two dots only lights up
// green when both endpoints are fully completed, so a completed run reads as one
// continuous line. No text labels -- purely a visual completion trail.
export const WorkoutCompletionDiagram: React.FC<WorkoutCompletionDiagramProps> = ({ exerciseLogs }) => {
  if (exerciseLogs.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {exerciseLogs.map((log, i) => {
        const complete = isExerciseComplete(log);
        return (
          <React.Fragment key={log.exerciseId}>
            {i > 0 && (
              <div
                style={{
                  flex: 1,
                  minWidth: '6px',
                  height: '2px',
                  background: complete && isExerciseComplete(exerciseLogs[i - 1]) ? '#00FF9D' : 'var(--border-subtle)',
                }}
              />
            )}
            <div
              role="img"
              aria-label={`${log.exerciseName}: ${complete ? 'completed' : 'not completed'}`}
              style={{
                width: '14px',
                height: '14px',
                flexShrink: 0,
                boxSizing: 'border-box',
                borderRadius: '50%',
                border: `2px solid ${complete ? '#00FF9D' : 'var(--border-subtle)'}`,
                background: complete ? '#00FF9D' : 'transparent',
                boxShadow: complete ? '0 0 6px rgba(0, 255, 157, 0.6)' : 'none',
              }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};
