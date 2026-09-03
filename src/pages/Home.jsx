import Layout from '../components/Layout.jsx';
import RankRing from '../components/RankRing.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Home() {
  useDocumentTitle('RepRank — Train. Track. Compete. Rank Up.');

  const features = [
    { title: 'Track Your Workouts', body: 'Log every set, rep and weight, and watch your history build into real progress.', accentClasses: 'bg-volt/10 text-volt' },
    { title: 'Join Challenges', body: 'Squat streaks, push-up marathons, upper-body weeks — pick a fight worth winning.', accentClasses: 'bg-volt/10 text-volt' },
    { title: 'Earn XP & Badges', body: 'Every session earns XP. Every milestone earns a badge you actually keep.', accentClasses: 'bg-surge/10 text-surge' },
    { title: 'Compete on Leaderboards', body: 'See exactly where you rank against your gym, your friends, and the season.', accentClasses: 'bg-volt/10 text-volt' },
  ];

  return (
    <Layout nav="marketing" active="home">
      <main>
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden border-b border-ink-700">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_theme(colors.volt.DEFAULT)_0%,_transparent_45%)] opacity-[0.08]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
            <div>
              <span className="badge badge-xp">Season 3 · Now live</span>
              <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-mist-100 sm:text-6xl">
                Train. Track.<br />
                Compete. <span className="text-volt">Rank Up.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg text-mist-300">
                RepRank turns every workout into progress you can see — log your lifts, chase
                streaks, and climb a leaderboard against people actually training as hard as you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/register.html" className="btn-primary">Get Started</a>
                <a href="/challenges.html" className="btn-secondary">Explore Challenges</a>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-mist-400">
                <div><span className="font-mono text-lg font-semibold text-mist-100">12K+</span> lifters</div>
                <div className="h-4 w-px bg-ink-700" />
                <div><span className="font-mono text-lg font-semibold text-mist-100">480+</span> challenges run</div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="card">
                <div className="flex items-center justify-between">
                  <span className="badge badge-xp">In progress</span>
                  <RankRing level={12} pct={82} size="h-12 w-12" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-mist-100">Push Day — Upper Body</h3>
                <p className="text-sm text-mist-400">Bench Press · Set 3 of 4</p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-ink-800 px-4 py-3">
                    <span className="text-sm text-mist-300">Bench Press</span>
                    <span className="font-mono text-sm text-mist-100">4×8 · 60 kg</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-ink-800 px-4 py-3">
                    <span className="text-sm text-mist-300">Overhead Press</span>
                    <span className="font-mono text-sm text-mist-100">3×10 · 32 kg</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-volt/30 bg-volt/10 px-4 py-3">
                    <span className="text-sm text-volt-400">+40 XP earned today</span>
                    <span className="font-mono text-sm text-volt-400">↑ Level 12</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 -top-6 -z-10 h-40 w-40 rounded-full bg-volt/20 blur-3xl" />
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="border-b border-ink-700 bg-ink-950">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <span className="stat-label">Why RepRank</span>
              <h2 className="mt-2 text-3xl font-semibold text-mist-100 sm:text-4xl">Everything a habit needs to stick</h2>
              <p className="mt-3 text-mist-400">Logging a workout is easy to skip. Logging one that moves a rank, a streak, or a challenge isn't.</p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="card card-hover">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${f.accentClasses}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-semibold text-mist-100">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-mist-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="border-b border-ink-700">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="card flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="text-2xl font-semibold text-mist-100">Your next rank is one workout away.</h3>
                <p className="mt-1 text-mist-400">Create a free account and log your first session today.</p>
              </div>
              <a href="/register.html" className="btn-primary shrink-0">Get Started</a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
