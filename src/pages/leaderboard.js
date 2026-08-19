import { renderAppNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

document.getElementById('navbar-mount').innerHTML = renderAppNavbar('leaderboard');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();

// Static demo data. "you: true" flags the current user so their row can be highlighted.
const board = [
  { rank: 1, name: 'Rahul', xp: 4200, workouts: 61, points: 980 },
  { rank: 2, name: 'Aryan', xp: 3950, workouts: 58, points: 910 },
  { rank: 3, name: 'Aditya', xp: 3700, workouts: 55, points: 875 },
  { rank: 4, name: 'Rohan', xp: 3450, workouts: 50, points: 820 },
  { rank: 5, name: 'Priya', xp: 3120, workouts: 47, points: 760 },
  { rank: 6, name: 'Kabir', xp: 2890, workouts: 44, points: 705 },
  { rank: 7, name: 'Meera', xp: 2650, workouts: 41, points: 640 },
  { rank: 8, name: 'Aditi Sharma', xp: 2480, workouts: 32, points: 590, you: true },
  { rank: 9, name: 'Vikram', xp: 2310, workouts: 30, points: 555 },
  { rank: 10, name: 'Simran', xp: 2105, workouts: 28, points: 510 },
];

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ---- Podium (top 3) ----
const medalOrder = [2, 1, 3]; // display order: 2nd, 1st, 3rd — classic podium layout
const podium = document.getElementById('podium');
podium.innerHTML = medalOrder
  .map((rank) => {
    const p = board.find((b) => b.rank === rank);
    const heights = { 1: 'pt-2', 2: 'pt-8', 3: 'pt-10' };
    const medal = { 1: '🥇', 2: '🥈', 3: '🥉' }[rank];
    return `
      <div class="card ${heights[rank]} flex flex-col items-center text-center">
        <span class="text-2xl">${medal}</span>
        <span class="mt-2 grid h-12 w-12 place-items-center rounded-full bg-ink-700 font-mono text-sm font-semibold text-mist-100">${initials(p.name)}</span>
        <p class="mt-2 truncate text-sm font-semibold text-mist-100">${p.name}</p>
        <p class="font-mono text-xs text-volt-400">${p.xp.toLocaleString()} XP</p>
      </div>`;
  })
  .join('');

// ---- Full list ----
const list = document.getElementById('leaderboard-list');
list.innerHTML = board
  .map((p) => {
    const highlight = p.you ? 'bg-volt/5 border-l-2 border-volt' : '';
    return `
      <div class="grid grid-cols-[3rem_1fr_auto] items-center gap-2 px-6 py-4 sm:grid-cols-[3rem_1fr_6rem_6rem_7rem] ${highlight}">
        <span class="font-mono text-sm ${p.rank <= 3 ? 'text-volt-400' : 'text-mist-400'}">#${p.rank}</span>
        <div class="flex items-center gap-3">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-700 font-mono text-xs font-semibold text-mist-100">${initials(p.name)}</span>
          <span class="truncate text-sm font-medium text-mist-100">${p.name}${p.you ? ' <span class=\'text-xs text-volt\'>(you)</span>' : ''}</span>
        </div>
        <span class="text-right font-mono text-sm text-mist-100">${p.xp.toLocaleString()}</span>
        <span class="hidden text-right font-mono text-sm text-mist-400 sm:block">${p.workouts}</span>
        <span class="hidden text-right font-mono text-sm text-mist-400 sm:block">${p.points}</span>
      </div>`;
  })
  .join('');
