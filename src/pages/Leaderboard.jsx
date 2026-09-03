import Layout from '../components/Layout.jsx';
import { useUser } from '../context/UserContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFetch } from '../hooks/useFetch.js';
import { fetchLeaderboard } from '../data/mockApi.js';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const MEDAL_ORDER = [2, 1, 3];
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const PODIUM_PADDING = { 1: 'pt-2', 2: 'pt-8', 3: 'pt-10' };

export default function Leaderboard() {
  useDocumentTitle('Leaderboard — RepRank');
  const user = useUser();
  const { data: board, loading } = useFetch(fetchLeaderboard, []);

  return (
    <Layout nav="app" active="leaderboard">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="stat-label">Season 3</p>
          <h1 className="mt-1 text-3xl font-semibold text-mist-100">Leaderboard</h1>
          <p className="mt-2 text-mist-400">Ranked by total XP earned this season.</p>
        </div>

        {/* ---- Podium (top 3) ---- */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {loading
            ? MEDAL_ORDER.map((rank) => (
                <div key={rank} className={`card ${PODIUM_PADDING[rank]} flex flex-col items-center`}>
                  <div className="h-12 w-12 animate-pulse rounded-full bg-ink-700" />
                  <div className="mt-2 h-4 w-16 animate-pulse rounded bg-ink-700" />
                </div>
              ))
            : MEDAL_ORDER.map((rank) => {
                const p = board.find((b) => b.rank === rank);
                return (
                  <div key={rank} className={`card ${PODIUM_PADDING[rank]} flex flex-col items-center text-center`}>
                    <span className="text-2xl">{MEDALS[rank]}</span>
                    <span className="mt-2 grid h-12 w-12 place-items-center rounded-full bg-ink-700 font-mono text-sm font-semibold text-mist-100">
                      {initials(p.name)}
                    </span>
                    <p className="mt-2 truncate text-sm font-semibold text-mist-100">{p.name}</p>
                    <p className="font-mono text-xs text-volt-400">{p.xp.toLocaleString()} XP</p>
                  </div>
                );
              })}
        </div>

        {/* ---- Full ranked list ---- */}
        <div className="card mt-6 overflow-hidden !p-0">
          <div className="hidden grid-cols-[3rem_1fr_6rem_6rem_7rem] gap-2 border-b border-ink-700 px-6 py-3 text-xs font-medium uppercase tracking-widest text-mist-400 sm:grid">
            <span>Rank</span>
            <span>User</span>
            <span className="text-right">XP</span>
            <span className="text-right">Workouts</span>
            <span className="text-right">Challenge Pts</span>
          </div>
          <div className="divide-y divide-ink-700">
            {loading
              ? [1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 animate-pulse bg-ink-900 px-6 py-4" />)
              : board.map((p) => {
                  const isYou = p.name === user.name;
                  return (
                    <div
                      key={p.rank}
                      className={`grid grid-cols-[3rem_1fr_auto] items-center gap-2 px-6 py-4 sm:grid-cols-[3rem_1fr_6rem_6rem_7rem] ${
                        isYou ? 'border-l-2 border-volt bg-volt/5' : ''
                      }`}
                    >
                      <span className={`font-mono text-sm ${p.rank <= 3 ? 'text-volt-400' : 'text-mist-400'}`}>#{p.rank}</span>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-700 font-mono text-xs font-semibold text-mist-100">
                          {initials(p.name)}
                        </span>
                        <span className="truncate text-sm font-medium text-mist-100">
                          {p.name}
                          {isYou && <span className="ml-1 text-xs text-volt">(you)</span>}
                        </span>
                      </div>
                      <span className="text-right font-mono text-sm text-mist-100">{p.xp.toLocaleString()}</span>
                      <span className="hidden text-right font-mono text-sm text-mist-400 sm:block">{p.workouts}</span>
                      <span className="hidden text-right font-mono text-sm text-mist-400 sm:block">{p.points}</span>
                    </div>
                  );
                })}
          </div>
        </div>
      </main>
    </Layout>
  );
}
