import { renderAppNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';

document.getElementById('navbar-mount').innerHTML = renderAppNavbar('workout');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();

const statusBadge = document.getElementById('session-status');
const startBtn = document.getElementById('start-workout');
const addBtn = document.getElementById('add-exercise');
const finishBtn = document.getElementById('finish-workout');
const list = document.getElementById('exercise-list');

// Pool of demo exercises used when the user clicks "+ Add Exercise".
// No backend yet — this just proves the UI can grow the workout dynamically.
const exercisePool = [
  { name: 'Incline Dumbbell Press', tag: 'Chest', sets: [[10, '18 kg'], [10, '18 kg'], [8, '20 kg']] },
  { name: 'Lateral Raise', tag: 'Shoulders', sets: [[15, '8 kg'], [15, '8 kg'], [12, '10 kg']] },
  { name: 'Cable Fly', tag: 'Chest', sets: [[12, '15 kg'], [12, '15 kg'], [10, '17.5 kg']] },
];
let poolIndex = 0;

function buildExerciseCard({ name, tag, sets }) {
  const rows = sets
    .map(
      ([reps, weight], i) => `
      <tr class="border-t border-ink-700">
        <td class="py-2">${i + 1}</td><td>${reps}</td><td>${weight}</td>
        <td><span class="set-check text-mist-400">○</span></td>
      </tr>`
    )
    .join('');

  const card = document.createElement('div');
  card.className = 'card exercise-card animate-[fadeIn_.2s_ease]';
  card.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-mist-100">${name}</h3>
      <span class="badge">${tag}</span>
    </div>
    <div class="mt-4 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-mist-400">
            <th class="pb-2 font-medium">Set</th>
            <th class="pb-2 font-medium">Reps</th>
            <th class="pb-2 font-medium">Weight</th>
            <th class="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody class="font-mono text-mist-100">${rows}</tbody>
      </table>
    </div>`;
  return card;
}

startBtn?.addEventListener('click', () => {
  const started = startBtn.dataset.started === 'true';
  if (started) return;
  startBtn.dataset.started = 'true';
  startBtn.textContent = 'Workout In Progress';
  startBtn.classList.add('opacity-70', 'cursor-default');
  statusBadge.textContent = 'In progress';
  statusBadge.classList.add('badge-xp');
  showToast('Workout started — log your sets as you go.');
});

addBtn?.addEventListener('click', () => {
  const exercise = exercisePool[poolIndex % exercisePool.length];
  poolIndex += 1;
  list.appendChild(buildExerciseCard(exercise));
  showToast(`${exercise.name} added to today's session.`);
});

finishBtn?.addEventListener('click', () => {
  const total = document.querySelectorAll('.exercise-card').length;
  statusBadge.textContent = 'Completed';
  statusBadge.classList.remove('badge-xp');
  statusBadge.classList.add('badge-achievement');
  startBtn.textContent = 'Start Workout';
  startBtn.dataset.started = 'false';
  startBtn.classList.remove('opacity-70', 'cursor-default');
  showToast(`Workout finished — ${total} exercises logged. +40 XP (demo).`);
});

// Toggle a set between "not done" (○) and "done" (●) — event delegation
// so this works for exercise cards added dynamically too.
list?.addEventListener('click', (e) => {
  const check = e.target.closest('.set-check');
  if (!check) return;
  const done = check.textContent === '●';
  check.textContent = done ? '○' : '●';
  check.classList.toggle('text-volt', !done);
  check.classList.toggle('text-mist-400', done);
});
