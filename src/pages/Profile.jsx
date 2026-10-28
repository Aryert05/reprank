import Layout from '../components/Layout.jsx';
import RankRing from '../components/RankRing.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useUser } from '../context/UserContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';

const ACHIEVEMENTS = [
  { icon: '🔥', label: '10-Day Streak', unlocked: true },
  { icon: '💪', label: '100 Push-Ups', unlocked: true },
  { icon: '🏆', label: 'Challenge Winner', unlocked: true },
  { icon: '⚡', label: 'Level 10 Reached', unlocked: true },
  { icon: '🎯', label: '50 Workouts', unlocked: false },
  { icon: '👑', label: 'Top 5 Finish', unlocked: false },
];

const ACTIVITY = [
  { dot: 'bg-volt', text: 'Completed Push Day — Upper Body', when: 'Today · +40 XP' },
  { dot: 'bg-surge', text: 'Unlocked achievement 10-Day Streak', when: 'Yesterday' },
  { dot: 'bg-volt', text: 'Completed Leg Day — Squat Focus', when: 'Yesterday · +55 XP' },
  { dot: 'bg-mist-400', text: 'Joined 1000 Push-Up Challenge', when: '4 days ago' },
];

export default function Profile() {
  useDocumentTitle('Profile — RepRank');
  const user = useUser(); // useContext under the hood — same shared data as Navbar/Dashboard
  const { toasts, showToast } = useToast();
  const pct = Math.round((user.xp / user.xpToNext) * 100);

  return (
    <Layout nav="app">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="card flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <RankRing level={user.level} pct={pct} size="h-24 w-24 shrink-0" labelSize="text-2xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-mist-100">{user.name}</h1>
            <p className="text-sm text-mist-400">@{user.username}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="badge badge-xp">Level {user.level}</span>
              <span className="badge">{user.streak}-day streak</span>
              <span className="badge">{user.workouts} workouts</span>
            </div>
          </div>
          <button onClick={() => showToast("Profile editing is a later experiment — this is a static demo for now.")} className="btn-secondary shrink-0 !py-2.5 text-sm">
            Edit Profile
          </button>
        </div>

        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-mist-100">XP Progress</h2>
            <span className="font-mono text-sm text-volt-400">{user.xp} / {user.xpToNext} XP</span>
          </div>
          <div className="progress-track mt-3">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-mist-400">{user.xpToNext - user.xp} XP until Level {user.level + 1}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card">
            <p className="stat-label">Workouts</p>
            <p className="stat-value mt-2">{user.workouts}</p>
          </div>
          <div className="card">
            <p className="stat-label">Current Streak</p>
            <p className="stat-value mt-2">{user.streak}<span className="text-base font-normal text-mist-400"> days</span></p>
          </div>
          <div className="card">
            <p className="stat-label">Challenges Won</p>
            <p className="stat-value mt-2">3</p>
          </div>
          <div className="card">
            <p className="stat-label">Season Rank</p>
            <p className="stat-value mt-2">#{user.seasonRank}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold text-mist-100">Achievements</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.label}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center ${
                    a.unlocked ? 'border border-surge/30 bg-surge/10' : 'border border-ink-600 bg-ink-800 opacity-50'
                  }`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className={`text-xs font-medium ${a.unlocked ? 'text-mist-100' : 'text-mist-300'}`}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-mist-100">Recent Activity</h2>
            <ul className="mt-4 space-y-4">
              {ACTIVITY.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                  <div>
                    <p className="text-sm text-mist-100">{item.text}</p>
                    <p className="text-xs text-mist-400">{item.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
