import sunny from '@material-symbols/svg-400/rounded/sunny.svg?raw';
import partly from '@material-symbols/svg-400/rounded/partly_cloudy_day.svg?raw';
import cloud from '@material-symbols/svg-400/rounded/cloud.svg?raw';
import foggy from '@material-symbols/svg-400/rounded/foggy.svg?raw';
import rainyLight from '@material-symbols/svg-400/rounded/rainy_light.svg?raw';
import rainy from '@material-symbols/svg-400/rounded/rainy.svg?raw';
import snowy from '@material-symbols/svg-400/rounded/weather_snowy.svg?raw';
import mix from '@material-symbols/svg-400/rounded/weather_mix.svg?raw';
import storm from '@material-symbols/svg-400/rounded/thunderstorm.svg?raw';

type Desc = { libelle: string; svg: string; gravite: number };

/** Codes météo WMO (doc Open-Meteo). Gravité : sert à choisir l'icône d'une période. */
export function decrire(code: number | null): Desc {
  switch (code) {
    case 0: return { libelle: 'Ensoleillé', svg: sunny, gravite: 0 };
    case 1: return { libelle: 'Peu nuageux', svg: partly, gravite: 1 };
    case 2: return { libelle: 'Partiellement nuageux', svg: partly, gravite: 2 };
    case 3: return { libelle: 'Couvert', svg: cloud, gravite: 3 };
    case 45: case 48: return { libelle: 'Brouillard', svg: foggy, gravite: 4 };
    case 51: case 53: case 55: return { libelle: 'Bruine', svg: rainyLight, gravite: 5 };
    case 56: case 57: return { libelle: 'Bruine verglaçante', svg: mix, gravite: 7 };
    case 61: case 80: return { libelle: 'Pluie faible', svg: rainyLight, gravite: 6 };
    case 63: case 81: return { libelle: 'Pluie', svg: rainy, gravite: 7 };
    case 65: case 82: return { libelle: 'Forte pluie', svg: rainy, gravite: 8 };
    case 66: case 67: return { libelle: 'Pluie verglaçante', svg: mix, gravite: 9 };
    case 71: case 85: return { libelle: 'Neige faible', svg: snowy, gravite: 7 };
    case 73: return { libelle: 'Neige', svg: snowy, gravite: 8 };
    case 75: case 86: return { libelle: 'Forte neige', svg: snowy, gravite: 9 };
    case 77: return { libelle: 'Grains de neige', svg: snowy, gravite: 7 };
    case 95: return { libelle: 'Orage', svg: storm, gravite: 10 };
    case 96: case 99: return { libelle: 'Orage avec grêle', svg: storm, gravite: 11 };
    default: return { libelle: 'Inconnu', svg: cloud, gravite: -1 };
  }
}

/** Code représentatif d'une période : le plus grave présent au moins 2 h (ou 1 h si période courte),
 *  pour qu'une averse isolée ne colore pas toute la journée. */
export function codeDominant(codes: (number | null)[]): number | null {
  const cs = codes.filter((c): c is number => c !== null);
  if (!cs.length) return null;
  const seuil = cs.length >= 6 ? 2 : 1;
  const compte = new Map<number, number>();
  for (const c of cs) compte.set(c, (compte.get(c) ?? 0) + 1);
  const retenus = [...compte.entries()].filter(([, n]) => n >= seuil).map(([c]) => c);
  const pool = retenus.length ? retenus : cs;
  return pool.reduce((a, b) => (decrire(b).gravite > decrire(a).gravite ? b : a));
}
