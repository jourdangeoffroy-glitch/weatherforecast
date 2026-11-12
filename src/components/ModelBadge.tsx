import type { ModelId } from '../types';
import { LIBELLE_MODELE, RESOLUTION_MODELE } from '../lib/models';

export function ModelBadge({ modeles }: { modeles: ModelId[] }) {
  if (!modeles.length) return <span className="badge badge-muted">Modèle indisponible</span>;
  const titre = modeles.map((m) => `${LIBELLE_MODELE[m]} (${RESOLUTION_MODELE[m]})`).join(' puis ');
  return (
    <span className={`badge badge-${modeles[0]}`} title={`Modèle Météo-France : ${titre}`}>
      {modeles.map((m) => LIBELLE_MODELE[m]).join(' → ')}
    </span>
  );
}
