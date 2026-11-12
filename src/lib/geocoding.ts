import type { Lieu } from '../types';
import { categorieAuto } from './lieux';
import { choisirCodePostal } from './meteofrance';

export type Resultat = {
  id: number; name: string; latitude: number; longitude: number; elevation?: number;
  country_code?: string; country?: string; admin1?: string; postcodes?: string[];
};

export async function chercher(q: string, signal?: AbortSignal): Promise<Resultat[]> {
  const p = new URLSearchParams({ name: q.slice(0, 80), count: '8', language: 'fr', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${p}`, { signal, referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error(`Géocodage : erreur ${res.status}`);
  const body = (await res.json()) as { results?: Resultat[] };
  return (body.results ?? []).filter((r) => Number.isInteger(r.id) && typeof r.latitude === 'number');
}

export function versLieu(r: Resultat): Lieu {
  const altitude = Math.round(r.elevation ?? 0);
  const pays = (r.country_code ?? '').toUpperCase();
  return {
    id: `gn-${r.id}`,
    nom: r.name.slice(0, 80),
    pays: /^[A-Z]{2}$/.test(pays) ? pays : 'ZZ',
    lat: r.latitude,
    lon: r.longitude,
    altitude,
    geonamesId: r.id,
    categorie: categorieAuto(altitude),
    codePostal: pays === 'FR' ? choisirCodePostal(r.postcodes) : undefined,
  };
}
