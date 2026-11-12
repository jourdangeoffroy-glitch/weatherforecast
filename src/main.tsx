import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './neve/tokens.css';
import './app.css';
import App from './App';
import { appliquerTheme, themeCourant } from './lib/theme';

appliquerTheme(themeCourant()); // avant le 1er rendu : évite le flash de thème

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
