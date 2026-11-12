import type { Categorie, Lieu } from '../types';
import type { Etat } from '../App';
import { Carte } from './Carte';
import { Icon } from './Icon';

const SECTIONS: { cat: Categorie; titre: string; icon: 'city' | 'landscape' }[] = [
  { cat: 'ville', titre: 'Villes', icon: 'city' },
  { cat: 'montagne', titre: 'Montagne', icon: 'landscape' },
];

export function Accueil({ lieux, etats }: { lieux: Lieu[]; etats: Record<string, Etat> }) {
  if (!lieux.length) return <p className="vide">Aucun lieu. Ajoutez-en un avec « Ajouter ».</p>;
  return (
    <>
      {SECTIONS.map(({ cat, titre, icon }) => {
        const ls = lieux.filter((l) => l.categorie === cat);
        if (!ls.length) return null;
        return (
          <section key={cat} aria-labelledby={`s-${cat}`}>
            <h2 id={`s-${cat}`} className="section-titre"><Icon name={icon} /> {titre} <span className="muted mono">{ls.length}</span></h2>
            <div className="grille">
              {ls.map((l) => <Carte key={l.id} lieu={l} etat={etats[l.id]} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
