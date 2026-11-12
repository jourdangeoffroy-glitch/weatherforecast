import type { Categorie, Heure, Lieu, Resume } from '../types';
import type { Etat } from '../App';
import { demiJournees, heureLocale, JOURS_MAX } from '../lib/forecast';
import { meteoFranceUrl } from '../lib/meteofrance';
import { snowForecastFeedUrl, snowForecastPageUrl } from '../lib/stations';
import { Icon, MeteoIcon } from './Icon';
import { ModelBadge } from './ModelBadge';
import { altitude, heure, jour, kmh, mm, temp } from './format';

type Props = {
  lieu: Lieu;
  etat: Etat | undefined;
  onCategorie: (c: Categorie) => void;
  onSupprimer: () => void;
};

const Ligne = ({ label, r, h }: { label: string; r: Resume | Heure; h?: boolean }) => {
  const isH = 'temp' in r;
  return (
    <li className="ligne">
      <span className="ligne-label mono">{label}</span>
      <MeteoIcon code={r.code} />
      <span className="mono ligne-temp">
        {isH ? temp(r.temp) : <>{temp(r.tmax)} <span className="muted">{temp(r.tmin)}</span></>}
      </span>
      <span className="mono"><Icon name="drop" /> {mm(r.pluie)}</span>
      <span className="mono"><Icon name="air" /> {kmh(isH ? r.vent : r.ventMax)}</span>
      {!h && !isH && <ModelBadge modeles={r.modeles} />}
    </li>
  );
};

export function Detail({ lieu, etat, onCategorie, onSupprimer }: Props) {
  const p = etat?.prevision;
  const mf = meteoFranceUrl(lieu);
  const sf = lieu.categorie === 'montagne' && lieu.snowForecastResort ? snowForecastFeedUrl(lieu.snowForecastResort) : null;
  const maintenant = p ? heureLocale(p.decalageS) : '';
  const [j0, ...suite] = p?.jours ?? [];
  const heuresJ0 = j0 ? j0.heures.filter((h) => h.time.slice(0, 13) >= maintenant && h.temp !== null) : [];

  return (
    <article className="detail">
      <a className="btn btn-ghost" href="#/"><Icon name="back" /> Retour</a>
      <header className="detail-tete">
        <div>
          <h1>{lieu.nom}</h1>
          <p className="muted mono caption">{lieu.pays} · {altitude(lieu.altitude)} · {lieu.lat.toFixed(2)}, {lieu.lon.toFixed(2)}</p>
        </div>
        <div className="segment" role="group" aria-label="Catégorie">
          {(['ville', 'montagne'] as const).map((c) => (
            <button key={c} type="button" aria-pressed={lieu.categorie === c} onClick={() => onCategorie(c)}>
              <Icon name={c === 'ville' ? 'city' : 'landscape'} /> {c === 'ville' ? 'Ville' : 'Montagne'}
            </button>
          ))}
        </div>
      </header>

      {etat?.erreur && <p className="erreur">{etat.erreur}</p>}
      {!p && !etat?.erreur && <p className="muted">Chargement…</p>}

      {j0 && (
        <section className="bloc" aria-labelledby="h-j0">
          <div className="bloc-tete">
            <h2 id="h-j0">Aujourd'hui · {jour(j0.date)}</h2>
            <ModelBadge modeles={j0.modeles} />
          </div>
          <p className="caption muted">Heure par heure, heure locale du lieu.</p>
          <ul className="lignes">
            {heuresJ0.length
              ? heuresJ0.map((h) => <Ligne key={h.time} label={heure(h.time)} r={h} h />)
              : <li className="muted">Plus d'heures prévues aujourd'hui.</li>}
          </ul>
        </section>
      )}

      {suite.map((j) => (
        <section className="bloc" key={j.date} aria-label={jour(j.date, true)}>
          <div className="bloc-tete">
            <h2>{jour(j.date, true)}</h2>
            <ModelBadge modeles={j.modeles} />
          </div>
          <ul className="lignes">
            {demiJournees(j).map((d) => <Ligne key={d.libelle} label={d.libelle} r={d.resume} h />)}
          </ul>
        </section>
      ))}

      {sf && (
        <section className="bloc" aria-labelledby="h-sf">
          <h2 id="h-sf">Snow-Forecast · {lieu.snowForecastResort}</h2>
          <iframe
            className="sf"
            src={sf}
            title={`Prévisions Snow-Forecast ${lieu.nom}`}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <a href={snowForecastPageUrl(lieu.snowForecastResort!)} target="_blank" rel="noopener noreferrer">
            snow-forecast.com <Icon name="ext" />
          </a>
        </section>
      )}
      {lieu.categorie === 'montagne' && !sf && (
        <p className="caption muted">Pas de station Snow-Forecast associée : météo Open-Meteo seule.</p>
      )}

      <section className="bloc">
        {mf ? (
          <a className="btn btn-primary" href={mf} target="_blank" rel="noopener noreferrer">
            Voir sur Météo-France <Icon name="ext" />
          </a>
        ) : (
          <p className="caption muted">Lien Météo-France indisponible (code postal inconnu).</p>
        )}
        <p className="caption muted">
          Horizon de l'app : {JOURS_MAX} jours (modèles bruts). Météo-France publie jusqu'à 15 jours, avec une prévision
          retravaillée : quelques °C d'écart possibles.
        </p>
      </section>

      <button type="button" className="btn btn-danger" onClick={onSupprimer}><Icon name="del" /> Supprimer ce lieu</button>
    </article>
  );
}
