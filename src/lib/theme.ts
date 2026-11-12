export type Theme = 'light' | 'dark';
const KEY = 'wf.theme.v1';

/** Choix enregistré, sinon réglage de l'OS. */
export function themeCourant(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch { /* stockage bloqué */ }
  return matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function appliquerTheme(t: Theme) {
  document.documentElement.dataset.theme = t; // tokens Névé : :root[data-theme]
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#0F1A26' : '#EEF3F7'));
}

export function basculerTheme(t: Theme): Theme {
  const n: Theme = t === 'dark' ? 'light' : 'dark';
  appliquerTheme(n);
  try { localStorage.setItem(KEY, n); } catch { /* stockage bloqué */ }
  return n;
}
