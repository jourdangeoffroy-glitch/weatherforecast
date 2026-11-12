# Spécifications — WeatherForecast

> **Statut** : v1.1 — en production : https://jourdangeoffroy-glitch.github.io/weatherforecast/
> **Dernière mise à jour** : 2026-11-12 (v1.1 en production)
> **Règle** : reflète en continu l'état réel de l'application (synchronisé avec `CADRAGE.md`).

## 1. Architecture (implémentée)
- **TypeScript + React + Vite** → build statique, hébergé sans backend.
- Appels Open-Meteo directement depuis le navigateur (sans clé).
- `src/lib/forecast.ts` : `getForecast`, `parseHourly`, `grouperParJour`, `demiJournees`, `JOURS_MAX = 4`. `src/lib/meteofrance.ts` : `meteoFranceUrl`. `src/lib/lieux.ts` : liste initiale, validation, stockage. `src/lib/stations.ts` : Snow-Forecast.
- Navigation par hash (`#/`, `#/lieu/{id}`) : compatible GitHub Pages sans réécriture d'URL.
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
  snowForecastResort?: string;                     // slug Snow-Forecast, doit exister dans data/stations.json
  codePostal?: string;                             // URL meteofrance.com en France
  meteoFranceSlug?: string;                        // surcharge du slug (ex. Arc 1800 → bourg-saint-maurice)
};
```

## 3. Accueil (F1, F2, F3)
- Sections **Villes** / **Montagne**.
- Carte : nom, icône (Material Symbols, jamais d'emoji), T° min/max, cumul pluie (mm), vent (km/h), badge modèle.
- Unités : °C, km/h, mm. Langue : français.
- Nom affiché (en-tête + `<title>`) : **Dashboard météo de Geoffroy**.
- Icône météo : légende au survol (tooltip CSS `data-tip`, libellé WMO de `weathercode.ts`) ; `aria-label` conservé pour les lecteurs d'écran.
- Thème : bouton soleil/lune dans l'en-tête ; `html[data-theme]` = `light`|`dark`, mémorisé dans `localStorage` (`wf.theme.v1`), défaut = `prefers-color-scheme`.
- Échec de chargement : timeout 15 s ; réponse sans aucune température exploitable ⇒ « Aucune prévision disponible pour ce lieu » (au lieu de « Chargement… » infini) ; ce résultat vide n'est pas mis en cache.

## 4. Détail (F4, F5, F6)
- J0 : pas **horaire**.
- J+1 → horizon : **demi-journée** (matin / après-midi).
- Badge modèle **par jour** (AROME HD → ARPEGE ; hors Europe : ARPEGE World). Horizon : J0 → J+3.
- Lien source : meteofrance.com (formats vérifiés le 2026-11-12 par requête HTTP).
  - Hors France : `/meteo-monde/{slug}/{geonamesId}` — 200 pour Toronto, Rovaniemi, Lappeenranta. **Le slug compte** (`/meteo-monde/xyz/6167865` → 404). **Winnipeg (6183235) → 404** quel que soit le slug testé ⇒ lien masqué (liste `SANS_LIEN_METEOFRANCE`, décision PO 2026-11-12).
  - France : `/previsions-meteo-france/{slug}/{code postal}` — 200 pour lyon/69000, le-grand-bornand/74450, les-deux-alpes/38520, bourg-saint-maurice/73700 (Arc 1800). **lyon/69001 → 404** ⇒ règle : code « xx000 » s'il existe, sinon premier code à 5 chiffres hors CEDEX (non garanti pour toute commune).
- Changement de catégorie Villes ↔ Montagne depuis le détail (ou la liste).
- Montagne : widget Snow-Forecast `https://www.snow-forecast.com/resorts/{slug}/forecasts/feed/mid/m` (HTML statique, sans script, pas de `X-Frame-Options`) dans une iframe `sandbox="allow-popups allow-popups-to-escape-sandbox"` (scripts interdits) + lien vers la page de la station.
- J+1 → J+3 : Matin = 06 h–12 h, Après-midi = 12 h–18 h, heure locale du lieu (validé PO 2026-11-12 ; la nuit n'est pas affichée).
- J0 : heures restantes à partir de l'heure locale du lieu.
- Ajout : onglet **Ville** (géocodage Open-Meteo, catégorie auto) ou onglet **Station** (uniquement `data/stations.json`). Une ville > 1 200 m ajoutée par géocodage devient Montagne **sans widget** (météo Open-Meteo seule).
  - Slugs vérifiés dans le sitemap Snow-Forecast le 2026-11-12. `Les-Arcs` couvre tout le domaine (pas de slug propre à Arc 1800).

## 5. Sources par zone
Endpoint unique : Open-Meteo `/v1/meteofrance`, modèle demandé explicitement.

| Zone | Modèle (`models=`) | Horizon |
|------|--------------------|---------|
| Domaine AROME (France + voisins) | `arome_france_hd` J0–J+1, puis `arpege_europe` | 4 j |
| Domaine ARPEGE Europe (ex. Finlande) | `arpege_europe` | 4 j |
| Ailleurs (ex. Winnipeg) | `arpege_world` | 4 j |

**Implémenté** : un seul appel par lieu avec `models=arome_france_hd,arpege_europe,arpege_world`. Pour chaque heure, le modèle retenu est le plus fin qui renvoie une température non nulle (un modèle hors domaine renvoie `null`) ⇒ pas de limites de domaine codées en dur. Les autres variables viennent de ce modèle, sinon du suivant (repli par variable). Badge du jour = modèles rencontrés dans la journée (ex. « AROME HD → ARPEGE Europe »).
- Hypothèse non vérifiée en live : le quota Open-Meteo du proxy de dev était épuisé le 2026-11-12 (« Daily API request limit exceeded ») ; l'UI a été testée avec des réponses simulées. **À valider en navigateur** : noms des clés suffixées et valeurs `null` hors domaine.
- Icône d'une période : code WMO le plus grave présent ≥ 2 h (≥ 1 h si < 6 h de données).

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
- Rafraîchissement : au chargement + bouton « Actualiser » (ignore le cache). Cache `localStorage` 30 min par lieu.
- Ajout : validé par `validerLieu`, refusé au-delà de 50 lieux (message). Chargement localStorage : liste tronquée à 50 au lieu d'être rejetée.
- Export / import : fichier JSON `{ app, version, exporteLe, lieux }`. Import : max 100 Ko, 50 lieux, validation champ par champ, remplace la liste après confirmation.

## 7. Design system (Névé)
- Réutilisable tel quel : `tokens.css`, polices, icônes, couleurs, rayons, `.mono` pour les chiffres.
- **Adapté (v0.3, 2026-11-12)** : en-tête web `.app-header` (56 px) à la place de la barre de titre Electron ; `.container` responsive (marges 16/24/32 px) ; zones sûres iPhone ; cibles tactiles 44 px ; typo réduite < 600 px ; thème sombre via `prefers-color-scheme` / `data-theme` ; sélection de texte réactivée.
- Non modifié : la page canvas « Design System Montagne » (maquettes), qui peut encore montrer un cadre de fenêtre desktop.

## 8. Sécurité
- CSP (balise `<meta>`, injectée au build) : `default-src 'self'; script-src 'self'; style-src 'self'; connect-src` Open-Meteo (API + géocodage) ; `frame-src https://www.snow-forecast.com` ; `object-src 'none'; base-uri 'self'; form-action 'none'`. Limite : `frame-ancestors` non applicable via `<meta>`.
- Données importées et `localStorage` traitées comme non fiables : validation stricte ; slug Snow-Forecast accepté seulement s'il figure dans `data/stations.json`.
- Requêtes `fetch` en `referrerPolicy: no-referrer`. Aucun secret, aucun backend.
- Liens externes : `rel="noopener noreferrer"`.
- `security-audit` uniquement sur demande explicite du PO.

## 9. Questions ouvertes
1. Valider en navigateur la réponse multi-modèles d'Open-Meteo (quota épuisé côté dev).
- Tranché : demi-journées 06–12 / 12–18 ; lien Météo-France Winnipeg masqué.
- Tranché : format d'URL meteofrance.com France ; attribution du modèle sans limites de domaine codées en dur.
- Tranché : V1 100 % Météo-France ; liste initiale de 7 lieux (§5 bis) ; stations françaises uniquement, liste manuelle (`data/stations.json`).
- Tranché : stockage `localStorage` + export/import JSON (V1) ; synchro type Turso plus tard (nécessitera une authentification car l'URL est publique).

## 10. Historique
| Date | Version | Changement |
|------|---------|-----------|
| 2026-11-12 | 1.1 | Mise en production sur `main` sans security-audit (décision PO) ; audit désormais sur demande explicite uniquement |
| 2026-11-12 | 1.1-dev | Nom « Dashboard météo de Geoffroy », bascule clair/sombre, légende icônes au survol, correctif « Chargement… » infini (Winnipeg) |
| 2026-11-12 | 0.1 | Création squelette cadrage + specs |
| 2026-11-12 | 0.2 | Intégration des recommandations de sources |
| 2026-11-12 | 0.3 | Passage en app web, découpage des modèles France, Snow-Forecast, F7 |
| 2026-11-12 | 0.4 | DS adapté au web, responsive, repo public + GitHub Pages, lien meteofrance.com pour tous, catégorie modifiable |
| 2026-11-12 | 0.5 | V1 100 % Météo-France (4 j), liste initiale, export/import, vérification Snow-Forecast |
| 2026-11-12 | 0.6 | Liste des stations générée depuis le sitemap Snow-Forecast (sous réserve CGU) |
| 2026-11-12 | 1.0 | Mise en production GitHub Pages (run n°4) |
| 2026-11-12 | 1.0-rc | Poussé sur `main` ; déploiement Pages en attente d'activation ; archive audit run-1 + prompt de re-audit |
| 2026-11-12 | 1.0-dev.3 | H1/H2/H6 appliqués, ajout limité à 50 lieux, montée vite 8.3.5 / vitest 5.0.5, versions exactes épinglées |
| 2026-11-12 | 1.0-dev.2 | security-audit quick : 0 finding, 8 durcissements listés (non appliqués) |
| 2026-11-12 | 1.0-dev.1 | Demi-journées 06–12 / 12–18 validées, lien Météo-France Winnipeg masqué |
| 2026-11-12 | 1.0-dev | Développement V1 (F1–F8), URL Météo-France vérifiées, CSP, tests, workflow Pages |
| 2026-11-12 | 0.8 | Liste manuelle des stations (3 stations), specs prêtes pour le dev |
| 2026-11-12 | 0.7.1 | Stations limitées à la France ; jeu data.gouv.fr Nice Côte d'Azur écarté |
| 2026-11-12 | 0.7 | CGU + sitemap Snow-Forecast vérifiés, Rovaniemi = Ville, environnement réseau « weatherforecast » créé |
