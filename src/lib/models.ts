import type { ModelId } from '../types';

/** Ordre de priorité : le plus fin d'abord. Un modèle hors de son domaine renvoie null. */
export const MODELES: ModelId[] = ['arome_france_hd', 'arpege_europe', 'arpege_world'];

export const LIBELLE_MODELE: Record<ModelId, string> = {
  arome_france_hd: 'AROME HD',
  arpege_europe: 'ARPEGE Europe',
  arpege_world: 'ARPEGE Monde',
};

export const RESOLUTION_MODELE: Record<ModelId, string> = {
  arome_france_hd: '1,5 km',
  arpege_europe: '≈ 11 km',
  arpege_world: '≈ 25 km',
};

export function libelleModeles(m: ModelId[]): string {
  return m.length ? m.map((x) => LIBELLE_MODELE[x]).join(' → ') : 'Indisponible';
}
