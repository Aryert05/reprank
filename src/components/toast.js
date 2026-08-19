// Experiment 1 has no backend, so actions like "Join Challenge" or "Log in" can't
// actually do anything yet. Rather than let buttons feel dead, this shows a small
// toast confirming the click was registered — a placeholder for real logic in later experiments.
export function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className =
    'pointer-events-none flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800 ' +
    'px-4 py-3 text-sm font-medium text-mist-100 shadow-card opacity-0 translate-y-2 transition-all duration-200';
  toast.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-volt"></span>${message}`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}
