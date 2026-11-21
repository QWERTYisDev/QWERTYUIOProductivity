import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles.css';
import { unlockAudio } from './sound.ts';

for (const ev of ['touchend', 'click']) window.addEventListener(ev, unlockAudio, { once: true });

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
