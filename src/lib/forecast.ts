import type { Heure, Jour, Lieu, ModelId, Prevision, Resume } from '../types';
import { MODELES } from './models';
import { codeDominant } from './weathercode';

export const JOURS_MAX = 4; // J0 → J+3 (horizon ARPEGE sur /v1/meteofrance)
const VARS = ['temperature_2m', 'precipitation', 'wind_speed_10m', 'wind_gusts_10m', 'weather_code'] as const;
type Var = (typeof VARS)[number];
const TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 15_000;
const CACHE_PREFIX = 'wf.cache.v1.';

export function forecastUrl(l: Pick<Lieu, 'lat' | 'lon' | 'altitude'>): string {
  const p = new URLSearchParams({
    latitude: l.lat.toFixed(4),
    longitude: l.lon.toFixed(4),
    elevation: String(Math.round(l.altitude)),
    models: MODELES.join(','),
    hourly: VARS.join(','),
    timezone: 'auto',
    forecast_days: String(JOURS_MAX),
    wind_speed_unit: 'kmh',
  });
  return `https://api.open-meteo.com/v1/meteofrance?${p}`;
}

type Brut = { hourly?: Record<string, unknown> & { time?: unknown }; utc_offset_seconds?: number };

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Pour chaque heure : le modèle retenu est le plus fin qui fournit la température.
 *  Les autres variables viennent de ce modèle, sinon du suivant qui les fournit. */
export function parseHourly(raw: Brut): Heure[] {
  const h = raw.hourly;
  if (!h || !Array.isArray(h.time)) throw new Error('Réponse Open-Meteo invalide');
  const serie = (v: Var, m: ModelId): unknown[] => {
    const s = h[`${v}_${m}`] ?? (MODELES.length === 1 ? h[v] : undefined);
    return Array.isArray(s) ? s : [];
  };
  return (h.time as unknown[]).map((t, i) => {
    const modele = MODELES.find((m) => num(serie('temperature_2m', m)[i]) !== null) ?? null;
    const ordre = modele ? [modele, ...MODELES.filter((m) => m !== modele)] : MODELES;
    const pick = (v: Var) => {
      for (const m of ordre) {
        const x = num(serie(v, m)[i]);
        if (x !== null) return x;
      }
      return null;
    };
    return {
      time: String(t),
      temp: pick('temperature_2m'),
      pluie: pick('precipitation'),
      vent: pick('wind_speed_10m'),
      rafales: pick('wind_gusts_10m'),
      code: pick('weather_code'),
      modele,
    };
  });
}

const vals = (hs: Heure[], k: 'temp' | 'pluie' | 'vent') =>
  hs.map((x) => x[k]).filter((x): x is number => x !== null);

export function resumer(hs: Heure[]): Resume {
  const t = vals(hs, 'temp');
  const p = vals(hs, 'pluie');
  const v = vals(hs, 'vent');
  const modeles: ModelId[] = [];
  for (const x of hs) if (x.modele && !modeles.includes(x.modele)) modeles.push(x.modele);
  return {
    tmin: t.length ? Math.min(...t) : null,
    tmax: t.length ? Math.max(...t) : null,
    pluie: p.length ? Math.round(p.reduce((a, b) => a + b, 0) * 10) / 10 : null,
    ventMax: v.length ? Math.max(...v) : null,
    code: codeDominant(hs.map((x) => x.code)),
    modeles,
  };
}

export function grouperParJour(hs: Heure[]): Jour[] {
  const map = new Map<string, Heure[]>();
  for (const x of hs) {
    const d = x.time.slice(0, 10);
    map.set(d, [...(map.get(d) ?? []), x]);
  }
  return [...map.entries()]
    .slice(0, JOURS_MAX)
    .map(([date, heures]) => ({ date, heures, ...resumer(heures) }))
    .filter((j) => j.heures.some((x) => x.temp !== null));
}

/** Demi-journées : matin 06 h–12 h, après-midi 12 h–18 h (heure locale du lieu). */
export function demiJournees(j: Jour): { libelle: string; resume: Resume }[] {
  const h = (x: Heure) => Number(x.time.slice(11, 13));
  return [
    { libelle: 'Matin', resume: resumer(j.heures.filter((x) => h(x) >= 6 && h(x) < 12)) },
    { libelle: 'Après-midi', resume: resumer(j.heures.filter((x) => h(x) >= 12 && h(x) < 18)) },
  ];
}

function lireCache(key: string): Prevision | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const p = JSON.parse(raw) as Prevision;
    return Date.now() - p.recupereLe < TTL_MS && p.jours?.length ? p : null; // cache vide = ignoré
  } catch {
    return null;
  }
}

function ecrireCache(key: string, p: Prevision) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(p));
  } catch {
    /* quota ou stockage bloqué : on se passe du cache */
  }
}

export async function getForecast(l: Lieu, opts: { force?: boolean; signal?: AbortSignal } = {}): Promise<Prevision> {
  const url = forecastUrl(l);
  if (!opts.force) {
    const c = lireCache(url);
    if (c) return c;
  }
  const signal = opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS);
  const res = await fetch(url, { signal, referrerPolicy: 'no-referrer' }).catch((e: Error) => {
    throw new Error(e.name === 'TimeoutError' ? 'Open-Meteo : délai dépassé' : 'Open-Meteo : réseau indisponible');
  });
  const body = (await res.json().catch(() => ({}))) as Brut & { reason?: string };
  if (!res.ok) throw new Error(body.reason ? `Open-Meteo : ${body.reason}` : `Open-Meteo : erreur ${res.status}`);
  const p: Prevision = { jours: grouperParJour(parseHourly(body)), recupereLe: Date.now(), decalageS: num(body.utc_offset_seconds) ?? 0 };
  if (!p.jours.length) throw new Error('Aucune prévision disponible pour ce lieu (modèles Météo-France sans donnée).');
  ecrireCache(url, p);
  return p;
}

/** Heure locale du lieu au format "YYYY-MM-DDTHH" (comparable aux heures Open-Meteo). */
export const heureLocale = (decalageS: number, now = Date.now()) => new Date(now + decalageS * 1000).toISOString().slice(0, 13);
