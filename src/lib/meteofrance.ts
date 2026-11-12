import type { Lieu } from '../types';

export function slugifier(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Formats vérifiés le 2026-11-12 (HTTP 200) :
 *  - monde  : /meteo-monde/{slug}/{geonamesId}           (Toronto, Rovaniemi, Lappeenranta)
 *  - France : /previsions-meteo-france/{slug}/{code postal} (Lyon/69000, Le Grand-Bornand/74450)
 *  Le slug compte (un slug faux renvoie 404). Winnipeg/6183235 renvoie 404 : couverture incomplète du site. */
/** Lieux dont la page meteofrance.com renvoie 404 (vérifié) : lien masqué. Winnipeg : décision PO 2026-11-12. */
export const SANS_LIEN_METEOFRANCE = new Set<number>([6183235]);

export function meteoFranceUrl(l: Lieu): string | null {
  if (SANS_LIEN_METEOFRANCE.has(l.geonamesId)) return null;
  const slug = l.meteoFranceSlug ?? slugifier(l.nom);
  if (l.pays === 'FR') {
    return l.codePostal ? `https://meteofrance.com/previsions-meteo-france/${slug}/${l.codePostal}` : null;
  }
  return `https://meteofrance.com/meteo-monde/${slug}/${l.geonamesId}`;
}

/** Choix du code postal parmi ceux du géocodage : on écarte les CEDEX ; on préfère le code « xx000 »
 *  (Lyon : 69000 fonctionne, 69001 renvoie 404). */
export function choisirCodePostal(codes: string[] | undefined): string | undefined {
  const purs = (codes ?? []).filter((c) => /^\d{5}$/.test(c));
  return purs.find((c) => c.endsWith('000')) ?? purs[0];
}
