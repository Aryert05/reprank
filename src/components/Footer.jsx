export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink-700 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <a href="/index.html" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-volt font-display text-base font-bold text-ink-950">R</span>
              <span className="font-display text-lg text-mist-100">Rep<span className="text-volt">Rank</span></span>
            </a>
            <p className="mt-3 max-w-xs text-sm text-mist-400">Train. Track. Compete. Rank Up.</p>
          </div>

          <div>
            <h4 className="stat-label mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-mist-400">
              <li><a href="/dashboard.html" className="hover:text-mist-100">Dashboard</a></li>
              <li><a href="/workout.html" className="hover:text-mist-100">Workouts</a></li>
              <li><a href="/challenges.html" className="hover:text-mist-100">Challenges</a></li>
              <li><a href="/leaderboard.html" className="hover:text-mist-100">Leaderboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="stat-label mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-mist-400">
              <li><a href="/login.html" className="hover:text-mist-100">Log in</a></li>
              <li><a href="/register.html" className="hover:text-mist-100">Create account</a></li>
              <li><a href="/profile.html" className="hover:text-mist-100">Profile</a></li>
            </ul>
          </div>

          <div>
            <h4 className="stat-label mb-3">Project</h4>
            <ul className="space-y-2 text-sm text-mist-400">
              <li className="text-mist-400">Experiment 3 — Global State (Context API)</li>
              <li className="text-mist-400">Vite + React + Tailwind CSS</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-700 pt-6 sm:flex-row">
          <p className="text-xs text-mist-400">© {year} RepRank. Built as a college practical project.</p>
          <span className="badge">v0.3 · Experiment 3</span>
        </div>
      </div>
    </footer>
  );
}
