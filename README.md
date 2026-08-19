# RepRank — Experiment 1: Frontend UI

Gamified workout & fitness tracking platform. This experiment builds a responsive,
interactive **frontend only** — no backend, no database, no authentication.

Stack: **Vite + vanilla JavaScript + Tailwind CSS**.

## 1. Setup

```bash
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`). Open it in a browser.

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build locally
```

## 2. Project structure

```text
reprank/
├── index.html            # Home page
├── login.html            # Login page (UI only)
├── register.html         # Register page (UI only)
├── dashboard.html         # Dashboard with stats, streak, challenge, leaderboard preview
├── workout.html            # Workout logging screen
├── challenges.html         # Challenge cards
├── leaderboard.html         # Full leaderboard
├── profile.html             # User profile
│
├── package.json
├── vite.config.js         # multi-page build config (lists every .html entry)
├── tailwind.config.js     # design tokens: colors, fonts
├── postcss.config.js      # required to run Tailwind
│
├── src/
│   ├── style.css           # Tailwind layers + reusable component classes (.btn-primary, .card, ...)
│   ├── components/
│   │   ├── navbar.js       # renders the marketing nav and the app nav, shared across pages
│   │   ├── footer.js       # renders the shared footer
│   │   └── toast.js        # small "toast" popup used to confirm demo/non-functional actions
│   └── pages/
│       ├── home.js         # one entry script per HTML page — injects navbar/footer,
│       ├── login.js        #   wires up that page's demo interactions
│       ├── register.js
│       ├── dashboard.js
│       ├── workout.js
│       ├── challenges.js
│       ├── leaderboard.js
│       └── profile.js
│
└── public/                 # static assets (empty for now)
```

### Why one JS file per page instead of a single `main.js`?

Because this is a **multi-page site** (8 separate `.html` files, not a single-page app),
each page needs its own Vite entry `<script type="module">`. Rather than duplicate the
navbar/footer markup in all 8 HTML files, each page's script imports the same
`components/navbar.js` and `components/footer.js` and injects them into a
`<div id="navbar-mount">` / `<div id="footer-mount">` placeholder. This keeps the HTML
files focused on page content, avoids copy-pasted markup, and maps cleanly onto React
components (`<Navbar />`, `<Footer />`) in Experiment 2 — each `pages/*.js` file is close
to what a React page component will look like.

## 3. How the UI satisfies Experiment 1

- Built with **Vite + Tailwind CSS**, as required — no React, Redux, or backend.
- All 8 required screens exist: Home, Login, Register, Dashboard, Workout, Challenges,
  Leaderboard, Profile.
- Every screen uses **static/demo data** (e.g. Level 12, 820/1000 XP, 14-day streak,
  32 workouts, "1000 Push-Up Challenge" at 780/1000, the sample leaderboard). Nothing is
  read from or written to a server.
- Buttons like Login, Register, Join Challenge, Start/Finish Workout, and Edit Profile are
  **visual/demo interactions only** — they toggle local UI state (a button label, a badge,
  a toast message) and never call an API.
- The layout is responsive: the navbar collapses into a mobile menu, dashboard stats move
  from a 4-column grid to a 2-column grid on small screens, and cards stack vertically on
  mobile using Tailwind's `sm:` / `lg:` responsive utilities.

## 4. Design system (for the viva)

- **Colors**: a dark ink-blue background (`ink-950` → `ink-700`) with one strong accent,
  `volt` (a warm orange), used consistently for primary buttons, XP, and progress bars.
  A second accent, `surge` (violet), is reserved only for achievement badges so it doesn't
  compete with the XP color.
- **Type**: `Oswald` for headings (a condensed, athletic display face), `Inter` for body
  text, and `JetBrains Mono` for numbers/stats (XP, reps, weights) — mono type makes stats
  read like a scoreboard.
- **Signature element — the "Rank Ring"**: a circular XP-progress ring built with a CSS
  `conic-gradient` (see `.rank-ring` in `src/style.css`) that shows the user's level in the
  center. It appears at three sizes: small in the navbar, large on the dashboard, and large
  on the profile page — one visual motif tying the whole app together.

## 5. Features implemented in Experiment 1

- Responsive marketing homepage (hero, features grid, CTA)
- Login and Register forms with client-side-only interaction (no real auth)
- Dashboard with XP/level/streak/workout stats, weekly progress, recent workouts, current
  challenge, leaderboard preview, and quick actions
- Workout page with exercise cards, sets/reps/weight tables, and demo Start / Add Exercise /
  Finish Workout interactions (including a set-completion toggle)
- Challenges page with joinable challenge cards and progress bars
- Leaderboard page with a top-3 podium and a full ranked table that highlights the current user
- Profile page with avatar placeholder, XP progress, achievements grid, and recent activity feed
- Shared, reusable navbar (two variants) and footer components
- Fully responsive layout (mobile, tablet, laptop, desktop) with a mobile hamburger menu

## 6. Intentionally left for later experiments

- React (and migrating these pages/components into React components)
- Redux / Context API for state management
- Node.js + Express backend
- MongoDB + Mongoose data models
- REST API endpoints
- JWT-based authentication
- Real login/register logic, password hashing, sessions
- WebSockets (e.g. live leaderboard updates)
- Docker / Docker Compose
- CI/CD (GitHub Actions) and deployment

## 7. Short viva summary

"RepRank Experiment 1 is the static frontend for a gamified fitness tracker, built with
Vite and Tailwind CSS as a multi-page vanilla JavaScript site. Every screen — home, login,
register, dashboard, workout, challenges, leaderboard, and profile — is complete and
responsive, using demo data to show what the finished product will look like. Shared pieces
like the navbar and footer are written once as JavaScript components and injected into every
page, so the codebase stays DRY and can be migrated into React components in Experiment 2.
There's no backend yet: buttons like Login and Join Challenge only update the UI locally and
show a toast confirming the click, since authentication, the database, and the API are all
scoped for later experiments."
