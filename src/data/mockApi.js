// Experiment 2 still has no real backend — these functions just *simulate* what a
// fetch('/api/...') call will look like once later experiments add Express + MongoDB.
// Each one returns a Promise that resolves after a short delay, which is enough for
// useFetch (src/hooks/useFetch.js) to demonstrate real loading/data states.

function delay(value, ms = 600) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function fetchDashboardExtras() {
  return delay({
    weeklyDone: [true, true, false, true, true, false, false],
    currentChallenge: {
      name: '1000 Push-Up Challenge',
      current: 780,
      target: 1000,
      progress: 78,
    },
    recentWorkouts: [
      { name: 'Push Day — Upper Body', when: 'Today · 52 min', xp: 40 },
      { name: 'Leg Day — Squat Focus', when: 'Yesterday · 61 min', xp: 55 },
      { name: 'Pull Day — Back & Biceps', when: '2 days ago · 48 min', xp: 35 },
    ],
    leaderboardPreview: [
      { rank: 1, name: 'Rahul', reps: 1240 },
      { rank: 2, name: 'Aryan', reps: 1180 },
      { rank: 3, name: 'Aditya', reps: 1050 },
    ],
  });
}

export function fetchLeaderboard() {
  return delay([
    { rank: 1, name: 'Rahul', xp: 4200, workouts: 61, points: 980 },
    { rank: 2, name: 'Aryan', xp: 3950, workouts: 58, points: 910 },
    { rank: 3, name: 'Aditya', xp: 3700, workouts: 55, points: 875 },
    { rank: 4, name: 'Rohan', xp: 3450, workouts: 50, points: 820 },
    { rank: 5, name: 'Priya', xp: 3120, workouts: 47, points: 760 },
    { rank: 6, name: 'Kabir', xp: 2890, workouts: 44, points: 705 },
    { rank: 7, name: 'Meera', xp: 2650, workouts: 41, points: 640 },
    { rank: 8, name: 'Aditi Sharma', xp: 2480, workouts: 32, points: 590, you: true },
    { rank: 9, name: 'Vikram', xp: 2310, workouts: 30, points: 555 },
    { rank: 10, name: 'Simran', xp: 2105, workouts: 28, points: 510 },
  ]);
}

export function fetchChallenges() {
  return delay([
    {
      id: 'squat-30',
      name: '30-Day Squat Challenge',
      description: 'Build toward 100 bodyweight squats a day, one week at a time.',
      participants: 842,
      progress: 60,
      current: 18,
      target: 30,
      unit: 'days',
      rank: 27,
      joined: true,
    },
    {
      id: 'pushup-1000',
      name: '1000 Push-Up Challenge',
      description: 'Log push-ups across any workout until you hit four figures.',
      participants: 1204,
      progress: 78,
      current: 780,
      target: 1000,
      unit: 'reps',
      rank: 9,
      joined: true,
    },
    {
      id: 'streak-50',
      name: '50 Workout Streak',
      description: 'No off-season. Complete a workout 50 days running.',
      participants: 356,
      progress: 28,
      current: 14,
      target: 50,
      unit: 'days',
      rank: 61,
      joined: false,
    },
    {
      id: 'upper-body-week',
      name: 'Upper Body Week',
      description: 'A focused 7-day push toward chest, back, shoulders and arms.',
      participants: 519,
      progress: 0,
      current: 0,
      target: 7,
      unit: 'days',
      rank: null,
      joined: false,
    },
  ]);
}

export function fetchWorkoutPlan() {
  return delay([
    {
      id: 'bench-press',
      name: 'Bench Press',
      tag: 'Chest',
      sets: [
        { reps: 8, weight: '60 kg', done: false },
        { reps: 8, weight: '60 kg', done: false },
        { reps: 8, weight: '62.5 kg', done: true },
        { reps: 6, weight: '65 kg', done: false },
      ],
    },
    {
      id: 'overhead-press',
      name: 'Overhead Press',
      tag: 'Shoulders',
      sets: [
        { reps: 10, weight: '30 kg', done: false },
        { reps: 10, weight: '32 kg', done: false },
        { reps: 8, weight: '32 kg', done: false },
      ],
    },
    {
      id: 'triceps-pushdown',
      name: 'Triceps Pushdown',
      tag: 'Arms',
      sets: [
        { reps: 12, weight: '25 kg', done: false },
        { reps: 12, weight: '25 kg', done: false },
        { reps: 10, weight: '27.5 kg', done: false },
      ],
    },
  ]);
}

// Pool of exercises used when the user clicks "+ Add Exercise" on the Workout page.
export const EXTRA_EXERCISE_POOL = [
  { name: 'Incline Dumbbell Press', tag: 'Chest', sets: [{ reps: 10, weight: '18 kg' }, { reps: 10, weight: '18 kg' }, { reps: 8, weight: '20 kg' }] },
  { name: 'Lateral Raise', tag: 'Shoulders', sets: [{ reps: 15, weight: '8 kg' }, { reps: 15, weight: '8 kg' }, { reps: 12, weight: '10 kg' }] },
  { name: 'Cable Fly', tag: 'Chest', sets: [{ reps: 12, weight: '15 kg' }, { reps: 12, weight: '15 kg' }, { reps: 10, weight: '17.5 kg' }] },
];
