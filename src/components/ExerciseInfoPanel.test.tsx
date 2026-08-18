import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseInfoPanel } from './ExerciseInfoPanel';
import type { ResolvedExercise } from '../types/program';

const baseExercise: ResolvedExercise = {
  id: 'generated-uuid-1', // stands in for a real post-seed Supabase UUID
  blockExerciseId: 'be-1',
  name: 'Some Other Exercise',
  workSeconds: null,
  restSeconds: 60,
  sets: 3,
  repsOrTime: '10 Reps',
  targetMuscles: [],
  equipment: '',
  description: '',
  formCues: [],
  safetyTip: '',
  videoUrls: [],
};

describe('ExerciseInfoPanel special-case tips', () => {
  it('matches the left-scapula badge by name, not id', () => {
    render(
      <ExerciseInfoPanel
        exercise={{ ...baseExercise, name: 'Pull-Up & Asymmetry Focus' }}
        onPlayVideo={vi.fn()}
      />
    );
    expect(screen.getByText('LEFT SCAPULAR ASYMMETRY FOCUS')).toBeInTheDocument();
  });

  it('shows the handstand wrist-safety tip for Handstand Prep & Balance (fixed content mismatch)', () => {
    render(
      <ExerciseInfoPanel
        exercise={{ ...baseExercise, name: 'Handstand Prep & Balance' }}
        onPlayVideo={vi.fn()}
      />
    );
    expect(screen.getByText('PRO WRIST SAFETY TIP')).toBeInTheDocument();
  });

  it('no longer shows the handstand tip for PNF Hamstring Stretch (previously mismatched)', () => {
    render(
      <ExerciseInfoPanel
        exercise={{ ...baseExercise, name: 'PNF Hamstring Stretch' }}
        onPlayVideo={vi.fn()}
      />
    );
    expect(screen.queryByText('PRO WRIST SAFETY TIP')).not.toBeInTheDocument();
  });

  it('matches the Jefferson Curl spinal-articulation tip by name', () => {
    render(
      <ExerciseInfoPanel
        exercise={{ ...baseExercise, name: 'Modified Jefferson Curls' }}
        onPlayVideo={vi.fn()}
      />
    );
    expect(screen.getByText('SPINAL ARTICULATION RULE')).toBeInTheDocument();
  });

  it('shows no special-case tip for an unrelated exercise', () => {
    render(<ExerciseInfoPanel exercise={baseExercise} onPlayVideo={vi.fn()} />);
    expect(screen.queryByText('LEFT SCAPULAR ASYMMETRY FOCUS')).not.toBeInTheDocument();
    expect(screen.queryByText('PRO WRIST SAFETY TIP')).not.toBeInTheDocument();
    expect(screen.queryByText('SPINAL ARTICULATION RULE')).not.toBeInTheDocument();
  });
});
