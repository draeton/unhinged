import type { WorkoutBlock } from '../types/workout';

export const DEFAULT_WORKOUT_BLOCKS: WorkoutBlock[] = [
  {
    id: 'block-1',
    title: '1. WARM-UP (0–10 min)',
    subtitle: 'Prepare wrist joint capsules, activate scapular stabilizers, and open hips.',
    durationMinutes: 10,
    category: 'warmup',
    badgeColor: '#00F0FF',
    exercises: [
      {
        id: 'w1',
        name: 'Wrist Mobility Sequence',
        category: 'warmup',
        durationSeconds: 210, // ~3.5 min
        restSeconds: 20,
        sets: 1,
        repsOrTime: '3–4 Minutes',
        targetMuscles: ['wrist_flexors', 'wrist_extensors'],
        equipment: 'Mat',
        description: 'Comprehensive wrist prep: 10 circles each way, tabletop rocking (forward/back, side-to-side, fingers pointing backward), and finger lifts / wrist push-ups (peel palms, keep fingertips down).',
        formCues: [
          'Wrist Circles: 10 circles clockwise and counter-clockwise',
          'Tabletop Rocking: Gently shift weight forward/back, side-to-side, and with fingers pointing toward knees',
          'Finger Lifts: Peel palms off floor while pressing finger pads firmly into ground'
        ],
        videoUrls: [
          { title: 'Wrist Circles Tutorial', url: 'https://www.youtube.com/watch?v=KaGNy2GMecg' },
          { title: 'Tabletop Rocking Tutorial', url: 'https://www.youtube.com/watch?v=kfUIezq2LUM' },
          { title: 'Finger Lifts Tutorial', url: 'https://youtube.com/shorts/Yhn7iRdF_AY?si=SgaqXenr_Li8dFK1' }
        ],
        safetyTip: 'Move smoothly; never force joints into painful pinch points.'
      },
      {
        id: 'w2',
        name: 'Scapular & Lat Prep',
        category: 'warmup',
        durationSeconds: 180, // 3 min
        restSeconds: 20,
        sets: 2,
        repsOrTime: '2 x 10 Reps Each',
        targetMuscles: ['scapula', 'lats'],
        equipment: 'Wall / Mat',
        description: 'Quadruped scapular push-ups (2 x 10) to isolate shoulder blade movement, followed by Wall Slides with serratus reach at the top (2 x 10).',
        formCues: [
          'Scap Push-Ups: Keep arms straight, squeeze shoulder blades together, then push floor away',
          'Wall Slides: Keep forearms flat against wall, slide upward and reach serratus at the top',
          'Focus on smooth glides without shrugging trap muscles into ears'
        ],
        videoUrls: [
          { title: 'Scapular Push-Ups Tutorial', url: 'https://youtube.com/shorts/GDegoA-p5zQ?si=f9Ix15EsizVb4HsQ' },
          { title: 'Wall Slides Tutorial', url: 'https://youtube.com/shorts/4spEFNdBEBI?si=HUEUcM9sB66O07bo' }
        ],
        safetyTip: 'Maintain tight core; avoid arching lower back during wall slides.'
      },
      {
        id: 'w3',
        name: "World's Greatest Stretch",
        category: 'warmup',
        durationSeconds: 180, // 3 min
        restSeconds: 30,
        sets: 1,
        repsOrTime: '5 Reps / Side',
        targetMuscles: ['hamstrings', 'glutes', 'lower_back'],
        equipment: 'Mat',
        description: 'Step into a deep lunge, place elbow inside front ankle, rotate torso up to the sky, then shift back into a hamstring knee extension.',
        formCues: [
          'Inhale to reach arm up, opening chest towards lead knee',
          'Exhale and rock back onto rear heel to extend front hamstring',
          'Keep rear glute engaged to open hip flexors'
        ],
        videoUrls: [
          { title: "World's Greatest Stretch Tutorial", url: 'https://youtube.com/shorts/ftLV1SkpWAA?si=OYtdL-RkcQsfq4R_' }
        ],
        safetyTip: 'Ease into the hamstring extension stretch smoothly.'
      }
    ]
  },
  {
    id: 'block-2',
    title: '2. STRENGTH BLOCK (10–30 min)',
    subtitle: 'Strict pulling asymmetry correction and handstand balance overhead loading.',
    durationMinutes: 20,
    category: 'pullups',
    badgeColor: '#00FF9D',
    exercises: [
      {
        id: 's1',
        name: 'Pull-Up & Asymmetry Focus',
        category: 'pullups',
        durationSeconds: 60,
        restSeconds: 90,
        sets: 5,
        repsOrTime: '3 Scap Pulls + 3–6 Strict Pull-Ups (4–5 sets)',
        targetMuscles: ['lats', 'scapula', 'biceps', 'grip'],
        equipment: 'Pull-Up Bar',
        description: 'Start each set with 3 slow scapular pull-ups (hyper-focusing on wrapping the left shoulder blade down and back). Follow immediately with 3–6 strict pull-ups.',
        formCues: [
          '3 Scapular Pulls: Pause 2s at top hold, wrapping left scapula firmly down into back pocket',
          '3–6 Strict Pull-Ups: Full chin-over-bar elevation with zero kipping',
          'Maintain hollow body tension through core and glutes'
        ],
        safetyTip: 'If left shoulder blade fatigues or loses engagement, end set cleanly.'
      },
      {
        id: 's2',
        name: 'Handstand Prep & Balance',
        category: 'pullups',
        durationSeconds: 60,
        restSeconds: 90,
        sets: 4,
        repsOrTime: '10 Minutes Practice (Hold / Kick-ups)',
        targetMuscles: ['scapula', 'wrist_flexors', 'wrist_extensors', 'grip'],
        equipment: 'Wall / Parallettes or Blocks',
        description: 'Chest-to-wall handstands or kick-up practice. Work on finger steering, hollow alignment, and overhead shoulder elevation.',
        formCues: [
          'Walk feet up wall, hands 6-12 inches from wall',
          'Press floor away aggressively, elevating shoulders to ears',
          'Grip floor/blocks with clawed fingers to micro-adjust balance',
          'Pro-tip: Use parallettes/blocks if wrists feel limited'
        ],
        safetyTip: 'Bail out sideways safely (cartwheel bail) if losing balance.'
      }
    ]
  },
  {
    id: 'block-3',
    title: '3. MOBILITY & FLEXIBILITY: FORWARD FOLD FOCUS (30–55 min)',
    subtitle: 'Active hip compression, PNF hamstring lengthening, spinal articulation, and psoas release.',
    durationMinutes: 25,
    category: 'hamstrings',
    badgeColor: '#FF007A',
    exercises: [
      {
        id: 'm1',
        name: 'Pike Pulses / Active Compression',
        category: 'hamstrings',
        durationSeconds: 180, // 3 min
        restSeconds: 45,
        sets: 1,
        repsOrTime: '5s Hold x 10 Reps',
        targetMuscles: ['hamstrings', 'glutes'],
        equipment: 'Mat',
        description: 'Sit tall in pike position with legs straight and toes flexed towards shins. Place hands by knees/shins and lift heels 1 inch off the floor.',
        formCues: [
          'Maintain tall spine without slumping backwards',
          'Squeeze quads hard to lock knees straight',
          'Hold heels elevated for 5 slow seconds per pulse'
        ],
        videoUrls: [
          { title: 'Pike Pulse Tutorial', url: 'https://youtube.com/shorts/xcwDWcCol2A?si=Rgxg0nu5vIAWEXw7' }
        ],
        safetyTip: 'Quads and hip flexors will burn heavily — breathe through the cramp zone!'
      },
      {
        id: 'm2',
        name: 'PNF Hamstring Stretch',
        category: 'hamstrings',
        durationSeconds: 360, // 6 min
        restSeconds: 30,
        sets: 3,
        repsOrTime: '3 Cycles / Leg',
        targetMuscles: ['hamstrings'],
        equipment: 'Strap / Resistance Band',
        description: 'Lying on back, loop strap around foot and pull leg into passive stretch. Push heel firmly into band for 5s (isometric contraction), then relax and pull leg closer for 15s.',
        formCues: [
          'Phase 1: 15s passive stretch',
          'Phase 2: 5s isometric drive (push heel into strap against hands at 50-70% force)',
          'Phase 3: Deep exhale, relax muscle, and gently deepen stretch'
        ],
        videoUrls: [
          { title: 'PNF Hamstring Stretch Tutorial', url: 'https://youtu.be/5Wi5d2T7JK0?si=uenJM0zmw37rlUqA' }
        ],
        safetyTip: 'Never force sharp pain at the hamstring origin (sit-bone tie-in).'
      },
      {
        id: 'm3',
        name: 'Modified Jefferson Curls',
        category: 'hamstrings',
        durationSeconds: 300, // 5 min
        restSeconds: 60,
        sets: 3,
        repsOrTime: '3 Sets x 5 Slow Reps',
        targetMuscles: ['hamstrings', 'lower_back'],
        equipment: 'Low Box + Light Weight (5–10 lbs)',
        description: 'Stand on a low box holding light weight (5–10 lbs). Tuck chin to chest and slowly roll down spine one single vertebra at a time into deep fold.',
        formCues: [
          'Chin to chest -> upper back rounded -> mid back -> lower back roll',
          'Keep weight close to legs during slow 5-second roll down',
          'Unroll in exact reverse order, stacking spine from bottom to top'
        ],
        videoUrls: [
          { title: 'Jefferson Curls Tutorial', url: 'https://youtube.com/shorts/xiDAPjwkTFw?si=CwbeqCKl-1_qvITO' }
        ],
        safetyTip: 'Use ultra-light weight (5-10 lbs max). Focus on segmenting each vertebra.'
      },
      {
        id: 'm4',
        name: 'Deep Psoas & Hip Opening (Couch Stretch)',
        category: 'hamstrings',
        durationSeconds: 360, // 6 min
        restSeconds: 30,
        sets: 1,
        repsOrTime: '2 Minutes / Leg',
        targetMuscles: ['glutes', 'hamstrings'],
        equipment: 'Wall / Couch / Mat',
        description: 'Back shin flat against wall/couch in kneeling lunge. Drive hips forward and squeeze rear glute to open deep psoas and hip flexor fascia.',
        formCues: [
          'Rear shin flush against wall with toes pointing up',
          'Tuck pelvis under (posterior pelvic tilt) to lock in psoas stretch',
          'Breathe slow and deep into lower abdomen'
        ],
        videoUrls: [
          { title: 'Couch Stretch Tutorial', url: 'https://youtube.com/shorts/s81vNuwucZk?si=JE7UCejAtSORK8Ap' }
        ],
        safetyTip: 'Place pad under back knee if sensitive on floor.'
      },
      {
        id: 'm5',
        name: 'Passive Forward Fold',
        category: 'hamstrings',
        durationSeconds: 300, // 5 min
        restSeconds: 0,
        sets: 1,
        repsOrTime: '2 Full Minutes Hold',
        targetMuscles: ['hamstrings', 'lower_back'],
        equipment: 'Mat',
        description: 'Stand with feet hip-width, bend knees generously, let arms hang limp, and let gravity pull head and crown toward floor for 2 full minutes.',
        formCues: [
          'Bend knees as much as needed to let belly rest on thighs',
          'Nod head yes/no to fully release neck & cervical spine',
          'Deep belly breathing — inhale expansion, exhale sink'
        ],
        safetyTip: 'Rise up slowly after hold to avoid dizziness.'
      }
    ]
  },
  {
    id: 'block-4',
    title: '4. COOLDOWN (5 min)',
    subtitle: 'Nervous system down-regulation & wrist counter-flexion.',
    durationMinutes: 5,
    category: 'cooldown',
    badgeColor: '#FFD700',
    exercises: [
      {
        id: 'c1',
        name: 'Child’s Pose with Wrist Relief',
        category: 'cooldown',
        durationSeconds: 300, // 5 min
        restSeconds: 0,
        sets: 1,
        repsOrTime: '5 Minutes Hold',
        targetMuscles: ['wrist_flexors', 'wrist_extensors', 'lower_back'],
        equipment: 'Mat',
        description: 'Sit back on heels in Child’s Pose. Place backs of hands flat on floor (palms facing up) with light pressure to counter-stretch wrists while taking deep belly breaths.',
        formCues: [
          'Hips back onto heels, forehead resting on mat',
          'Backs of hands flat on floor with fingers pointing towards knees',
          'Deep 4-second inhale, 6-second exhale parasympathetic breathing'
        ],
        safetyTip: 'Rest softly into palms; zero strain needed.'
      }
    ]
  }
];
