import { renderAppNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';

document.getElementById('navbar-mount').innerHTML = renderAppNavbar('');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();

document.getElementById('edit-profile')?.addEventListener('click', () => {
  showToast('Profile editing is a later experiment — this is a static demo for now.');
});
