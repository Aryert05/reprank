export function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="border-t border-ink-700 bg-ink-950">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div class="col-span-2 md:col-span-1">
          <a href="/index.html" class="flex items-center gap-2">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-volt font-display text-base font-bold text-ink-950">R</span>
            <span class="font-display text-lg text-mist-100">Rep<span class="text-volt">Rank</span></span>
          </a>
          <p class="mt-3 max-w-xs text-sm text-mist-400">Train. Track. Compete. Rank Up.</p>
        </div>

        <div>
          <h4 class="stat-label mb-3">Platform</h4>
          <ul class="space-y-2 text-sm text-mist-400">
            <li><a href="/dashboard.html" class="hover:text-mist-100">Dashboard</a></li>
            <li><a href="/workout.html" class="hover:text-mist-100">Workouts</a></li>
            <li><a href="/challenges.html" class="hover:text-mist-100">Challenges</a></li>
            <li><a href="/leaderboard.html" class="hover:text-mist-100">Leaderboard</a></li>
          </ul>
        </div>

        <div>
          <h4 class="stat-label mb-3">Account</h4>
          <ul class="space-y-2 text-sm text-mist-400">
            <li><a href="/login.html" class="hover:text-mist-100">Log in</a></li>
            <li><a href="/register.html" class="hover:text-mist-100">Create account</a></li>
            <li><a href="/profile.html" class="hover:text-mist-100">Profile</a></li>
          </ul>
        </div>

        <div>
          <h4 class="stat-label mb-3">Project</h4>
          <ul class="space-y-2 text-sm text-mist-400">
            <li class="text-mist-400">Experiment 1 — Frontend UI</li>
            <li class="text-mist-400">Vite + Tailwind CSS</li>
          </ul>
        </div>
      </div>

      <div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-700 pt-6 sm:flex-row">
        <p class="text-xs text-mist-400">© ${year} RepRank. Built as a college practical project.</p>
        <div class="flex gap-2">
          <span class="badge">v0.1 · Experiment 1</span>
        </div>
      </div>
    </div>
  </footer>`;
}
