import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set RTL direction for Hebrew content
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'he';

createRoot(document.getElementById("root")!).render(<App />);
