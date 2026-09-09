import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { UserProvider } from '../context/UserContext.jsx';
import { WorkoutProvider } from '../context/WorkoutContext.jsx';
import Home from '../pages/Home.jsx';
import '../style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <WorkoutProvider>
        <Home />
      </WorkoutProvider>
    </UserProvider>
  </StrictMode>
);
