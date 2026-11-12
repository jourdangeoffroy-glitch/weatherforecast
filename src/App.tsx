import { useCallback, useEffect, useRef, useState } from 'react';
import type { Categorie, Lieu, Prevision } from './types';
import { charger, exporter, sauver, validerListe } from './lib/lieux';
import { getForecast } from './lib/forecast';
import { Accueil } from './components/Accueil';
import { Detail } from './components/Detail';
import { Ajout } from './components/Ajout';
import { Icon } from './components/Icon';

export type Etat = { prevision?: Prevision; erreur?: string };

const routeId = () => {
  const m = /^#\/lieu\/([^/]+)$/.exec(location.hash);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function App() {
  const [lieux, setLieux] = useState<Lieu[]>(charger);
  const [etats, setEtats] = useState<Record<string, Etat>>({});
  const [id, setId] = useState(routeId);
  const [ajout, setAjout] = useState(false);
  const [info, setInfo] = useState('');
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => sauver(lieux), [lieux]);
  useEffect(() => {
    const f = () => { setId(routeId()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  const charge = useCallback((ls: Lieu[], force = false) => {
    for (const l of ls) {
      getForecast(l, { force })
        .then((p) => setEtats((e) => ({ ...e, [l.id]: { prevision: p } })))
        .catch((err: Error) => setEtats((e) => ({ ...e, [l.id]: { ...e[l.id], erreur: err.message } })));
    }
  }, []);
  useEffect(() => charge(lieux.filter((l) => !etats[l.id])), [lieux]); // eslint-disable-line react-hooks/exhaustive-deps

  const maj = (lid: string, patch: Partial<Lieu>) => setLieux((ls) => ls.map((l) => (l.id === lid ? { ...l, ...patch } : l)));

  const telecharger = () => {
    const url = URL.createObjectURL(new Blob([exporter(lieux)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `lieux-meteo-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const importer = async (f: File | undefined) => {
    if (!f) return;
    try {
      if (f.size > 100_000) throw new Error('Fichier trop volumineux (max 100 Ko).');
      const ls = validerListe(JSON.parse(await f.text()));
      if (!confirm(`Remplacer vos ${lieux.length} lieux par les ${ls.length} du fichier ?`)) return;
      setEtats({});
      setLieux(ls);
      setInfo(`${ls.length} lieux importés.`);
    } catch (e) {
      setInfo(e instanceof SyntaxError ? 'Fichier JSON illisible.' : (e as Error).message);
    } finally {
      if (fichier.current) fichier.current.value = '';
    }
  };

  const lieu = id ? lieux.find((l) => l.id === id) : undefined;

  return (
    <>
      <header className="app-header">
        <a href="#/" className="marque">Météo des lieux</a>
        <div className="actions">
          <button type="button" className="btn btn-icon" aria-label="Actualiser" title="Actualiser" onClick={() => { setEtats({}); charge(lieux, true); }}><Icon name="refresh" /></button>
          <button type="button" className="btn btn-icon" aria-label="Exporter les lieux (JSON)" title="Exporter" onClick={telecharger}><Icon name="download" /></button>
          <button type="button" className="btn btn-icon" aria-label="Importer des lieux (JSON)" title="Importer" onClick={() => fichier.current?.click()}><Icon name="upload" /></button>
          <input ref={fichier} type="file" accept="application/json,.json" hidden onChange={(e) => importer(e.target.files?.[0])} />
          <button type="button" className="btn btn-primary" onClick={() => setAjout(true)}><Icon name="add" /> <span className="lg">Ajouter</span></button>
        </div>
      </header>
      <main className="container">
        {info && <p className="info" role="status" onClick={() => setInfo('')}>{info}</p>}
        {id && lieu ? (
          <Detail
            lieu={lieu}
            etat={etats[lieu.id]}
            onCategorie={(c: Categorie) => maj(lieu.id, { categorie: c, categorieManuelle: true })}
            onSupprimer={() => {
              if (!confirm(`Supprimer ${lieu.nom} ?`)) return;
              setLieux((ls) => ls.filter((l) => l.id !== lieu.id));
              location.hash = '#/';
            }}
          />
        ) : id ? (
          <p>Lieu introuvable. <a href="#/">Retour à l'accueil</a></p>
        ) : (
          <Accueil lieux={lieux} etats={etats} />
        )}
      </main>
      <footer className="container pied caption muted">
        Données <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> (CC BY 4.0) —
        modèles Météo-France AROME / ARPEGE. Widgets montagne :{' '}
        <a href="https://www.snow-forecast.com/" target="_blank" rel="noopener noreferrer">snow-forecast.com</a>.
      </footer>
      <Ajout ouvert={ajout} existants={lieux} onAjout={(l) => setLieux((ls) => [...ls, l])} onFermer={() => setAjout(false)} />
    </>
  );
}
