import { useState } from 'react';

const LINKS = [
  ['/index.html', 'Home', 'home'],
  ['/challenges.html', 'Challenges', 'challenges'],
  ['/leaderboard.html', 'Leaderboard', 'leaderboard'],
];

function NavLink({ href, label, active }) {
  return (
    <a
      href={href}
      className={`relative py-1 text-sm font-medium transition-colors after:absolute after:-bottom-1
        after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-volt after:transition-transform
        after:duration-200 hover:after:scale-x-100 ${
          active ? 'text-mist-100 after:scale-x-100' : 'text-mist-400 hover:text-mist-100 after:scale-x-0'
        }`}
    >
      {label}
    </a>
  );
}

export default function NavbarMarketing({ active = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/index.html" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-volt font-display text-lg font-bold text-ink-950">R</span>
          <span className="font-display text-xl tracking-wide text-mist-100">
            Rep<span className="text-volt">Rank</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map(([href, label, key]) => (
            <NavLink key={key} href={href} label={label} active={active === key} />
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a href="/login.html" className="btn-ghost">Log in</a>
          <a href="/register.html" className="btn-primary !px-5 !py-2.5 text-sm">Get Started</a>
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-ink-600 text-mist-100 md:hidden"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-700 bg-ink-950 md:hidden">
          <div className="space-y-1 px-4 py-4">
            {LINKS.map(([href, label, key]) => (
              <a key={key} href={href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-mist-300 hover:bg-ink-800 hover:text-mist-100">
                {label}
              </a>
            ))}
            <div className="mt-3 flex gap-3 border-t border-ink-700 pt-4">
              <a href="/login.html" className="btn-secondary flex-1 !py-2.5 text-sm">Log in</a>
              <a href="/register.html" className="btn-primary flex-1 !py-2.5 text-sm">Get Started</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
