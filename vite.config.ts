/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// CSP injectée uniquement au build (le serveur de dev Vite a besoin de scripts inline).
// GitHub Pages ne permet pas d'en-têtes HTTP : la CSP passe par <meta> (frame-ancestors non supporté ainsi).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src https://api.open-meteo.com https://geocoding-api.open-meteo.com",
  "frame-src https://www.snow-forecast.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const csp = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${CSP}">`),
});

export default defineConfig({
  base: '/weatherforecast/',
  plugins: [react(), csp()],
  build: { assetsInlineLimit: 0 },
  test: { environment: 'jsdom' },
});
