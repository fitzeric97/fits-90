import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx loading...');

// Add Capacitor-specific debugging
if ((window as any).Capacitor) {
  console.log('Running in Capacitor native app');
  console.log('Platform:', (window as any).Capacitor.getPlatform());
} else {
  console.log('Running in web browser');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="background: red; color: white; padding: 20px; font-size: 24px;">ROOT ELEMENT MISSING</div>';
} else {
  console.log('Creating React root...');
  const root = createRoot(rootElement);
  console.log('Rendering App...');
  root.render(<App />);
  console.log('App rendered successfully');
}


