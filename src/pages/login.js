import { renderMarketingNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';

document.getElementById('navbar-mount').innerHTML = renderMarketingNavbar('');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();

// Frontend-only demo: prevent the real submit (there is no backend yet in Experiment 1)
// and show a toast so the interaction still feels alive.
document.getElementById('login-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('Demo only — authentication arrives in a later experiment.');
});

document.getElementById('forgot-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Password reset isn\u2019t wired up yet — Experiment 1 is UI only.');
});
