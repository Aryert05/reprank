import { renderAppNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';

document.getElementById('navbar-mount').innerHTML = renderAppNavbar('challenges');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();

// Static demo data — in a later experiment this comes from the backend instead.
const challenges = [
  {
    id: 'squat-30',
    name: '30-Day Squat Challenge',
    description: 'Build toward 100 bodyweight squats a day, one week at a time.',
    participants: 842,
    progress: 60,
    current: 18,
    target: 30,
    unit: 'days',
    rank: 27,
    joined: true,
  },
  {
    id: 'pushup-1000',
    name: '1000 Push-Up Challenge',
    description: 'Log push-ups across any workout until you hit four figures.',
    participants: 1204,
    progress: 78,
    current: 780,
    target: 1000,
    unit: 'reps',
    rank: 9,
    joined: true,
  },
  {
    id: 'streak-50',
    name: '50 Workout Streak',
    description: 'No off-season. Complete a workout 50 days running.',
    participants: 356,
    progress: 28,
    current: 14,
    target: 50,
    unit: 'days',
    rank: 61,
    joined: false,
  },
  {
    id: 'upper-body-week',
    name: 'Upper Body Week',
    description: 'A focused 7-day push toward chest, back, shoulders and arms.',
    participants: 519,
    progress: 0,
    current: 0,
    target: 7,
    unit: 'days',
    rank: null,
    joined: false,
  },
];

function challengeCard(c) {
  const rankLine = c.rank
    ? `<span class="badge">Your rank #${c.rank}</span>`
    : `<span class="badge">Not ranked yet</span>`;

  return `
    <div class="card card-hover flex flex-col" data-id="${c.id}">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold text-mist-100">${c.name}</h3>
        ${rankLine}
      </div>
      <p class="mt-2 text-sm text-mist-400">${c.description}</p>

      <div class="mt-4 flex items-center justify-between text-xs text-mist-400">
        <span>${c.participants.toLocaleString()} participants</span>
        <span class="font-mono">${c.current} / ${c.target} ${c.unit}</span>
      </div>
      <div class="progress-track mt-2">
        <div class="progress-fill" style="width:${c.progress}%"></div>
      </div>

      <button
        class="join-btn ${c.joined ? 'btn-secondary' : 'btn-primary'} mt-5 w-full !py-2.5 text-sm"
        data-joined="${c.joined}">
        ${c.joined ? 'Joined ✓' : 'Join Challenge'}
      </button>
    </div>`;
}

const grid = document.getElementById('challenge-grid');
grid.innerHTML = challenges.map(challengeCard).join('');

// Event delegation: one listener handles every "Join Challenge" button,
// including the toggle to a "Joined" state — all client-side for Experiment 1.
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.join-btn');
  if (!btn) return;

  const alreadyJoined = btn.dataset.joined === 'true';
  if (alreadyJoined) {
    showToast('You\u2019re already in this one — keep logging progress.');
    return;
  }

  btn.dataset.joined = 'true';
  btn.textContent = 'Joined ✓';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-secondary');

  const name = btn.closest('[data-id]')?.querySelector('h3')?.textContent;
  showToast(`Joined "${name}" — good luck!`);
});
