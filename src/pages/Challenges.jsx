import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import ToastViewport from '../components/ToastViewport.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../hooks/useToast.js';
import { fetchChallenges } from '../data/mockApi.js';

export default function Challenges() {
  useDocumentTitle('Challenges — RepRank');
  const { toasts, showToast } = useToast();

  // useFetch — loads the challenge list (simulated API call) with a real loading state.
  const { data: challenges, loading } = useFetch(fetchChallenges, []);
  const [joinedOverrides, setJoinedOverrides] = useState({});

  function handleJoin(challenge) {
    const alreadyJoined = joinedOverrides[challenge.id] ?? challenge.joined;
    if (alreadyJoined) {
      showToast("You're already in this one — keep logging progress.");
      return;
    }
    setJoinedOverrides((prev) => ({ ...prev, [challenge.id]: true }));
    showToast(`Joined "${challenge.name}" — good luck!`);
  }

  return (
    <Layout nav="app" active="challenges">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="stat-label">Active challenges</p>
          <h1 className="mt-1 text-3xl font-semibold text-mist-100">Pick a fight worth winning</h1>
          <p className="mt-2 text-mist-400">Join a challenge, log the work, and watch your rank move.</p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="card">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-ink-700" />
                  <div className="mt-3 h-10 animate-pulse rounded bg-ink-800" />
                  <div className="mt-4 h-2 animate-pulse rounded-full bg-ink-700" />
                </div>
              ))
            : challenges.map((c) => {
                const joined = joinedOverrides[c.id] ?? c.joined;
                return (
                  <div key={c.id} className="card card-hover flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-mist-100">{c.name}</h3>
                      <span className="badge">{c.rank ? `Your rank #${c.rank}` : 'Not ranked yet'}</span>
                    </div>
                    <p className="mt-2 text-sm text-mist-400">{c.description}</p>

                    <div className="mt-4 flex items-center justify-between text-xs text-mist-400">
                      <span>{c.participants.toLocaleString()} participants</span>
                      <span className="font-mono">{c.current} / {c.target} {c.unit}</span>
                    </div>
                    <div className="progress-track mt-2">
                      <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>

                    <button
                      onClick={() => handleJoin(c)}
                      className={`${joined ? 'btn-secondary' : 'btn-primary'} mt-5 w-full !py-2.5 text-sm`}
                    >
                      {joined ? 'Joined ✓' : 'Join Challenge'}
                    </button>
                  </div>
                );
              })}
        </div>
      </main>

      <ToastViewport toasts={toasts} />
    </Layout>
  );
}
