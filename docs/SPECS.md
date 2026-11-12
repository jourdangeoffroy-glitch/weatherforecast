# Spécifications — WeatherForecast

> **Statut** : v0.8 — prête pour le développement de rédaction avec le PO
> **Dernière mise à jour** : 2026-11-12
> **Règle** : reflète en continu l'état réel de l'application (synchronisé avec `CADRAGE.md`).

## 1. Architecture (proposition)
- **TypeScript + React + Vite** → build statique, hébergé sans backend.
- Appels Open-Meteo directement depuis le navigateur (sans clé).
- Couche `provider` : `getForecast(lieu)`, `modelForDay(lieu, jour)`, `sourceUrl(lieu)`, `maxDays`.
- Persistance des lieux : `localStorage` (usage mono-utilisateur).
- Ajout de lieu : API de géocodage Open-Meteo (renvoie pays, altitude et **identifiant GeoNames** ⇒ catégorie et lien meteofrance.com déduits automatiquement).

## 2. Modèle de données
```ts
type Lieu = {
  id: string; nom: string; pays: string;          // ISO-3166 alpha-2
  lat: number; lon: number; altitude: number;
  geonamesId: number;                              // sert à l'URL meteofrance.com (Toronto = 6167865)
  categorie: 'ville' | 'montagne';                 // auto : altitude > 1200 m à l'ajout
  categorieManuelle?: boolean;                     // true si l'utilisateur l'a modifiée
  snowForecastResort?: string;                     // id station, si montagne
};
```

## 3. Accueil (F1, F2, F3)
- Sections **Villes** / **Montagne**.
- Carte : nom, icône (Material Symbols, jamais d'emoji), T° min/max, cumul pluie (mm), vent (km/h), badge modèle.
- Unités : °C, km/h, mm. Langue : français.

## 4. Détail (F4, F5, F6)
- J0 : pas **horaire**.
- J+1 → horizon : **demi-journée** (matin / après-midi).
- Badge modèle **par jour** (AROME HD → ARPEGE ; hors Europe : ARPEGE World). Horizon : J0 → J+3.
- Lien source : meteofrance.com.
  - Hors France : `https://meteofrance.com/meteo-monde/{slug}/{geonamesId}` (format confirmé par l'exemple Toronto). Le rôle exact du slug reste à vérifier.
  - France : format d'URL **à vérifier** (probablement `/previsions-meteo-france/{ville}/{code postal}`).
- Changement de catégorie Villes ↔ Montagne depuis le détail (ou la liste).
- Montagne : widget Snow-Forecast (station associée) dans une iframe `sandbox`.
- Ajout d'un lieu Montagne : choisi dans `data/stations.json` (stations françaises, enrichi à la main). Ajout refusé si la station n'y est pas.
  - Slugs vérifiés dans le sitemap Snow-Forecast le 2026-11-12. `Les-Arcs` couvre tout le domaine (pas de slug propre à Arc 1800).

## 5. Sources par zone
Endpoint unique : Open-Meteo `/v1/meteofrance`, modèle demandé explicitement.

| Zone | Modèle (`models=`) | Horizon |
|------|--------------------|---------|
| Domaine AROME (France + voisins) | `arome_france_hd` J0–J+1, puis `arpege_europe` | 4 j |
| Domaine ARPEGE Europe (ex. Finlande) | `arpege_europe` | 4 j |
| Ailleurs (ex. Winnipeg) | `arpege_world` | 4 j |

Limites des domaines AROME / ARPEGE Europe : **à vérifier** pour l'attribution automatique.

Attribution : « Données Open-Meteo (CC BY 4.0) — modèle X ». Cache local (ex. 30 min) pour rester sous 10 000 appels/j.

## 5 bis. Liste initiale
| Lieu | Pays | Catégorie | Modèle attendu | Remarque |
|------|------|-----------|----------------|----------|
| Lyon | FR | Ville | AROME HD → ARPEGE | |
| Winnipeg | CA | Ville | ARPEGE World | |
| Rovaniemi | FI | Ville (décision PO, malgré la station Ounasvaara) | ARPEGE Europe | |
| Lappeenranta | FI | Ville | ARPEGE Europe | |
| Le Grand-Bornand | FR | Montagne (forcée) | AROME HD → ARPEGE | village 919 m < 1 200 m |
| Les Deux Alpes | FR | Montagne | AROME HD → ARPEGE | 1 650 m |
| Arc 1800 | FR | Montagne | AROME HD → ARPEGE | 1 800 m ; widget `Les-Arcs` |

## 6. Non-fonctionnel
- Responsive **mobile d'abord** : 1 colonne < 600 px, 2 colonnes 600–1023 px, 3–4 colonnes ≥ 1 024 px (tokens Névé v0.3).
- Hébergement : GitHub Pages via GitHub Actions (build Vite, `base: '/weatherforecast/'`).
- Rafraîchissement : à définir.

## 7. Design system (Névé)
- Réutilisable tel quel : `tokens.css`, polices, icônes, couleurs, rayons, `.mono` pour les chiffres.
- **Adapté (v0.3, 2026-11-12)** : en-tête web `.app-header` (56 px) à la place de la barre de titre Electron ; `.container` responsive (marges 16/24/32 px) ; zones sûres iPhone ; cibles tactiles 44 px ; typo réduite < 600 px ; thème sombre via `prefers-color-scheme` / `data-theme` ; sélection de texte réactivée.
- Non modifié : la page canvas « Design System Montagne » (maquettes), qui peut encore montrer un cadre de fenêtre desktop.

## 8. Sécurité
- CSP stricte ; seuls domaines autorisés : `api.open-meteo.com`, `geocoding-api.open-meteo.com`, snow-forecast.com (iframe).
- Liens externes : `rel="noopener noreferrer"`.
- `security-audit` avant chaque merge et chaque mise en production.

## 9. Questions ouvertes
1. À vérifier en dev : format d'URL meteofrance.com pour les villes françaises ; limites des domaines AROME / ARPEGE Europe.
- Tranché : V1 100 % Météo-France ; liste initiale de 7 lieux (§5 bis) ; stations françaises uniquement, liste manuelle (`data/stations.json`).
- Tranché : stockage `localStorage` + export/import JSON (V1) ; synchro type Turso plus tard (nécessitera une authentification car l'URL est publique).

## 10. Historique
| Date | Version | Changement |
|------|---------|-----------|
| 2026-11-12 | 0.1 | Création squelette cadrage + specs |
| 2026-11-12 | 0.2 | Intégration des recommandations de sources |
| 2026-11-12 | 0.3 | Passage en app web, découpage des modèles France, Snow-Forecast, F7 |
| 2026-11-12 | 0.4 | DS adapté au web, responsive, repo public + GitHub Pages, lien meteofrance.com pour tous, catégorie modifiable |
| 2026-11-12 | 0.5 | V1 100 % Météo-France (4 j), liste initiale, export/import, vérification Snow-Forecast |
| 2026-11-12 | 0.6 | Liste des stations générée depuis le sitemap Snow-Forecast (sous réserve CGU) |
| 2026-11-12 | 0.8 | Liste manuelle des stations (3 stations), specs prêtes pour le dev |
| 2026-11-12 | 0.7.1 | Stations limitées à la France ; jeu data.gouv.fr Nice Côte d'Azur écarté |
| 2026-11-12 | 0.7 | CGU + sitemap Snow-Forecast vérifiés, Rovaniemi = Ville, environnement réseau « weatherforecast » créé |
