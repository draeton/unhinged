import React, { useMemo } from 'react';
import type { CompletedWorkout } from '../types/workout';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarDrawerProps {
  completedWorkouts: CompletedWorkout[];
  onDayClick: (dateStr: string) => void;
}

export const CalendarDrawer: React.FC<CalendarDrawerProps> = ({
  completedWorkouts,
  onDayClick,
}) => {
  const getLocalDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const workoutsByMonth = useMemo(() => {
    const groups: Record<string, CompletedWorkout[]> = {};
    completedWorkouts.forEach(w => {
      const d = new Date(w.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(w);
    });

    // Also ensure current month is in there even if empty
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[currentMonthKey]) {
      groups[currentMonthKey] = [];
    }

    return groups;
  }, [completedWorkouts]);

  const sortedMonths = useMemo(() => {
    return Object.keys(workoutsByMonth).sort((a, b) => b.localeCompare(a));
  }, [workoutsByMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarIcon size={20} color="#00F0FF" />
        Workout Calendar
      </h2>

      {sortedMonths.map(monthKey => {
        const workouts = workoutsByMonth[monthKey];
        const [yearStr, monthStr] = monthKey.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // 0-indexed

        const totalWorkouts = workouts.length;
        const totalSets = workouts.reduce((sum, w) => sum + w.totalSetsCompleted, 0);
        const totalMinutes = workouts.reduce((sum, w) => sum + w.durationMinutes, 0);
        
        const avgSets = totalWorkouts > 0 ? Math.round(totalSets / totalWorkouts) : 0;
        const avgMins = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust so Monday is 0

        const workoutDates = new Set(
          workouts.map(w => getLocalDateString(new Date(w.date)))
        );

        return (
          <div key={monthKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{monthNames[month]} {year}</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                <span>Workouts: <strong style={{ color: '#fff' }}>{totalWorkouts}</strong></span>
                <span>Avg Sets: <strong style={{ color: '#fff' }}>{avgSets}</strong></span>
                <span>Avg Mins: <strong style={{ color: '#fff' }}>{avgMins}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={`header-${i}`} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: '4px' }}>
                  {d}
                </div>
              ))}
              
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const dateStr = getLocalDateString(d);
                const hasWorkout = workoutDates.has(dateStr);
                const isToday = getLocalDateString(new Date()) === dateStr;

                return (
                  <div 
                    key={day}
                    onClick={() => {
                      if (hasWorkout) {
                        onDayClick(dateStr);
                      }
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: hasWorkout || isToday ? '700' : '500',
                      background: hasWorkout ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                      color: hasWorkout ? '#00F0FF' : (isToday ? '#fff' : 'rgba(255,255,255,0.7)'),
                      border: hasWorkout ? '1px solid rgba(0, 240, 255, 0.3)' : (isToday ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'),
                      boxShadow: hasWorkout ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none',
                      cursor: hasWorkout ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
