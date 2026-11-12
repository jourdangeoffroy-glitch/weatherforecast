import { useEffect, useRef, useState } from 'react';
import type { Lieu } from '../types';
import { chercher, versLieu, type Resultat } from '../lib/geocoding';
import { depuisStation, SEUIL_MONTAGNE_M } from '../lib/lieux';
import { STATIONS } from '../lib/stations';
import { Icon } from './Icon';

type Props = { ouvert: boolean; existants: Lieu[]; onAjout: (l: Lieu) => void; onFermer: () => void };

export function Ajout({ ouvert, existants, onAjout, onFermer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [onglet, setOnglet] = useState<'ville' | 'station'>('ville');
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Resultat[]>([]);
  const [msg, setMsg] = useState('');
  const ids = new Set(existants.map((l) => l.id));

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);

  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); setMsg(''); return; }
    const ac = new AbortController();
    const t = setTimeout(() => {
      chercher(q.trim(), ac.signal)
        .then((r) => { setRes(r); setMsg(r.length ? '' : 'Aucun résultat.'); })
        .catch((e: Error) => { if (e.name !== 'AbortError') setMsg(e.message); });
    }, 350);
    return () => { clearTimeout(t); ac.abort(); };
  }, [q]);

  const ajouter = (l: Lieu) => { onAjout(l); setQ(''); onFermer(); };
  const stations = STATIONS.filter((s) => !ids.has(`gn-${s.geonamesId}`));

  return (
    <dialog ref={ref} className="dialog" onClose={onFermer} aria-labelledby="ajout-titre">
      <div className="dialog-tete">
        <h2 id="ajout-titre">Ajouter un lieu</h2>
        <button type="button" className="btn btn-icon" aria-label="Fermer" onClick={onFermer}><Icon name="close" /></button>
      </div>
      <div className="segment" role="tablist">
        <button type="button" role="tab" aria-selected={onglet === 'ville'} onClick={() => setOnglet('ville')}><Icon name="city" /> Ville</button>
        <button type="button" role="tab" aria-selected={onglet === 'station'} onClick={() => setOnglet('station')}><Icon name="landscape" /> Station</button>
      </div>

      {onglet === 'ville' ? (
        <div role="tabpanel">
          <label className="champ">
            <span className="caption">Nom de la ville</span>
            <span className="champ-input"><Icon name="search" />
              <input type="search" value={q} maxLength={80} autoFocus onChange={(e) => setQ(e.target.value)} placeholder="ex. Toronto" />
            </span>
          </label>
          <p className="caption muted">Catégorie auto : Montagne au-dessus de {SEUIL_MONTAGNE_M} m, modifiable ensuite.</p>
          {msg && <p className="caption muted" role="status">{msg}</p>}
          <ul className="resultats">
            {res.map((r) => {
              const deja = ids.has(`gn-${r.id}`);
              return (
                <li key={r.id}>
                  <button type="button" disabled={deja} onClick={() => ajouter(versLieu(r))}>
                    <span><strong>{r.name}</strong> <span className="muted">{[r.admin1, r.country].filter(Boolean).join(', ')}</span></span>
                    <span className="mono muted caption">{deja ? 'déjà ajouté' : `${Math.round(r.elevation ?? 0)} m`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div role="tabpanel">
          <p className="caption muted">Stations françaises de <code>data/stations.json</code> (liste enrichie à la main).</p>
          <ul className="resultats">
            {stations.length ? stations.map((s) => (
              <li key={s.snowForecastSlug}>
                <button type="button" onClick={() => ajouter(depuisStation(s))}>
                  <span><strong>{s.nom}</strong> <span className="muted">{s.departement}</span></span>
                  <span className="mono muted caption">{s.altitude.toLocaleString('fr-FR')} m</span>
                </button>
              </li>
            )) : <li className="muted caption">Toutes les stations de la liste sont déjà ajoutées.</li>}
          </ul>
        </div>
      )}
    </dialog>
  );
}
