import { renderMarketingNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';

document.getElementById('navbar-mount').innerHTML = renderMarketingNavbar('');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();

const form = document.getElementById('register-form');
const password = document.getElementById('reg-password');
const confirm = document.getElementById('confirm-password');
const warning = document.getElementById('match-warning');

// Simple client-side UX check — purely visual, no real validation/auth in Experiment 1.
function checkMatch() {
  const mismatch = confirm.value.length > 0 && password.value !== confirm.value;
  warning.classList.toggle('hidden', !mismatch);
}
password?.addEventListener('input', checkMatch);
confirm?.addEventListener('input', checkMatch);

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (password.value !== confirm.value) {
    warning.classList.remove('hidden');
    return;
  }
  showToast('Demo only — account creation arrives once the backend is built.');
});
