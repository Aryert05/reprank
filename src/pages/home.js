import { renderMarketingNavbar, mountNavbarBehavior } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

document.getElementById('navbar-mount').innerHTML = renderMarketingNavbar('home');
document.getElementById('footer-mount').innerHTML = renderFooter();
mountNavbarBehavior();
