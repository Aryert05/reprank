import { renderAppNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

document.getElementById('navbar-mount').innerHTML = renderAppNavbar('dashboard');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();
