import type { Lieu } from '../types';
import type { Etat } from '../App';
import { MeteoIcon, Icon } from './Icon';
import { ModelBadge } from './ModelBadge';
import { kmh, mm, temp } from './format';

export function Carte({ lieu, etat }: { lieu: Lieu; etat: Etat | undefined }) {
  const j = etat?.prevision?.jours[0];
  return (
    <a className="carte" href={`#/lieu/${encodeURIComponent(lieu.id)}`}>
      <div className="carte-tete">
        <div>
          <h3>{lieu.nom}</h3>
          <span className="muted caption">{lieu.pays}{lieu.categorie === 'montagne' ? ` · ${lieu.altitude.toLocaleString('fr-FR')} m` : ''}</span>
        </div>
        {j && <MeteoIcon code={j.code} className="icon-meteo" />}
      </div>
      {j ? (
        <>
          <div className="temps mono">
            <span className="tmax">{temp(j.tmax)}</span>
            <span className="tmin">{temp(j.tmin)}</span>
          </div>
          <div className="mesures mono">
            <span><Icon name="drop" /> {mm(j.pluie)}</span>
            <span><Icon name="air" /> {kmh(j.ventMax)}</span>
          </div>
          <ModelBadge modeles={j.modeles} />
        </>
      ) : etat?.erreur ? (
        <p className="erreur caption">{etat.erreur}</p>
      ) : (
        <p className="muted caption">Chargement…</p>
      )}
    </a>
  );
}
