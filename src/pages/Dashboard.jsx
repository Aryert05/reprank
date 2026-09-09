import { useContext, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import RankRing from '../components/RankRing.jsx';
import { UserContext } from '../context/UserContext.jsx';
import { useWorkout } from '../hooks/useWorkout.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFetch } from '../hooks/useFetch.js';
import { fetchDashboardExtras } from '../data/mockApi.js';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard() {
  // Custom Hook — sets document.title on load (wraps useEffect internally).
  useDocumentTitle('Dashboard — RepRank');

  // useContext() — read shared user data directly, no props passed down from App/Layout.
  // Matches the practical's pattern: const user = useContext(UserContext).
  const user = useContext(UserContext);

  // Experiment 3: read global workout state — same state visible in Navbar
  const { workoutState } = useWorkout();

  // useEffect() — perform an action once, when the component loads (empty dependency array).
  useEffect(() => {
    console.log('Dashboard loaded');
  }, []);

  // Custom Hook — useFetch wraps useEffect + useState to simulate an API call
  // for the dashboard's weekly progress, current challenge, recent workouts, and
  // leaderboard preview, giving us real loading/data states to render.
  const { data, loading } = useFetch(fetchDashboardExtras, []);

  const pct = Math.round((user.xp / user.xpToNext) * 100);

  return (
    <Layout nav="app" active="dashboard">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ===== Welcome + rank summary (from useContext) ===== */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="stat-label">Welcome back</p>
            <h1 className="mt-1 text-3xl font-semibold text-mist-100">Welcome, {user.name} 👋</h1>
            <p className="text-sm text-mist-400">Role: {user.role}</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-ink-700 bg-ink-900 px-5 py-3">
            <RankRing level={user.level} pct={pct} size="h-16 w-16" labelSize="text-lg" />
            <div>
              <p className="text-sm font-semibold text-mist-100">Level {user.level}</p>
              <p className="font-mono text-xs text-mist-400">{user.xp} / {user.xpToNext} XP</p>
              <div className="progress-track mt-1.5 w-32">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Stat grid (from useContext) ===== */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card">
            <p className="stat-label">Current XP</p>
            <p className="stat-value mt-2 text-volt-400">{user.xp}</p>
            <p className="mt-1 text-xs text-mist-400">{user.xpToNext - user.xp} XP to Level {user.level + 1}</p>
          </div>
          <div className="card">
            <p className="stat-label">Level</p>
            <p className="stat-value mt-2">{user.level}</p>
            <p className="mt-1 text-xs text-mist-400">Top 18% of lifters</p>
          </div>
          <div className="card">
            <p className="stat-label">Workout Streak</p>
            <p className="stat-value mt-2">{user.streak}<span className="text-base font-normal text-mist-400"> days</span></p>
            <p className="mt-1 text-xs text-mist-400">Best streak: 21 days</p>
          </div>
          <div className="card">
            <p className="stat-label">Total Workouts</p>
            <p className="stat-value mt-2">{user.workouts}</p>
            <p className="mt-1 text-xs text-mist-400">Since March 2026</p>
          </div>
        </div>

        {/* ===== Workout Progress (Experiment 3: global state from WorkoutContext) ===== */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card">
            <p className="stat-label">Completed Sets</p>
            <p className="stat-value mt-2 text-volt-400">{workoutState.completedSets}</p>
            <p className="mt-1 text-xs text-mist-400">Across all sessions</p>
          </div>
          <div className="card">
            <p className="stat-label">Completed Workouts</p>
            <p className="stat-value mt-2 text-volt-400">{workoutState.completedWorkouts}</p>
            <p className="mt-1 text-xs text-mist-400">Total finished sessions</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* ===== Left column (from useFetch) ===== */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-mist-100">This Week's Workouts</h2>
                <span className="badge">{loading ? '...' : `${data.weeklyDone.filter(Boolean).length} / 5 goal`}</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {DAY_LABELS.map((day, i) => {
                  const done = !loading && data.weeklyDone[i];
                  return (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-lg text-sm ${
                          loading
                            ? 'animate-pulse border border-ink-600 bg-ink-800'
                            : done
                            ? 'bg-volt font-semibold text-ink-950'
                            : 'border border-dashed border-ink-600 text-mist-400'
                        }`}
                      >
                        {!loading && (done ? '✓' : '–')}
                      </div>
                      <span className="text-xs text-mist-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-mist-100">Recent Workouts</h2>
                <a href="/workout.html" className="text-sm font-medium text-volt hover:text-volt-400">View all</a>
              </div>
              <ul className="mt-4 divide-y divide-ink-700">
                {loading
                  ? [1, 2, 3].map((i) => (
                      <li key={i} className="flex items-center justify-between py-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-ink-700" />
                        <div className="h-5 w-14 animate-pulse rounded-full bg-ink-700" />
                      </li>
                    ))
                  : data.recentWorkouts.map((w) => (
                      <li key={w.name} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-mist-100">{w.name}</p>
                          <p className="text-xs text-mist-400">{w.when}</p>
                        </div>
                        <span className="badge badge-xp">+{w.xp} XP</span>
                      </li>
                    ))}
              </ul>
            </div>
          </div>

          {/* ===== Right column ===== */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-mist-100">Current Challenge</h2>
                <span className="badge badge-achievement">Active</span>
              </div>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-ink-700" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-ink-700" />
                </div>
              ) : (
                <>
                  <p className="mt-3 text-lg font-semibold text-mist-100">{data.currentChallenge.name}</p>
                  <p className="mt-1 text-sm text-mist-400">
                    {data.currentChallenge.current} / {data.currentChallenge.target} reps completed
                  </p>
                  <div className="progress-track mt-3">
                    <div className="progress-fill" style={{ width: `${data.currentChallenge.progress}%` }} />
                  </div>
                </>
              )}
              <a href="/challenges.html" className="btn-secondary mt-4 w-full !py-2.5 text-sm">View Challenge</a>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-mist-100">Leaderboard Preview</h2>
                <a href="/leaderboard.html" className="text-sm font-medium text-volt hover:text-volt-400">Full board</a>
              </div>
              <ul className="mt-4 space-y-3">
                {loading
                  ? [1, 2, 3].map((i) => <li key={i} className="h-5 animate-pulse rounded bg-ink-700" />)
                  : data.leaderboardPreview.map((p) => (
                      <li key={p.rank} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 font-mono text-sm ${p.rank === 1 ? 'text-volt-400' : 'text-mist-400'}`}>{p.rank}</span>
                          <span className="text-sm text-mist-100">{p.name}</span>
                        </div>
                        <span className="font-mono text-sm text-mist-400">{p.reps} reps</span>
                      </li>
                    ))}
              </ul>
            </div>

            <div className="card">
              <h2 className="font-semibold text-mist-100">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <a href="/workout.html" className="btn-primary !px-3 text-sm">Start Workout</a>
                <a href="/challenges.html" className="btn-secondary !px-3 text-sm">Join Challenge</a>
                <a href="/profile.html" className="btn-secondary !px-3 text-sm">View Profile</a>
                <a href="/leaderboard.html" className="btn-secondary !px-3 text-sm">Leaderboard</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
