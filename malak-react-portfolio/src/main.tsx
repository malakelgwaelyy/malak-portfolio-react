import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './enhancements.css';
import './language.css';
import './performance.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
