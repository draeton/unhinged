import type { Program, ResolvedBlock, ResolvedProgram } from '../types/program';

// A minimal ResolvedBlock[]/ResolvedProgram fixture for component tests. Mirrors the
// exercise ids/names/timer configs the app originally shipped with (11 exercises across
// 4 blocks) so existing test assertions (specific names, specific work/rest seconds,
// specific carousel index positions) keep passing -- content fields not exercised by any
// test (description, form cues, safety tip, video links) are left as empty placeholders
// rather than duplicated verbatim from the old static data.
const exercise = (
  id: string,
  name: string,
  workSeconds: number | null,
  restSeconds: number | null,
  sets: number
) => ({
  id,
  blockExerciseId: `be-${id}`,
  name,
  workSeconds,
  restSeconds,
  sets,
  repsOrTime: '',
  targetMuscles: [],
  equipment: '',
  description: '',
  formCues: [],
  safetyTip: '',
  videoUrls: [],
});

export const RESOLVED_TEST_BLOCKS: ResolvedBlock[] = [
  {
    id: 'block-1',
    title: '1. WARM-UP',
    subtitle: '',
    durationMinutes: 10,
    blockType: 'warmup',
    badgeColor: '#00F0FF',
    exercises: [
      exercise('w1', 'Wrist Mobility Sequence', null, 60, 1),
      exercise('w2', 'Scapular & Lat Prep', null, 60, 2),
      exercise('w3', "World's Greatest Stretch", null, 60, 1),
    ],
  },
  {
    id: 'block-2',
    title: '2. STRENGTH',
    subtitle: '',
    durationMinutes: 20,
    blockType: 'strength',
    badgeColor: '#00F0FF',
    exercises: [
      exercise('s1', 'Pull-Up & Asymmetry Focus', null, 90, 5),
      exercise('s2', 'Handstand Prep & Balance', null, 90, 4),
    ],
  },
  {
    id: 'block-3',
    title: '3. MOBILITY',
    subtitle: '',
    durationMinutes: 25,
    blockType: 'mobility',
    badgeColor: '#00F0FF',
    exercises: [
      exercise('m1', 'Pike Pulses / Active Compression', 90, 60, 1),
      exercise('m2', 'PNF Hamstring Stretch', 120, 60, 3),
      exercise('m3', 'Modified Jefferson Curls', null, 60, 3),
      exercise('m4', 'Deep Psoas & Hip Opening (Couch Stretch)', 120, 60, 1),
      exercise('m5', 'Passive Forward Fold', 120, 60, 1),
    ],
  },
  {
    id: 'block-4',
    title: '4. COOLDOWN',
    subtitle: '',
    durationMinutes: 5,
    blockType: 'cooldown',
    badgeColor: '#00F0FF',
    exercises: [
      exercise('c1', 'Child’s Pose with Wrist Relief', 300, null, 1),
    ],
  },
];

export const RESOLVED_TEST_PROGRAM: ResolvedProgram = {
  id: 'test-program',
  name: 'Test Program',
  blocks: RESOLVED_TEST_BLOCKS,
};

// The Program-list-row counterpart to RESOLVED_TEST_PROGRAM -- same id/name, since
// App.tsx's home-screen program picker (listPrograms) and its active-program fetch
// (useActiveProgram) are two independent reads that must agree on which program is
// "the" one for component tests to click through a realistic flow.
export const TEST_PROGRAM: Program = {
  id: 'test-program',
  userId: 'test-user',
  name: 'Test Program',
  description: '',
  createdAt: '',
  updatedAt: '',
};
