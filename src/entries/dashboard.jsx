import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { UserProvider } from '../context/UserContext.jsx';
import { WorkoutProvider } from '../context/WorkoutContext.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import '../style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <WorkoutProvider>
        <Dashboard />
      </WorkoutProvider>
    </UserProvider>
  </StrictMode>
);
