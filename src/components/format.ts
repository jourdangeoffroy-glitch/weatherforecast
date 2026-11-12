const r = (x: number) => Math.round(x);
export const temp = (x: number | null) => (x === null ? '–' : `${r(x)}°`);
export const mm = (x: number | null) => (x === null ? '–' : `${x.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mm`);
export const kmh = (x: number | null) => (x === null ? '–' : `${r(x)} km/h`);
export const altitude = (x: number) => `${x.toLocaleString('fr-FR')} m`;

/** "2026-11-12" → "jeu. 12 nov." (date locale du lieu, sans décalage navigateur). */
export function jour(date: string, long = false): string {
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: long ? 'long' : 'short', day: 'numeric', month: 'short' });
}
export const heure = (iso: string) => `${iso.slice(11, 13)} h`;
