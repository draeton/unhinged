-- Template program used to bootstrap every new user's account with the app's original
-- 60-min program, matching pre-multi-program behavior. These tables are NOT user-scoped
-- (no user_id, no RLS) -- they're static, read-only reference data cloned into a user's
-- own owned rows via the RPCs below. See src/services/programBootstrap.ts.

create table public.template_exercises (
  id uuid primary key,
  name text not null,
  work_seconds integer,
  rest_seconds integer,
  sets integer not null default 1,
  reps_or_time text not null default '',
  target_muscles text[] not null default '{}',
  equipment text not null default '',
  description text not null default '',
  form_cues text[] not null default '{}',
  safety_tip text not null default '',
  video_urls jsonb not null default '[]'
);

create table public.template_program_blocks (
  id uuid primary key,
  title text not null,
  subtitle text not null default '',
  block_type public.block_type not null,
  badge_color text not null default '#00F0FF',
  duration_minutes integer not null default 0,
  position integer not null
);

create table public.template_block_exercises (
  block_id uuid not null references public.template_program_blocks(id) on delete cascade,
  exercise_id uuid not null references public.template_exercises(id) on delete cascade,
  position integer not null,
  primary key (block_id, exercise_id)
);

-- Static reference data, no RLS -- but new tables still need an explicit grant for
-- non-owner roles to read them.
grant select on public.template_exercises, public.template_program_blocks, public.template_block_exercises
  to authenticated;

insert into public.template_exercises
  (id, name, work_seconds, rest_seconds, sets, reps_or_time, target_muscles, equipment, description, form_cues, safety_tip, video_urls)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Wrist Mobility Sequence',
    null, 60, 1, '3–4 Minutes',
    ARRAY['wrist_flexors', 'wrist_extensors'],
    'Mat',
    'Comprehensive wrist prep: 10 circles each way, tabletop rocking (forward/back, side-to-side, fingers pointing backward), and finger lifts / wrist push-ups (peel palms, keep fingertips down).',
    ARRAY[
      'Wrist Circles: 10 circles clockwise and counter-clockwise',
      'Tabletop Rocking: Gently shift weight forward/back, side-to-side, and with fingers pointing toward knees',
      'Finger Lifts: Peel palms off floor while pressing finger pads firmly into ground'
    ],
    'Move smoothly; never force joints into painful pinch points.',
    '[{"title": "Wrist Circles Tutorial", "url": "https://www.youtube.com/watch?v=KaGNy2GMecg"}, {"title": "Tabletop Rocking Tutorial", "url": "https://www.youtube.com/watch?v=kfUIezq2LUM"}, {"title": "Finger Lifts Tutorial", "url": "https://youtube.com/shorts/Yhn7iRdF_AY?si=SgaqXenr_Li8dFK1"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Scapular & Lat Prep',
    null, 60, 2, '2 x 10 Reps Each',
    ARRAY['scapula', 'lats'],
    'Wall / Mat',
    'Quadruped scapular push-ups (2 x 10) to isolate shoulder blade movement, followed by Wall Slides with serratus reach at the top (2 x 10).',
    ARRAY[
      'Scap Push-Ups: Keep arms straight, squeeze shoulder blades together, then push floor away',
      'Wall Slides: Keep forearms flat against wall, slide upward and reach serratus at the top',
      'Focus on smooth glides without shrugging trap muscles into ears'
    ],
    'Maintain tight core; avoid arching lower back during wall slides.',
    '[{"title": "Scapular Push-Ups Tutorial", "url": "https://youtube.com/shorts/GDegoA-p5zQ?si=f9Ix15EsizVb4HsQ"}, {"title": "Wall Slides Tutorial", "url": "https://youtube.com/shorts/4spEFNdBEBI?si=HUEUcM9sB66O07bo"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'World''s Greatest Stretch',
    null, 60, 1, '5 Reps / Side',
    ARRAY['hamstrings', 'glutes', 'lower_back'],
    'Mat',
    'Step into a deep lunge, place elbow inside front ankle, rotate torso up to the sky, then shift back into a hamstring knee extension.',
    ARRAY[
      'Inhale to reach arm up, opening chest towards lead knee',
      'Exhale and rock back onto rear heel to extend front hamstring',
      'Keep rear glute engaged to open hip flexors'
    ],
    'Ease into the hamstring extension stretch smoothly.',
    '[{"title": "World''s Greatest Stretch Tutorial", "url": "https://youtube.com/shorts/ftLV1SkpWAA?si=OYtdL-RkcQsfq4R_"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Pull-Up & Asymmetry Focus',
    null, 90, 5, '3 Scap Pulls + 3–6 Strict Pull-Ups (4–5 sets)',
    ARRAY['lats', 'scapula', 'biceps', 'grip'],
    'Pull-Up Bar',
    'Start each set with 3 slow scapular pull-ups (hyper-focusing on wrapping the left shoulder blade down and back). Follow immediately with 3–6 strict pull-ups.',
    ARRAY[
      '3 Scapular Pulls: Pause 2s at top hold, wrapping left scapula firmly down into back pocket',
      '3–6 Strict Pull-Ups: Full chin-over-bar elevation with zero kipping',
      'Maintain hollow body tension through core and glutes'
    ],
    'If left shoulder blade fatigues or loses engagement, end set cleanly.',
    '[]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Handstand Prep & Balance',
    null, 90, 4, '10 Minutes Practice (Hold / Kick-ups)',
    ARRAY['scapula', 'wrist_flexors', 'wrist_extensors', 'grip'],
    'Wall / Parallettes or Blocks',
    'Chest-to-wall handstands or kick-up practice. Work on finger steering, hollow alignment, and overhead shoulder elevation.',
    ARRAY[
      'Walk feet up wall, hands 6-12 inches from wall',
      'Press floor away aggressively, elevating shoulders to ears',
      'Grip floor/blocks with clawed fingers to micro-adjust balance',
      'Pro-tip: Use parallettes/blocks if wrists feel limited'
    ],
    'Bail out sideways safely (cartwheel bail) if losing balance.',
    '[]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Pike Pulses / Active Compression',
    90, 60, 1, '5s Hold x 10 Reps',
    ARRAY['hamstrings', 'glutes'],
    'Mat',
    'Sit tall in pike position with legs straight and toes flexed towards shins. Place hands by knees/shins and lift heels 1 inch off the floor.',
    ARRAY[
      'Maintain tall spine without slumping backwards',
      'Squeeze quads hard to lock knees straight',
      'Hold heels elevated for 5 slow seconds per pulse'
    ],
    'Quads and hip flexors will burn heavily — breathe through the cramp zone!',
    '[{"title": "Pike Pulse Tutorial", "url": "https://youtube.com/shorts/xcwDWcCol2A?si=Rgxg0nu5vIAWEXw7"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'PNF Hamstring Stretch',
    120, 60, 3, '3 Cycles / Leg',
    ARRAY['hamstrings'],
    'Strap / Resistance Band',
    'Lying on back, loop strap around foot and pull leg into passive stretch. Push heel firmly into band for 5s (isometric contraction), then relax and pull leg closer for 15s.',
    ARRAY[
      'Phase 1: 15s passive stretch',
      'Phase 2: 5s isometric drive (push heel into strap against hands at 50-70% force)',
      'Phase 3: Deep exhale, relax muscle, and gently deepen stretch'
    ],
    'Never force sharp pain at the hamstring origin (sit-bone tie-in).',
    '[{"title": "PNF Hamstring Stretch Tutorial", "url": "https://youtu.be/5Wi5d2T7JK0?si=uenJM0zmw37rlUqA"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'Modified Jefferson Curls',
    null, 60, 3, '3 Sets x 5 Slow Reps',
    ARRAY['hamstrings', 'lower_back'],
    'Low Box + Light Weight (5–10 lbs)',
    'Stand on a low box holding light weight (5–10 lbs). Tuck chin to chest and slowly roll down spine one single vertebra at a time into deep fold.',
    ARRAY[
      'Chin to chest -> upper back rounded -> mid back -> lower back roll',
      'Keep weight close to legs during slow 5-second roll down',
      'Unroll in exact reverse order, stacking spine from bottom to top'
    ],
    'Use ultra-light weight (5-10 lbs max). Focus on segmenting each vertebra.',
    '[{"title": "Jefferson Curls Tutorial", "url": "https://youtube.com/shorts/xiDAPjwkTFw?si=CwbeqCKl-1_qvITO"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000009',
    'Deep Psoas & Hip Opening (Couch Stretch)',
    120, 60, 1, '2 Minutes / Leg',
    ARRAY['glutes', 'hamstrings'],
    'Wall / Couch / Mat',
    'Back shin flat against wall/couch in kneeling lunge. Drive hips forward and squeeze rear glute to open deep psoas and hip flexor fascia.',
    ARRAY[
      'Rear shin flush against wall with toes pointing up',
      'Tuck pelvis under (posterior pelvic tilt) to lock in psoas stretch',
      'Breathe slow and deep into lower abdomen'
    ],
    'Place pad under back knee if sensitive on floor.',
    '[{"title": "Couch Stretch Tutorial", "url": "https://youtube.com/shorts/s81vNuwucZk?si=JE7UCejAtSORK8Ap"}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000000a',
    'Passive Forward Fold',
    120, 60, 1, '2 Full Minutes Hold',
    ARRAY['hamstrings', 'lower_back'],
    'Mat',
    'Stand with feet hip-width, bend knees generously, let arms hang limp, and let gravity pull head and crown toward floor for 2 full minutes.',
    ARRAY[
      'Bend knees as much as needed to let belly rest on thighs',
      'Nod head yes/no to fully release neck & cervical spine',
      'Deep belly breathing — inhale expansion, exhale sink'
    ],
    'Rise up slowly after hold to avoid dizziness.',
    '[]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000000b',
    'Child’s Pose with Wrist Relief',
    300, null, 1, '5 Minutes Hold',
    ARRAY['wrist_flexors', 'wrist_extensors', 'lower_back'],
    'Mat',
    'Sit back on heels in Child’s Pose. Place backs of hands flat on floor (palms facing up) with light pressure to counter-stretch wrists while taking deep belly breaths.',
    ARRAY[
      'Hips back onto heels, forehead resting on mat',
      'Backs of hands flat on floor with fingers pointing towards knees',
      'Deep 4-second inhale, 6-second exhale parasympathetic breathing'
    ],
    'Rest softly into palms; zero strain needed.',
    '[]'::jsonb
  );

insert into public.template_program_blocks
  (id, title, subtitle, block_type, badge_color, duration_minutes, position)
values
  ('00000000-0000-0000-0000-000000000101', '1. WARM-UP (0–10 min)', 'Prepare wrist joint capsules, activate scapular stabilizers, and open hips.', 'warmup', '#00F0FF', 10, 0),
  ('00000000-0000-0000-0000-000000000102', '2. STRENGTH (10–30 min)', 'Strict pulling asymmetry correction and handstand balance overhead loading.', 'strength', '#00F0FF', 20, 1),
  ('00000000-0000-0000-0000-000000000103', '3. MOBILITY (30–55 min)', 'Active hip compression, PNF hamstring lengthening, spinal articulation, and psoas release.', 'mobility', '#00F0FF', 25, 2),
  ('00000000-0000-0000-0000-000000000104', '4. COOLDOWN (5 min)', 'Nervous system down-regulation & wrist counter-flexion.', 'cooldown', '#00F0FF', 5, 3);

insert into public.template_block_exercises (block_id, exercise_id, position)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 0),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 1),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 2),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000004', 0),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000005', 1),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000006', 0),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000007', 1),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000008', 2),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000009', 3),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-00000000000a', 4),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-00000000000b', 0);

-- Clone the template program into a brand-new user's own account (called once, when a
-- user has zero programs -- see src/services/programBootstrap.ts). SECURITY DEFINER so it
-- can insert rows on the caller's behalf across four tables atomically; the auth.uid()
-- check below is required precisely because SECURITY DEFINER bypasses RLS, so without it
-- any authenticated caller could pass an arbitrary p_user_id and write into someone else's
-- account.
create or replace function public.clone_template_program(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  create temporary table if not exists _exercise_id_map (old_id uuid primary key, new_id uuid not null) on commit drop;
  create temporary table if not exists _block_id_map (old_id uuid primary key, new_id uuid not null) on commit drop;

  insert into _exercise_id_map (old_id, new_id)
  select id, gen_random_uuid() from public.template_exercises;

  insert into public.exercises (id, user_id, name, work_seconds, rest_seconds, sets, reps_or_time, target_muscles, equipment, description, form_cues, safety_tip, video_urls)
  select m.new_id, p_user_id, te.name, te.work_seconds, te.rest_seconds, te.sets, te.reps_or_time, te.target_muscles, te.equipment, te.description, te.form_cues, te.safety_tip, te.video_urls
  from public.template_exercises te
  join _exercise_id_map m on m.old_id = te.id;

  insert into public.programs (id, user_id, name, description)
  values (
    gen_random_uuid(),
    p_user_id,
    '60-Min: Pull-Ups, Hamstrings & Wrists Blueprint',
    'A scientifically balanced routine pairing heavy upper vertical pulling and left scapular symmetry with deep hamstring compression, Jefferson curling, and wrist relief.'
  )
  returning id into v_program_id;

  insert into _block_id_map (old_id, new_id)
  select id, gen_random_uuid() from public.template_program_blocks;

  insert into public.program_blocks (id, user_id, program_id, title, subtitle, block_type, badge_color, duration_minutes, position)
  select bm.new_id, p_user_id, v_program_id, tb.title, tb.subtitle, tb.block_type, tb.badge_color, tb.duration_minutes, tb.position
  from public.template_program_blocks tb
  join _block_id_map bm on bm.old_id = tb.id;

  insert into public.program_block_exercises (user_id, block_id, exercise_id, position)
  select p_user_id, bm.new_id, em.new_id, tbe.position
  from public.template_block_exercises tbe
  join _block_id_map bm on bm.old_id = tbe.block_id
  join _exercise_id_map em on em.old_id = tbe.exercise_id;

  drop table _exercise_id_map;
  drop table _block_id_map;

  return v_program_id;
end;
$$;

revoke all on function public.clone_template_program(uuid) from public;
grant execute on function public.clone_template_program(uuid) to authenticated;

-- Duplicate an existing (caller-owned) program into a new program, still owned by the
-- caller. Unlike clone_template_program, this REUSES the source's exercise_id references
-- rather than cloning exercise rows -- duplicating a program is meant to share the
-- library, not fork it. Same auth.uid() guard rationale as above, plus an ownership check
-- on the source program (SECURITY DEFINER also bypasses SELECT RLS, so without this check
-- any authenticated caller could duplicate another user's private program).
create or replace function public.clone_program(p_source_program_id uuid, p_user_id uuid, p_new_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1 from public.programs where id = p_source_program_id and user_id = auth.uid()
  ) then
    raise exception 'source program not found or not owned by caller';
  end if;

  create temporary table if not exists _block_id_map (old_id uuid primary key, new_id uuid not null) on commit drop;

  insert into public.programs (id, user_id, name, description)
  select gen_random_uuid(), p_user_id, p_new_name, description
  from public.programs
  where id = p_source_program_id
  returning id into v_program_id;

  insert into _block_id_map (old_id, new_id)
  select id, gen_random_uuid() from public.program_blocks where program_id = p_source_program_id;

  insert into public.program_blocks (id, user_id, program_id, title, subtitle, block_type, badge_color, duration_minutes, position)
  select bm.new_id, p_user_id, v_program_id, pb.title, pb.subtitle, pb.block_type, pb.badge_color, pb.duration_minutes, pb.position
  from public.program_blocks pb
  join _block_id_map bm on bm.old_id = pb.id
  where pb.program_id = p_source_program_id;

  insert into public.program_block_exercises (user_id, block_id, exercise_id, position, sets_override, work_seconds_override, rest_seconds_override, reps_or_time_override)
  select p_user_id, bm.new_id, pbe.exercise_id, pbe.position, pbe.sets_override, pbe.work_seconds_override, pbe.rest_seconds_override, pbe.reps_or_time_override
  from public.program_block_exercises pbe
  join _block_id_map bm on bm.old_id = pbe.block_id;

  drop table _block_id_map;

  return v_program_id;
end;
$$;

revoke all on function public.clone_program(uuid, uuid, text) from public;
grant execute on function public.clone_program(uuid, uuid, text) to authenticated;
