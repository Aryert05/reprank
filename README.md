# RepRank — Experiment 2: React Hooks (useEffect, useContext, Custom Hooks)

Same project as Experiment 1 (**not** a new project) — the existing Vite + Tailwind
multi-page site has now been converted to **React**, and demonstrates `useEffect`,
`useContext`, and custom hooks exactly as covered in the practical.

## 1. Setup

```bash
npm install
npm run dev
```

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build locally
```

## 2. What changed since Experiment 1

- Added **React** (`react`, `react-dom`) and **`@vitejs/plugin-react`** to `package.json` /
  `vite.config.js`. The site is still multi-page (8 `.html` files), but each page now boots
  its own small React app instead of hand-written DOM injection.
- Every page's markup moved from a `.html` template + vanilla `.js` file into a `.jsx`
  **page component** under `src/pages/`.
- Each `.html` file was simplified to a single `<div id="root"></div>` + one
  `<script type="module" src="/src/entries/*.jsx">`.
- The old `navbar-mount` / `footer-mount` DOM injection was replaced by a `<Layout>`
  component that renders `<NavbarMarketing>` / `<NavbarApp>` + `{children}` + `<Footer>`.

## 3. Project structure

```text
reprank/
├── index.html, login.html, register.html, dashboard.html,
│   workout.html, challenges.html, leaderboard.html, profile.html
│   (each is now just <div id="root"></div> + a script tag)
│
├── vite.config.js       # adds the React plugin, keeps the multi-page entry map
├── tailwind.config.js   # content globs now include .jsx
│
├── src/
│   ├── style.css                 # unchanged design system from Experiment 1
│   ├── context/
│   │   └── UserContext.jsx        # useContext — shared user data (PART E/F)
│   ├── hooks/
│   │   ├── useDocumentTitle.js     # Custom Hook — wraps useEffect (title on load)
│   │   ├── useFetch.js             # Custom Hook — wraps useEffect (data fetching)
│   │   ├── useForm.js              # Custom Hook — reusable form-field handling
│   │   └── useToast.js             # Custom Hook — reusable notification logic
│   ├── data/
│   │   └── mockApi.js              # simulated async "API calls" (setTimeout + Promise)
│   ├── components/
│   │   ├── Layout.jsx               # picks NavbarMarketing/NavbarApp + Footer
│   │   ├── NavbarMarketing.jsx, NavbarApp.jsx, Footer.jsx
│   │   ├── RankRing.jsx              # signature XP-ring, now a real component
│   │   └── ToastViewport.jsx         # renders toasts from useToast
│   ├── pages/
│   │   ├── Home.jsx, Login.jsx, Register.jsx, Dashboard.jsx,
│   │   └── Workout.jsx, Challenges.jsx, Leaderboard.jsx, Profile.jsx
│   └── entries/
│       └── one file per page — mounts <UserProvider><Page /></UserProvider> into #root
│
└── public/
```

## 4. The three hooks, mapped onto RepRank

### `useEffect()` — side effects
- **`Dashboard.jsx`** runs `useEffect(() => console.log('Dashboard loaded'), [])` the moment
  it mounts — the empty `[]` means "run once, on load," straight from the practical's example.
- **`useDocumentTitle(title)`** (a custom hook, see below) wraps a `useEffect` that sets
  `document.title` and restores it on unmount. Called on *every* page.
- **`useFetch(fetcher, deps)`** (also a custom hook) wraps a `useEffect` that calls an async
  function and stores `data` / `loading` / `error` — the "fetch data" example from the table.

### `useContext()` — sharing data without prop drilling
- `src/context/UserContext.jsx` creates `UserContext` and a `UserProvider` that supplies one
  demo user object (`{ name, role, level, xp, streak, workouts, ... }`).
- **`Dashboard.jsx`** reads it with `const user = useContext(UserContext)` — matching the
  practical's exact pattern — and renders `Welcome, {user.name}` / `Role: {user.role}`.
- **`NavbarApp.jsx`**, **`Profile.jsx`**, and **`Leaderboard.jsx`** all read the same context
  (via a small `useUser()` wrapper hook) with **zero props** passed down through `Layout` —
  that's the prop-drilling `useContext` avoids.
- Adapted to RepRank's problem statement (PART F): instead of an e-commerce `cartItems`
  example, the shared data is fitness-specific — `level`, `xp`, `streak`, `workouts`.

### Custom Hooks — reusing logic
| Hook | Reuses | Used in |
|---|---|---|
| `useDocumentTitle(title)` | the "set title on load" `useEffect` | every page |
| `useFetch(fetcher, deps)` | the "loading/data/error" fetch pattern | Dashboard, Challenges, Leaderboard, Workout |
| `useForm(initialValues)` | controlled-input form state | Login, Register |
| `useToast()` | "demo action confirmed" notification state | Login, Register, Workout, Challenges, Profile |

Each one is a plain function starting with `use`, and each calls other hooks internally
(`useState`, `useEffect`) — exactly the definition from PART G.

## 5. Data fetching (still no real backend)

`src/data/mockApi.js` exports functions like `fetchDashboardExtras()` and
`fetchLeaderboard()` that return a `Promise` resolved after a short `setTimeout` — standing
in for a real `fetch('/api/...')` call. `useFetch` consumes them, so Dashboard, Challenges,
Leaderboard, and Workout all show a brief skeleton/loading state before the demo data
appears, which is what "Implement forms, data fetching, and reusable custom hooks" asks for.

## 6. Forms

Login and Register both use `useForm()` for controlled inputs (`values`, `handleChange`) and
`useToast()` to confirm submission — there's still no authentication logic, per the original
Experiment 1 scope restriction; that stays for a later experiment.

## 7. Features implemented in Experiment 2

- Whole app converted from vanilla JS DOM manipulation to React function components
- `useEffect` demonstrated for: on-load logging, document-title updates, and data fetching
- `useContext` demonstrated for: sharing one user object across Navbar, Dashboard, Profile,
  and Leaderboard without prop drilling
- Four custom hooks (`useDocumentTitle`, `useFetch`, `useForm`, `useToast`) each reused
  across multiple pages
- Simulated async data fetching with loading skeletons (Dashboard, Challenges, Leaderboard,
  Workout)
- All Experiment 1 UI, responsiveness, and design system preserved exactly

## 8. Still intentionally left for later experiments

- Redux / global state beyond simple Context
- React Router (pages are still separate `.html` files, each its own small React app)
- Node.js + Express backend, MongoDB, REST API
- JWT auth / real login-register logic
- WebSockets, Docker, CI/CD, deployment

## 9. Short viva summary

"Experiment 2 takes the same RepRank frontend from Experiment 1 and converts it to React,
using the three hooks covered in the practical. `useEffect` runs side effects like setting
the document title and fetching dashboard data on load. `useContext`, via a `UserContext`
provider, shares one user object — name, role, level, XP, streak — across the navbar,
dashboard, profile, and leaderboard pages without passing it down as props through every
component in between. And four custom hooks — `useDocumentTitle`, `useFetch`, `useForm`, and
`useToast` — each wrap one of those patterns once and get reused across several pages instead
of being rewritten each time. There's still no backend: `useFetch` calls a mock API module
that returns a delayed Promise, standing in for what a real network request will look like
once Express and MongoDB are added in a later experiment."
