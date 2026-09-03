import NavbarMarketing from './NavbarMarketing.jsx';
import NavbarApp from './NavbarApp.jsx';
import Footer from './Footer.jsx';

// Every page is <Layout nav="marketing" active="home">...page content...</Layout>.
// This replaces the navbar-mount / footer-mount DOM injection from Experiment 1
// with a normal React composition pattern.
export default function Layout({ nav = 'marketing', active = '', children }) {
  return (
    <>
      {nav === 'app' ? <NavbarApp active={active} /> : <NavbarMarketing active={active} />}
      {children}
      <Footer />
    </>
  );
}
