import type { Categorie, Lieu } from '../types';
import { STATIONS, SLUGS_VALIDES, type Station } from './stations';

export const SEUIL_MONTAGNE_M = 1200;
const KEY = 'wf.lieux.v1';
export const MAX_LIEUX = 50;

export const categorieAuto = (altitude: number): Categorie => (altitude > SEUIL_MONTAGNE_M ? 'montagne' : 'ville');

export function depuisStation(s: Station): Lieu {
  return {
    id: `gn-${s.geonamesId}`,
    nom: s.nom,
    pays: 'FR',
    lat: s.lat,
    lon: s.lon,
    altitude: s.altitude,
    geonamesId: s.geonamesId,
    categorie: s.categorieForcee ?? categorieAuto(s.altitude),
    categorieManuelle: s.categorieForcee ? true : undefined,
    snowForecastResort: s.snowForecastSlug,
    codePostal: s.codePostal,
    meteoFranceSlug: s.meteoFranceSlug,
  };
}

const ville = (geonamesId: number, nom: string, pays: string, lat: number, lon: number, altitude: number, extra: Partial<Lieu> = {}): Lieu => ({
  id: `gn-${geonamesId}`, nom, pays, lat, lon, altitude, geonamesId, categorie: 'ville', ...extra,
});

/** Liste initiale (SPECS §5 bis). Coordonnées : Open-Meteo Geocoding, 2026-11-12. */
export const LISTE_INITIALE: Lieu[] = [
  ville(2996944, 'Lyon', 'FR', 45.74906, 4.84789, 173, { codePostal: '69000' }),
  ville(6183235, 'Winnipeg', 'CA', 49.8844, -97.14704, 245),
  ville(638936, 'Rovaniemi', 'FI', 66.49897, 25.68867, 90),
  ville(648900, 'Lappeenranta', 'FI', 61.05871, 28.18871, 104),
  ...STATIONS.map(depuisStation),
];

// ---------- Validation (import JSON et localStorage : données non fiables) ----------
const str = (v: unknown, max: number, re?: RegExp): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max && (!re || re.test(v));
const nb = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export function validerLieu(v: unknown): Lieu | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!str(o.id, 40, /^[A-Za-z0-9_-]+$/)) return null;
  if (!str(o.nom, 80)) return null;
  if (!str(o.pays, 2, /^[A-Z]{2}$/)) return null;
  if (!nb(o.lat, -90, 90) || !nb(o.lon, -180, 180) || !nb(o.altitude, -500, 9000)) return null;
  if (!nb(o.geonamesId, 1, 1e10) || !Number.isInteger(o.geonamesId)) return null;
  if (o.categorie !== 'ville' && o.categorie !== 'montagne') return null;
  const l: Lieu = {
    id: o.id, nom: o.nom, pays: o.pays, lat: o.lat, lon: o.lon, altitude: o.altitude,
    geonamesId: o.geonamesId, categorie: o.categorie,
  };
  if (o.categorieManuelle === true) l.categorieManuelle = true;
  // Slug Snow-Forecast : seulement ceux de data/stations.json (pas d'URL arbitraire dans l'iframe).
  if (typeof o.snowForecastResort === 'string' && SLUGS_VALIDES.has(o.snowForecastResort)) l.snowForecastResort = o.snowForecastResort;
  if (str(o.codePostal, 5, /^\d{5}$/)) l.codePostal = o.codePostal;
  if (str(o.meteoFranceSlug, 80, /^[a-z0-9-]+$/)) l.meteoFranceSlug = o.meteoFranceSlug;
  return l;
}

export function validerListe(v: unknown): Lieu[] {
  const arr = Array.isArray(v) ? v : v && typeof v === 'object' ? (v as { lieux?: unknown }).lieux : null;
  if (!Array.isArray(arr)) throw new Error('Format invalide : tableau « lieux » attendu.');
  if (arr.length > MAX_LIEUX) throw new Error(`Trop de lieux (max ${MAX_LIEUX}).`);
  const ok: Lieu[] = [];
  for (const x of arr) {
    const l = validerLieu(x);
    if (l && !ok.some((y) => y.id === l.id)) ok.push(l);
  }
  if (arr.length && !ok.length) throw new Error('Aucun lieu valide dans le fichier.');
  return ok;
}

export function charger(): Lieu[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) return validerListe(JSON.parse(raw));
  } catch {
    /* stockage indisponible ou corrompu : liste initiale */
  }
  return LISTE_INITIALE;
}

export function sauver(lieux: Lieu[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lieux));
  } catch {
    /* navigation privée / stockage bloqué : la liste reste en mémoire */
  }
}

export const exporter = (lieux: Lieu[]) =>
  JSON.stringify({ app: 'weatherforecast', version: 1, exporteLe: new Date().toISOString(), lieux }, null, 2);
