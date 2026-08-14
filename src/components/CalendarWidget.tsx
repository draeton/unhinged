import React from 'react';
import type { CompletedWorkout } from '../types/workout';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarWidgetProps {
  completedWorkouts: CompletedWorkout[];
  onClick: (dateStr?: string) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  completedWorkouts,
  onClick,
}) => {
  // Get current week (Monday - Sunday)
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday, 1 is Monday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(today.setDate(diff));
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const getLocalDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const workoutDates = new Set(
    completedWorkouts.map(w => {
      // Assuming w.date is ISO string, we extract the YYYY-MM-DD part based on local date
      const d = new Date(w.date);
      return getLocalDateString(d);
    })
  );

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div 
      className="glass-panel"
      onClick={() => onClick()}
      style={{
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} color="#00F0FF" />
          Weekly Consistency
        </h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {weekDays.map((date, index) => {
          const dateStr = getLocalDateString(date);
          const hasWorkout = workoutDates.has(dateStr);
          const isToday = getLocalDateString(new Date()) === dateStr;

          return (
            <div 
              key={index} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: hasWorkout ? 'pointer' : 'inherit' }}
              onClick={hasWorkout ? (e) => {
                e.stopPropagation();
                onClick(dateStr);
              } : undefined}
            >
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                {dayNames[index]}
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: hasWorkout || isToday ? '700' : '500',
                background: hasWorkout ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                color: hasWorkout ? '#00F0FF' : (isToday ? '#fff' : 'rgba(255,255,255,0.7)'),
                border: hasWorkout ? '1px solid rgba(0, 240, 255, 0.3)' : (isToday ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'),
                boxShadow: hasWorkout ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none'
              }}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
