// Shared navbar component.
// Two variants: the marketing nav (Home/Login/Register — logged-out feel)
// and the app nav (Dashboard/Workouts/Challenges/Leaderboard/Profile — logged-in feel).
// Both are plain template strings injected into a mount point, kept deliberately
// simple (no framework, no router) so this can be lifted into React components in Experiment 2.

const LOGO = `
  <a href="/index.html" class="flex items-center gap-2 shrink-0">
    <span class="grid h-9 w-9 place-items-center rounded-lg bg-volt font-display text-lg font-bold text-ink-950">R</span>
    <span class="font-display text-xl tracking-wide text-mist-100">Rep<span class="text-volt">Rank</span></span>
  </a>
`;

function navLink(href, label, active) {
  const activeClasses = active
    ? 'text-mist-100 after:scale-x-100'
    : 'text-mist-400 hover:text-mist-100 after:scale-x-0';
  return `
    <a href="${href}"
       class="relative py-1 text-sm font-medium transition-colors ${activeClasses}
              after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left
              after:bg-volt after:transition-transform after:duration-200 hover:after:scale-x-100">
      ${label}
    </a>`;
}

export function renderMarketingNavbar(active = '') {
  const links = [
    ['/index.html', 'Home', 'home'],
    ['/challenges.html', 'Challenges', 'challenges'],
    ['/leaderboard.html', 'Leaderboard', 'leaderboard'],
  ];

  return `
  <header class="sticky top-0 z-50 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
    <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      ${LOGO}

      <div class="hidden items-center gap-8 md:flex">
        ${links.map(([href, label, key]) => navLink(href, label, active === key)).join('')}
      </div>

      <div class="hidden items-center gap-3 md:flex">
        <a href="/login.html" class="btn-ghost">Log in</a>
        <a href="/register.html" class="btn-primary !px-5 !py-2.5 text-sm">Get Started</a>
      </div>

      <button id="nav-toggle" aria-label="Toggle menu" aria-expanded="false"
        class="grid h-10 w-10 place-items-center rounded-lg border border-ink-600 text-mist-100 md:hidden">
        <svg id="nav-icon-open" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg id="nav-icon-close" xmlns="http://www.w3.org/2000/svg" class="hidden h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </nav>

    <div id="nav-mobile" class="hidden border-t border-ink-700 bg-ink-950 md:hidden">
      <div class="space-y-1 px-4 py-4">
        ${links.map(([href, label]) => `<a href="${href}" class="block rounded-lg px-3 py-2.5 text-sm font-medium text-mist-300 hover:bg-ink-800 hover:text-mist-100">${label}</a>`).join('')}
        <div class="mt-3 flex gap-3 border-t border-ink-700 pt-4">
          <a href="/login.html" class="btn-secondary flex-1 !py-2.5 text-sm">Log in</a>
          <a href="/register.html" class="btn-primary flex-1 !py-2.5 text-sm">Get Started</a>
        </div>
      </div>
    </div>
  </header>`;
}

export function renderAppNavbar(active = '') {
  const links = [
    ['/dashboard.html', 'Dashboard', 'dashboard'],
    ['/workout.html', 'Workouts', 'workout'],
    ['/challenges.html', 'Challenges', 'challenges'],
    ['/leaderboard.html', 'Leaderboard', 'leaderboard'],
  ];

  return `
  <header class="sticky top-0 z-50 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
    <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      ${LOGO}

      <div class="hidden items-center gap-8 md:flex">
        ${links.map(([href, label, key]) => navLink(href, label, active === key)).join('')}
      </div>

      <a href="/profile.html" class="hidden items-center gap-3 md:flex" title="View profile">
        <span class="text-right leading-tight">
          <span class="block text-sm font-semibold text-mist-100">Aditi Sharma</span>
          <span class="block text-xs font-mono text-volt-400">Level 12</span>
        </span>
        <span class="rank-ring h-10 w-10" style="--pct:82">
          <span class="rank-ring-label text-xs">12</span>
        </span>
      </a>

      <button id="nav-toggle" aria-label="Toggle menu" aria-expanded="false"
        class="grid h-10 w-10 place-items-center rounded-lg border border-ink-600 text-mist-100 md:hidden">
        <svg id="nav-icon-open" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg id="nav-icon-close" xmlns="http://www.w3.org/2000/svg" class="hidden h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </nav>

    <div id="nav-mobile" class="hidden border-t border-ink-700 bg-ink-950 md:hidden">
      <div class="space-y-1 px-4 py-4">
        ${links.map(([href, label]) => `<a href="${href}" class="block rounded-lg px-3 py-2.5 text-sm font-medium text-mist-300 hover:bg-ink-800 hover:text-mist-100">${label}</a>`).join('')}
        <a href="/profile.html" class="mt-3 flex items-center gap-3 rounded-lg border-t border-ink-700 px-3 pt-4">
          <span class="rank-ring h-9 w-9" style="--pct:82"><span class="rank-ring-label text-xs">12</span></span>
          <span class="text-sm font-medium text-mist-100">Aditi Sharma · Profile</span>
        </a>
      </div>
    </div>
  </header>`;
}

// Wires up the hamburger toggle. Call once after injecting a navbar into the DOM.
export function mountNavbarBehavior() {
  const toggle = document.getElementById('nav-toggle');
  const mobile = document.getElementById('nav-mobile');
  const iconOpen = document.getElementById('nav-icon-open');
  const iconClose = document.getElementById('nav-icon-close');
  if (!toggle || !mobile) return;

  toggle.addEventListener('click', () => {
    const isOpen = !mobile.classList.contains('hidden');
    mobile.classList.toggle('hidden');
    iconOpen?.classList.toggle('hidden');
    iconClose?.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });
}
